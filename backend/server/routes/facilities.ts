/**
 * Facilities Routes - Facility + Location management
 * SSOT Section 5.6: Facilities & Locations
 */

import { Router, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { getDb } from '../database/schema.js';
import { authMiddleware, type AuthRequest, requireRole } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const facilitiesRouter = Router();
facilitiesRouter.use(authMiddleware);

/**
 * GET /api/facilities
 * List facilities (admin sees all, facility_admin sees own)
 */
facilitiesRouter.get(
  '/',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    let facilities;

    if (req.user!.role === 'platform_admin') {
      facilities = await db.prepare(`
        SELECT fa.*, c.name AS city_name, u.phone, u.status AS user_status
        FROM facility_accounts fa
        LEFT JOIN cities c ON fa.city_id = c.id
        LEFT JOIN users u ON fa.user_id = u.id
        ORDER BY fa.created_at DESC
      `).all();
    } else if (req.user!.role === 'facility_admin') {
      facilities = await db.prepare(`
        SELECT fa.*, c.name AS city_name
        FROM facility_accounts fa
        LEFT JOIN cities c ON fa.city_id = c.id
        WHERE fa.user_id = ?
      `).all(req.user!.userId);
    } else {
      facilities = await db.prepare(`
        SELECT fa.id, fa.name, fa.type, c.name AS city_name
        FROM facility_accounts fa
        LEFT JOIN cities c ON fa.city_id = c.id
        WHERE fa.verification_status = 'verified'
      `).all();
    }

    res.json({ facilities });
  }),
);

/**
 * GET /api/facilities/locations
 * Get locations for the current facility admin's facility
 */
facilitiesRouter.get(
  '/locations',
  requireRole('facility_admin', 'platform_admin'),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    let locations;

    if (req.user!.role === 'platform_admin') {
      locations = await db.prepare(`
        SELECT fl.*, fa.name AS facility_name
        FROM facility_locations fl
        JOIN facility_accounts fa ON fl.facility_id = fa.id
        ORDER BY fa.name, fl.name
      `).all();
    } else {
      const facility = await db.prepare<any>('SELECT id FROM facility_accounts WHERE user_id = ?').get(req.user!.userId);
      if (!facility) {
        res.status(404).json({ error: 'Facility not found' });
        return;
      }
      locations = await db.prepare('SELECT * FROM facility_locations WHERE facility_id = ? ORDER BY created_at DESC').all(facility.id);
    }

    res.json({ locations });
  }),
);

/**
 * GET /api/facilities/dashboard
 * Facility dashboard summary for the authenticated facility admin
 */
facilitiesRouter.get(
  '/dashboard',
  requireRole('facility_admin', 'platform_admin'),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();

    let posterId = req.user!.userId;
    if (req.user!.role === 'platform_admin' && req.query.userId) {
      posterId = String(req.query.userId);
    }

    const [openShifts, filledShifts, inProgressShifts, completedShifts, openBookings, locations] = await Promise.all([
      db.prepare<{ count: number }>(
        "SELECT COUNT(*)::int AS count FROM shifts WHERE poster_id = ? AND status = 'open'",
      ).get(posterId),
      db.prepare<{ count: number }>(
        "SELECT COUNT(*)::int AS count FROM shifts WHERE poster_id = ? AND status = 'booked'",
      ).get(posterId),
      db.prepare<{ count: number }>(
        "SELECT COUNT(*)::int AS count FROM shifts WHERE poster_id = ? AND status = 'in_progress'",
      ).get(posterId),
      db.prepare<{ count: number }>(
        "SELECT COUNT(*)::int AS count FROM shifts WHERE poster_id = ? AND status = 'completed'",
      ).get(posterId),
      db.prepare<{ count: number }>(
        "SELECT COUNT(*)::int AS count FROM bookings WHERE poster_id = ? AND status IN ('confirmed', 'in_progress')",
      ).get(posterId),
      db.prepare<{ count: number }>(`
        SELECT COUNT(*)::int AS count
        FROM facility_locations fl
        JOIN facility_accounts fa ON fl.facility_id = fa.id
        WHERE fa.user_id = ? AND fl.is_active = TRUE
      `).get(posterId),
    ]);

    res.json({
      openShifts: openShifts?.count ?? 0,
      filledShifts: filledShifts?.count ?? 0,
      inProgressShifts: inProgressShifts?.count ?? 0,
      completedShifts: completedShifts?.count ?? 0,
      activeBookings: openBookings?.count ?? 0,
      activeLocations: locations?.count ?? 0,
    });
  }),
);

