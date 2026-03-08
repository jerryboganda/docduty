/**
 * Attendance Routes - Check-in/out with geofence + QR validation
 * SSOT Section 13: Attendance Verification (Geo + QR)
 */

import { Router, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { getDb } from '../database/schema.js';
import { authMiddleware, type AuthRequest, requireRole } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';
import { processSettlement } from '../utils/settlement.js';
import { asyncHandler } from '../utils/asyncHandler.js';

type PolicyRow = { value: string };

export const attendanceRouter = Router();
attendanceRouter.use(authMiddleware);

async function getNumericPolicy(key: string, fallback: number): Promise<number> {
  const db = getDb();
  const policy = await db.prepare<PolicyRow>('SELECT value FROM policy_config WHERE key = ?').get(key);
  const parsed = Number.parseInt(policy?.value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Haversine distance calculation (meters)
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const earthRadiusMeters = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Validate QR code against facility location secret
 */
function validateQrCode(locationId: string, qrSecret: string, qrCode: string, rotateIntervalMin: number): boolean {
  const intervalMs = rotateIntervalMin * 60 * 1000;
  const currentSlot = Math.floor(Date.now() / intervalMs);

  for (const slot of [currentSlot, currentSlot - 1]) {
    const expected = crypto
      .createHmac('sha256', qrSecret)
      .update(`${locationId}:${slot}`)
      .digest('hex');
    if (expected === qrCode) {
      return true;
    }
  }

  return false;
}

/**
 * POST /api/attendance/check-in
 * Doctor checks in at facility
 */
attendanceRouter.post(
  '/check-in',
  requireRole('doctor'),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const { bookingId, latitude, longitude, qrCode, deviceInfo } = req.body;

    if (!bookingId) {
      res.status(400).json({ error: 'bookingId is required' });
      return;
    }

    const booking = await db.prepare<any>(`
      SELECT b.*, s.start_time, s.end_time, s.facility_location_id,
        fl.latitude AS loc_lat, fl.longitude AS loc_lng,
        fl.geofence_radius_m, fl.qr_secret, fl.qr_rotate_interval_min
      FROM bookings b
      JOIN shifts s ON b.shift_id = s.id
      LEFT JOIN facility_locations fl ON s.facility_location_id = fl.id
      WHERE b.id = ? AND b.doctor_id = ?
    `).get(bookingId, req.user!.userId);

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    if (booking.status !== 'confirmed') {
      res.status(400).json({ error: `Cannot check in for booking in ${booking.status} status` });
      return;
    }

    const checkinWindowBefore = await getNumericPolicy('checkin_window_before_min', 15);
    const checkinWindowAfter = await getNumericPolicy('checkin_window_after_min', 15);

    const now = new Date();
    const shiftStart = new Date(booking.start_time);
    const windowStart = new Date(shiftStart.getTime() - checkinWindowBefore * 60_000);
    const windowEnd = new Date(shiftStart.getTime() + checkinWindowAfter * 60_000);

    let isLate = false;
    if (now < windowStart) {
      res.status(400).json({ error: `Check-in window opens at ${windowStart.toISOString()}` });
      return;
    }
    if (now > windowEnd) {
      res.status(400).json({ error: 'Check-in window has closed. You may be marked as no-show.' });
      return;
    }
    if (now > shiftStart) {
      isLate = true;
    }

    let geoValid = false;
    if (latitude !== undefined && longitude !== undefined && booking.loc_lat !== null && booking.loc_lng !== null) {
      const distance = haversineDistance(latitude, longitude, booking.loc_lat, booking.loc_lng);
      geoValid = distance <= (booking.geofence_radius_m || 200);
    }

    let qrValid = false;
    if (qrCode && booking.qr_secret) {
      qrValid = validateQrCode(
        booking.facility_location_id,
        booking.qr_secret,
        qrCode,
        booking.qr_rotate_interval_min || 5,
      );
    }

    const mockLocationDetected = deviceInfo?.mockLocationEnabled === true;
    const eventId = uuidv4();
    const latePenalty = isLate ? await getNumericPolicy('late_checkin_reliability_penalty', 5) : 0;

    await db.transaction(async () => {
      await db.prepare(`
        INSERT INTO attendance_events (
          id, booking_id, user_id, event_type, latitude, longitude,
          geo_valid, qr_code_scanned, qr_valid, device_info, mock_location_detected
        )
        VALUES (?, ?, ?, 'check_in', ?, ?, ?, ?, ?, ?, ?)
      `).run(
        eventId,
        bookingId,
        req.user!.userId,
        latitude ?? null,
        longitude ?? null,
        geoValid,
        qrCode || null,
        qrValid,
        deviceInfo || null,
        mockLocationDetected,
      );

      await db.prepare(`
        UPDATE bookings
        SET status = 'in_progress', check_in_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(bookingId);

      await db.prepare(`
        UPDATE shifts
        SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(booking.shift_id);

      if (isLate) {
        await db.prepare(`
          UPDATE doctor_profiles
          SET reliability_score = GREATEST(0, reliability_score - ?), updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `).run(latePenalty, req.user!.userId);
      }

      await db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, body, data)
        VALUES (?, ?, 'check_in', 'Doctor Checked In', ?, ?)
      `).run(
        uuidv4(),
        booking.poster_id,
        'The locum doctor has checked in for the shift',
        { bookingId },
      );

      await logAudit({
        userId: req.user!.userId,
        action: 'check_in',
        entityType: 'attendance',
        entityId: eventId,
      });
    })();

    res.json({
      eventId,
      geoValid,
      qrValid,
      isLate,
      mockLocationDetected,
      message: geoValid && qrValid ? 'Check-in successful' : 'Check-in recorded with warnings',
      warnings: [
        ...(!geoValid ? ['Geofence validation failed - you may not be at the facility'] : []),
        ...(!qrValid ? ['QR validation failed - invalid or expired code'] : []),
        ...(mockLocationDetected ? ['Mock location detected - this has been flagged'] : []),
        ...(isLate ? ['Late check-in recorded'] : []),
      ],
    });
  }),
);

/**
 * POST /api/attendance/check-out
 */
attendanceRouter.post(
  '/check-out',
  requireRole('doctor'),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const { bookingId, latitude, longitude, qrCode, deviceInfo } = req.body;

    if (!bookingId) {
      res.status(400).json({ error: 'bookingId is required' });
      return;
    }

    const booking = await db.prepare<any>(`
      SELECT b.*, s.start_time, s.end_time, s.facility_location_id,
        fl.latitude AS loc_lat, fl.longitude AS loc_lng,
        fl.geofence_radius_m, fl.qr_secret, fl.qr_rotate_interval_min
      FROM bookings b
      JOIN shifts s ON b.shift_id = s.id
      LEFT JOIN facility_locations fl ON s.facility_location_id = fl.id
      WHERE b.id = ? AND b.doctor_id = ?
    `).get(bookingId, req.user!.userId);

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    if (booking.status !== 'in_progress') {
      res.status(400).json({ error: `Cannot check out from booking in ${booking.status} status` });
      return;
    }

    const checkoutBefore = await getNumericPolicy('checkout_window_before_min', 10);
    const now = new Date();
    const shiftEnd = new Date(booking.end_time);
    const windowStart = new Date(shiftEnd.getTime() - checkoutBefore * 60_000);

    if (now < windowStart) {
      res.status(400).json({ error: `Checkout window opens at ${windowStart.toISOString()}` });
      return;
    }

    let geoValid = false;
    if (latitude !== undefined && longitude !== undefined && booking.loc_lat !== null && booking.loc_lng !== null) {
      const distance = haversineDistance(latitude, longitude, booking.loc_lat, booking.loc_lng);
      geoValid = distance <= (booking.geofence_radius_m || 200);
    }

    let qrValid = false;
    if (qrCode && booking.qr_secret) {
      qrValid = validateQrCode(
        booking.facility_location_id,
        booking.qr_secret,
        qrCode,
        booking.qr_rotate_interval_min || 5,
      );
    }

    const mockLocationDetected = deviceInfo?.mockLocationEnabled === true;
    const completionBonus = await getNumericPolicy('completion_reliability_bonus', 1);
    const maxScore = await getNumericPolicy('max_reliability_score', 100);
    const eventId = uuidv4();

    await db.transaction(async () => {
      await db.prepare(`
        INSERT INTO attendance_events (
          id, booking_id, user_id, event_type, latitude, longitude,
          geo_valid, qr_code_scanned, qr_valid, device_info, mock_location_detected
        )
        VALUES (?, ?, ?, 'check_out', ?, ?, ?, ?, ?, ?, ?)
      `).run(
        eventId,
        bookingId,
        req.user!.userId,
        latitude ?? null,
        longitude ?? null,
        geoValid,
        qrCode || null,
        qrValid,
        deviceInfo || null,
        mockLocationDetected,
      );

      await db.prepare(`
        UPDATE bookings
        SET status = 'completed', check_out_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(bookingId);

      await db.prepare(`
        UPDATE shifts
        SET status = 'completed', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(booking.shift_id);

      await processSettlement(booking);

      await db.prepare(`
        UPDATE doctor_profiles SET
          reliability_score = LEAST(?, reliability_score + ?),
          total_shifts_completed = total_shifts_completed + 1,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(maxScore, completionBonus, req.user!.userId);

      await db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, body, data)
        VALUES (?, ?, 'check_out', 'Shift Completed', 'The locum doctor has checked out. Settlement is being processed.', ?)
      `).run(uuidv4(), booking.poster_id, { bookingId });

      await logAudit({
        userId: req.user!.userId,
        action: 'check_out',
        entityType: 'attendance',
        entityId: eventId,
      });
    })();

    res.json({
      eventId,
      geoValid,
      qrValid,
      message: 'Check-out successful. Settlement processing.',
    });
  }),
);

/**
 * GET /api/attendance/:bookingId
 * Get attendance events for a booking
 */
attendanceRouter.get(
  '/:bookingId',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const booking = await db.prepare<any>('SELECT doctor_id, poster_id FROM bookings WHERE id = ?').get(req.params.bookingId);

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    if (
      req.user!.role !== 'platform_admin'
      && req.user!.userId !== booking.doctor_id
      && req.user!.userId !== booking.poster_id
    ) {
      res.status(403).json({ error: "You do not have access to this booking's attendance records" });
      return;
    }

    const events = await db.prepare(`
      SELECT ae.*, u.phone AS user_phone
      FROM attendance_events ae
      LEFT JOIN users u ON ae.user_id = u.id
      WHERE ae.booking_id = ?
      ORDER BY ae.recorded_at ASC
    `).all(req.params.bookingId);

    res.json({ events });
  }),
);

/**
 * POST /api/attendance/admin-override
 * Admin manual override for attendance
 */
attendanceRouter.post(
  '/admin-override',
  requireRole('platform_admin'),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const { bookingId, eventType, reason } = req.body;

    if (!bookingId || !eventType || !reason) {
      res.status(400).json({ error: 'bookingId, eventType, and reason are required' });
      return;
    }

    const eventId = uuidv4();

    await db.transaction(async () => {
      await db.prepare(`
        INSERT INTO attendance_events (
          id, booking_id, user_id, event_type, geo_valid, qr_valid,
          admin_override, admin_override_by, admin_override_reason
        )
        VALUES (?, ?, ?, ?, TRUE, TRUE, TRUE, ?, ?)
      `).run(eventId, bookingId, req.user!.userId, eventType, req.user!.userId, reason);

      if (eventType === 'check_in') {
        await db.prepare(`
          UPDATE bookings
          SET status = 'in_progress', check_in_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(bookingId);
      } else if (eventType === 'check_out') {
        const booking = await db.prepare<any>('SELECT * FROM bookings WHERE id = ?').get(bookingId);
        await db.prepare(`
          UPDATE bookings
          SET status = 'completed', check_out_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(bookingId);
        if (booking) {
          await processSettlement(booking);
        }
      }

      await logAudit({
        userId: req.user!.userId,
        action: 'attendance_override',
        entityType: 'attendance',
        entityId: eventId,
        newValue: { bookingId, eventType, reason },
      });
    })();

    res.json({ eventId, message: 'Override recorded' });
  }),
);

/**
 * POST /api/attendance/presence-ping
 * Periodic presence check during shift
 */
attendanceRouter.post(
  '/presence-ping',
  requireRole('doctor'),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const { bookingId, latitude, longitude, deviceInfo } = req.body;

    if (!bookingId) {
      res.status(400).json({ error: 'bookingId is required' });
      return;
    }

    const booking = await db.prepare<any>(`
      SELECT b.*, fl.latitude AS loc_lat, fl.longitude AS loc_lng, fl.geofence_radius_m
      FROM bookings b
      JOIN shifts s ON b.shift_id = s.id
      LEFT JOIN facility_locations fl ON s.facility_location_id = fl.id
      WHERE b.id = ? AND b.doctor_id = ? AND b.status = 'in_progress'
    `).get(bookingId, req.user!.userId);

    if (!booking) {
      res.status(404).json({ error: 'Active booking not found' });
      return;
    }

    let geoValid = false;
    if (latitude !== undefined && longitude !== undefined && booking.loc_lat !== null && booking.loc_lng !== null) {
      const distance = haversineDistance(latitude, longitude, booking.loc_lat, booking.loc_lng);
      geoValid = distance <= (booking.geofence_radius_m || 200);
    }

    const mockLocationDetected = deviceInfo?.mockLocationEnabled === true;
    const eventId = uuidv4();

    await db.prepare(`
      INSERT INTO attendance_events (
        id, booking_id, user_id, event_type, latitude, longitude,
        geo_valid, device_info, mock_location_detected
      )
      VALUES (?, ?, ?, 'presence_ping', ?, ?, ?, ?, ?)
    `).run(
      eventId,
      bookingId,
      req.user!.userId,
      latitude ?? null,
      longitude ?? null,
      geoValid,
      deviceInfo || null,
      mockLocationDetected,
    );

    res.json({ eventId, geoValid, message: 'Presence recorded' });
  }),
);