/**
 * GET /api/facilities/:id
 */
facilitiesRouter.get(
  '/:id',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const facility = await db.prepare<any>(`
      SELECT fa.*, c.name AS city_name, p.name AS province_name
      FROM facility_accounts fa
      LEFT JOIN cities c ON fa.city_id = c.id
      LEFT JOIN provinces p ON c.province_id = p.id
      WHERE fa.id = ?
    `).get(req.params.id);

    if (!facility) {
      res.status(404).json({ error: 'Facility not found' });
      return;
    }

    facility.locations = await db.prepare('SELECT * FROM facility_locations WHERE facility_id = ? ORDER BY created_at DESC').all(facility.id);
    res.json(facility);
  }),
);

/**
 * POST /api/facilities/locations
 * Add a location to the facility
 */
facilitiesRouter.post(
  '/locations',
  requireRole('facility_admin', 'platform_admin'),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const { facilityId, name, address, latitude, longitude, geofenceRadiusM, qrRotateIntervalMin } = req.body;

    if (!name || !address || latitude === undefined || longitude === undefined) {
      res.status(400).json({ error: 'name, address, latitude, and longitude are required' });
      return;
    }

    let targetFacilityId = facilityId;
    if (req.user!.role === 'facility_admin') {
      const facility = await db.prepare<any>('SELECT id FROM facility_accounts WHERE user_id = ?').get(req.user!.userId);
      if (!facility) {
        res.status(404).json({ error: 'Facility not found' });
        return;
      }
      targetFacilityId = facility.id;
    }

    const locationId = uuidv4();
    const qrSecret = crypto.randomBytes(32).toString('hex');

    await db.prepare(`
      INSERT INTO facility_locations (
        id, facility_id, name, address, latitude, longitude,
        geofence_radius_m, qr_secret, qr_rotate_interval_min
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      locationId,
      targetFacilityId,
      name,
      address,
      latitude,
      longitude,
      geofenceRadiusM || 200,
      qrSecret,
      qrRotateIntervalMin || 5,
    );

    await logAudit({
      userId: req.user!.userId,
      action: 'create_location',
      entityType: 'facility_location',
      entityId: locationId,
    });

    res.status(201).json({ id: locationId, message: 'Location created' });
  }),
);

/**
 * PUT /api/facilities/locations/:id
 * Update a facility location
 */
facilitiesRouter.put(
  '/locations/:id',
  requireRole('facility_admin', 'platform_admin'),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const locationId = req.params.id;
    const { name, address, latitude, longitude, geofenceRadiusM, qrRotateIntervalMin, isActive } = req.body;

    if (req.user!.role === 'facility_admin') {
      const location = await db.prepare<any>(`
        SELECT fl.facility_id
        FROM facility_locations fl
        JOIN facility_accounts fa ON fl.facility_id = fa.id
        WHERE fl.id = ? AND fa.user_id = ?
      `).get(locationId, req.user!.userId);

      if (!location) {
        res.status(403).json({ error: 'You can only update your own facility locations' });
        return;
      }
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    if (name !== undefined) {
      fields.push('name = ?');
      values.push(name);
    }
    if (address !== undefined) {
      fields.push('address = ?');
      values.push(address);
    }
    if (latitude !== undefined) {
      fields.push('latitude = ?');
      values.push(latitude);
    }
    if (longitude !== undefined) {
      fields.push('longitude = ?');
      values.push(longitude);
    }
    if (geofenceRadiusM !== undefined) {
      fields.push('geofence_radius_m = ?');
      values.push(geofenceRadiusM);
    }
    if (qrRotateIntervalMin !== undefined) {
      fields.push('qr_rotate_interval_min = ?');
      values.push(qrRotateIntervalMin);
    }
    if (isActive !== undefined) {
      fields.push('is_active = ?');
      values.push(Boolean(isActive));
    }

    if (fields.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    await db.prepare(`UPDATE facility_locations SET ${fields.join(', ')} WHERE id = ?`).run(...values, locationId);

    await logAudit({
      userId: req.user!.userId,
      action: 'update_location',
      entityType: 'facility_location',
      entityId: locationId,
    });

    res.json({ message: 'Location updated' });
  }),
);

/**
 * DELETE /api/facilities/locations/:id
 * Soft-delete a facility location by marking it inactive
 */
facilitiesRouter.delete(
  '/locations/:id',
  requireRole('facility_admin', 'platform_admin'),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const locationId = req.params.id;

    if (req.user!.role === 'facility_admin') {
      const location = await db.prepare<any>(`
        SELECT fl.id
        FROM facility_locations fl
        JOIN facility_accounts fa ON fl.facility_id = fa.id
        WHERE fl.id = ? AND fa.user_id = ?
      `).get(locationId, req.user!.userId);

      if (!location) {
        res.status(403).json({ error: 'You can only delete your own facility locations' });
        return;
      }
    }

    await db.prepare(`
      UPDATE facility_locations
      SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(locationId);

    await logAudit({
      userId: req.user!.userId,
      action: 'delete_location',
      entityType: 'facility_location',
      entityId: locationId,
    });

    res.json({ message: 'Location deleted' });
  }),
);

/**
 * POST /api/facilities/locations/:id/rotate-qr
 * Generate new QR secret for a location
 */
facilitiesRouter.post(
  '/locations/:id/rotate-qr',
  requireRole('facility_admin', 'platform_admin'),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const locationId = req.params.id;

    if (req.user!.role === 'facility_admin') {
      const location = await db.prepare<any>(`
        SELECT fl.facility_id
        FROM facility_locations fl
        JOIN facility_accounts fa ON fl.facility_id = fa.id
        WHERE fl.id = ? AND fa.user_id = ?
      `).get(locationId, req.user!.userId);

      if (!location) {
        res.status(403).json({ error: 'You can only rotate QR codes for your own facility locations' });
        return;
      }
    }

    const newSecret = crypto.randomBytes(32).toString('hex');
    await db.prepare('UPDATE facility_locations SET qr_secret = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newSecret, locationId);

    await logAudit({
      userId: req.user!.userId,
      action: 'rotate_qr',
      entityType: 'facility_location',
      entityId: locationId,
    });

    res.json({ message: 'QR secret rotated', locationId });
  }),
);

/**
 * GET /api/facilities/locations/:id/qr-code
 * Get current QR code for check-in (time-based rotating)
 */
facilitiesRouter.get(
  '/locations/:id/qr-code',
  requireRole('facility_admin', 'platform_admin'),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const location = await db.prepare<any>('SELECT * FROM facility_locations WHERE id = ?').get(req.params.id);

    if (!location) {
      res.status(404).json({ error: 'Location not found' });
      return;
    }

    if (req.user!.role === 'facility_admin') {
      const facility = await db.prepare<any>('SELECT id FROM facility_accounts WHERE user_id = ?').get(req.user!.userId);
      if (!facility || location.facility_id !== facility.id) {
        res.status(403).json({ error: 'You can only access QR codes for your own facility locations' });
        return;
      }
    }

    const intervalMs = (location.qr_rotate_interval_min || 5) * 60 * 1000;
    const timeSlot = Math.floor(Date.now() / intervalMs);
    const qrPayload = crypto
      .createHmac('sha256', location.qr_secret)
      .update(`${location.id}:${timeSlot}`)
      .digest('hex');

    res.json({
      locationId: location.id,
      qrCode: qrPayload,
      validUntil: new Date((timeSlot + 1) * intervalMs).toISOString(),
    });
  }),
);
