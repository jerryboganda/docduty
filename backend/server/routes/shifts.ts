/**
 * Shifts Routes - Post, list, manage shifts
 * SSOT Section 5.6: Shifts + Section 12: Matching & Dispatch
 */

import { Router, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database/schema.js';
import { authMiddleware, type AuthRequest, requireRole } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';
import { processCancellationRefund } from '../utils/settlement.js';
import { asyncHandler } from '../utils/asyncHandler.js';

type PolicyRow = { value: string };

export const shiftsRouter = Router();
shiftsRouter.use(authMiddleware);

async function getNumericPolicy(key: string, fallback: number): Promise<number> {
  const db = getDb();
  const policy = await db.prepare<PolicyRow>('SELECT value FROM policy_config WHERE key = ?').get(key);
  const parsed = Number.parseInt(policy?.value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * POST /api/shifts
 * Create a new shift
 */
shiftsRouter.post(
  '/',
  requireRole('doctor', 'facility_admin'),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const {
      facilityLocationId,
      type,
      title,
      description,
      department,
      roleId,
      role: roleText,
      specialtyId,
      startTime,
      endTime,
      totalPricePkr,
      offeredRate,
      urgency,
      visibility,
      requirements,
      cityId,
      counterOfferAllowed,
      allowCounterOffers,
      skillIds,
      requiredSkills,
      notes,
    } = req.body;

    const shiftTitle = title || roleText || 'Shift';
    const shiftType = type || 'replacement';
    const price = totalPricePkr || offeredRate;
    const counterAllowed = counterOfferAllowed !== undefined
      ? Boolean(counterOfferAllowed)
      : allowCounterOffers !== undefined
        ? Boolean(allowCounterOffers)
        : true;
    const skills = Array.isArray(skillIds) ? skillIds : Array.isArray(requiredSkills) ? requiredSkills : [];
    const shiftDescription = description || notes || null;

    if (!startTime || !endTime || !price) {
      res.status(400).json({ error: 'startTime, endTime, and totalPricePkr/offeredRate are required' });
      return;
    }

    if (!['replacement', 'vacancy'].includes(shiftType)) {
      res.status(400).json({ error: 'type must be replacement or vacancy' });
      return;
    }

    const commissionPct = await getNumericPolicy('platform_commission_pct', 10);
    const minFee = await getNumericPolicy('min_platform_fee_pkr', 200);
    const calculatedFee = Math.round((price * commissionPct) / 100);
    const platformFeePkr = Math.max(calculatedFee, minFee);
    const payoutPkr = price - platformFeePkr;
    const shiftId = uuidv4();

    await db.transaction(async () => {
      await db.prepare(`
        INSERT INTO shifts (
          id, poster_id, facility_location_id, type, title, description, department,
          role_id, specialty_id, start_time, end_time, total_price_pkr, platform_fee_pkr,
          payout_pkr, urgency, status, visibility, requirements, city_id, counter_offer_allowed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?, ?)
      `).run(
        shiftId,
        req.user!.userId,
        facilityLocationId || null,
        shiftType,
        shiftTitle,
        shiftDescription,
        department || null,
        roleId || null,
        specialtyId || null,
        startTime,
        endTime,
        price,
        platformFeePkr,
        payoutPkr,
        urgency || 'normal',
        visibility || 'city',
        requirements || null,
        cityId || null,
        counterAllowed,
      );

      if (skills.length > 0) {
        const insertSkill = db.prepare('INSERT INTO shift_skills (shift_id, skill_id) VALUES (?, ?)');
        for (const skillId of skills) {
          await insertSkill.run(shiftId, skillId);
        }
      }

      await logAudit({
        userId: req.user!.userId,
        action: 'create_shift',
        entityType: 'shift',
        entityId: shiftId,
      });
    })();

    await dispatchShift(shiftId, req.user!.userId);

    res.status(201).json({
      id: shiftId,
      title: shiftTitle,
      type: shiftType,
      totalPricePkr: price,
      platformFeePkr,
      payoutPkr,
      status: 'open',
      message: 'Shift posted successfully',
    });
  }),
);

/**
 * Dispatch shift to eligible doctors
 * SSOT Section 12: Matching & Dispatch
 */
async function dispatchShift(shiftId: string, posterId: string): Promise<void> {
  try {
    const db = getDb();
    const shift = await db.prepare<any>('SELECT * FROM shifts WHERE id = ?').get(shiftId);
    if (!shift) {
      return;
    }

    let query = `
      SELECT dp.*, u.id AS user_id, u.status AS user_status, u.verification_status
      FROM doctor_profiles dp
      JOIN users u ON dp.user_id = u.id
      WHERE u.role = 'doctor'
        AND u.status = 'active'
        AND u.id != ?
        AND dp.availability_status = 'available'
    `;
    const params: unknown[] = [posterId];

    if (shift.specialty_id) {
      query += ' AND dp.specialty_id = ?';
      params.push(shift.specialty_id);
    }

    if (shift.visibility !== 'national' && shift.city_id) {
      query += ' AND dp.city_id = ?';
      params.push(shift.city_id);
    }

    query += ` AND dp.user_id NOT IN (
      SELECT b.doctor_id
      FROM bookings b
      JOIN shifts s ON b.shift_id = s.id
      WHERE b.status IN ('confirmed', 'in_progress')
        AND s.start_time < ?
        AND s.end_time > ?
    )`;
    params.push(shift.end_time, shift.start_time);

    const requiredSkills = await db.prepare<{ skill_id: string }>(
      'SELECT skill_id FROM shift_skills WHERE shift_id = ?',
    ).all(shiftId);

    if (requiredSkills.length > 0) {
      const skillIds = requiredSkills.map((skill) => skill.skill_id);
      const placeholders = skillIds.map(() => '?').join(', ');
      query += ` AND dp.id IN (
        SELECT doctor_id
        FROM doctor_skills
        WHERE skill_id IN (${placeholders})
        GROUP BY doctor_id
        HAVING COUNT(DISTINCT skill_id) = ?
      )`;
      params.push(...skillIds, skillIds.length);
    }

    query += ' ORDER BY dp.reliability_score DESC NULLS LAST, dp.rating_avg DESC NULLS LAST LIMIT 20';

    const eligibleDoctors = await db.prepare<any>(query).all(...params);
    const insertOffer = db.prepare(`
      INSERT INTO offers (id, shift_id, doctor_id, type, status)
      VALUES (?, ?, ?, 'dispatch', 'pending')
    `);
    const insertNotification = db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, body, data)
      VALUES (?, ?, 'shift_offer', ?, ?, ?)
    `);

    for (const doctor of eligibleDoctors) {
      const offerId = uuidv4();
      await insertOffer.run(offerId, shiftId, doctor.user_id);
      await insertNotification.run(
        uuidv4(),
        doctor.user_id,
        'New Shift Available',
        `${shift.title} - PKR ${shift.payout_pkr}`,
        { shiftId, offerId },
      );
    }

    console.log(`[Dispatch] Shift ${shiftId}: dispatched to ${eligibleDoctors.length} doctors`);
  } catch (error) {
    const err = error as Error;
    console.error('[Dispatch Error]', err.message);
  }
}

/**
 * GET /api/shifts
 * List shifts with filters
 */
shiftsRouter.get(
  '/',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const { status, type, urgency, cityId, specialtyId, page = '1', limit = '20' } = req.query;

    let where = 'WHERE 1=1';
    const params: unknown[] = [];

    if (req.user!.role === 'doctor') {
      where += " AND (s.status = 'open' OR s.id IN (SELECT shift_id FROM bookings WHERE doctor_id = ?))";
      params.push(req.user!.userId);
    } else if (req.user!.role === 'facility_admin') {
      where += ' AND s.poster_id = ?';
      params.push(req.user!.userId);
    }

    if (status) {
      where += ' AND s.status = ?';
      params.push(status);
    }
    if (type) {
      where += ' AND s.type = ?';
      params.push(type);
    }
    if (urgency) {
      where += ' AND s.urgency = ?';
      params.push(urgency);
    }
    if (cityId) {
      where += ' AND s.city_id = ?';
      params.push(cityId);
    }
    if (specialtyId) {
      where += ' AND s.specialty_id = ?';
      params.push(specialtyId);
    }

    const search = req.query.search as string | undefined;
    if (search) {
      const like = `%${search}%`;
      where += ' AND (s.title ILIKE ? OR s.department ILIKE ? OR s.description ILIKE ?)';
      params.push(like, like, like);
    }

    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    if (startDate) {
      where += ' AND s.start_time >= ?';
      params.push(startDate);
    }
    if (endDate) {
      where += " AND s.end_time < (?::date + INTERVAL '1 day')";
      params.push(endDate);
    }

    const pageNumber = Number.parseInt(String(page), 10) || 1;
    const limitNumber = Number.parseInt(String(limit), 10) || 20;
    const offset = (pageNumber - 1) * limitNumber;

    const totalRow = await db.prepare<{ count: number }>(`SELECT COUNT(*)::int AS count FROM shifts s ${where}`).get(...params);
    const shifts = await db.prepare(`
      SELECT s.*,
        sp.name AS specialty_name,
        r.name AS role_name,
        c.name AS city_name,
        fl.name AS location_name,
        fl.address AS location_address,
        u.phone AS poster_phone
      FROM shifts s
      LEFT JOIN specialties sp ON s.specialty_id = sp.id
      LEFT JOIN roles r ON s.role_id = r.id
      LEFT JOIN cities c ON s.city_id = c.id
      LEFT JOIN facility_locations fl ON s.facility_location_id = fl.id
      LEFT JOIN users u ON s.poster_id = u.id
      ${where}
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limitNumber, offset);

    res.json({
      shifts,
      total: totalRow?.count ?? 0,
      page: pageNumber,
      limit: limitNumber,
    });
  }),
);

/**
 * GET /api/shifts/feed
 * Doctor shift feed - eligible shifts with offers
 */
shiftsRouter.get(
  '/feed',
  requireRole('doctor'),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const nowIso = new Date().toISOString();
    const shifts = await db.prepare(`
      SELECT s.*,
        sp.name AS specialty_name,
        r.name AS role_name,
        c.name AS city_name,
        fl.name AS location_name,
        fl.address AS location_address,
        o.id AS offer_id,
        o.status AS offer_status
      FROM shifts s
      LEFT JOIN specialties sp ON s.specialty_id = sp.id
      LEFT JOIN roles r ON s.role_id = r.id
      LEFT JOIN cities c ON s.city_id = c.id
      LEFT JOIN facility_locations fl ON s.facility_location_id = fl.id
      LEFT JOIN offers o ON o.shift_id = s.id AND o.doctor_id = ?
      WHERE s.status = 'open'
        AND s.start_time > ?
      ORDER BY s.urgency DESC, s.start_time ASC
      LIMIT 50
    `).all(req.user!.userId, nowIso);

    res.json({ shifts });
  }),
);

/**
 * GET /api/shifts/:id
 * Get shift details
 */
shiftsRouter.get(
  '/:id',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const shift = await db.prepare<any>(`
      SELECT s.*,
        sp.name AS specialty_name,
        r.name AS role_name,
        c.name AS city_name,
        fl.name AS location_name,
        fl.address AS location_address,
        fl.latitude AS location_lat,
        fl.longitude AS location_lng,
        fl.geofence_radius_m
      FROM shifts s
      LEFT JOIN specialties sp ON s.specialty_id = sp.id
      LEFT JOIN roles r ON s.role_id = r.id
      LEFT JOIN cities c ON s.city_id = c.id
      LEFT JOIN facility_locations fl ON s.facility_location_id = fl.id
      WHERE s.id = ?
    `).get(req.params.id);

    if (!shift) {
      res.status(404).json({ error: 'Shift not found' });
      return;
    }

    shift.skills = await db.prepare(`
      SELECT sk.id, sk.name
      FROM shift_skills ss
      JOIN skills sk ON ss.skill_id = sk.id
      WHERE ss.shift_id = ?
    `).all(shift.id);

    if (req.user!.userId === shift.poster_id || req.user!.role === 'platform_admin') {
      shift.offers = await db.prepare(`
        SELECT o.*, dp.full_name AS doctor_name, dp.reliability_score, dp.rating_avg
        FROM offers o
        LEFT JOIN doctor_profiles dp ON dp.user_id = o.doctor_id
        WHERE o.shift_id = ?
        ORDER BY o.created_at DESC
      `).all(shift.id);
    }

    shift.booking = await db.prepare('SELECT * FROM bookings WHERE shift_id = ?').get(shift.id) || null;

    res.json(shift);
  }),
);

/**
 * PUT /api/shifts/:id
 * Edit an open shift (before booking)
 */
shiftsRouter.put(
  '/:id',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const shift = await db.prepare<any>('SELECT * FROM shifts WHERE id = ?').get(req.params.id);

    if (!shift) {
      res.status(404).json({ error: 'Shift not found' });
      return;
    }
    if (shift.poster_id !== req.user!.userId && req.user!.role !== 'platform_admin') {
      res.status(403).json({ error: 'Only the poster can edit this shift' });
      return;
    }
    if (shift.status !== 'open') {
      res.status(400).json({ error: `Cannot edit shift in ${shift.status} status` });
      return;
    }

    const {
      title,
      description,
      department,
      roleId,
      specialtyId,
      startTime,
      endTime,
      totalPricePkr,
      offeredRate,
      urgency,
      visibility,
      requirements,
      cityId,
      counterOfferAllowed,
      skillIds,
    } = req.body;

    const price = totalPricePkr || offeredRate || shift.total_price_pkr;
    const commissionPct = await getNumericPolicy('platform_commission_pct', 10);
    const minFee = await getNumericPolicy('min_platform_fee_pkr', 200);
    const calculatedFee = Math.round((price * commissionPct) / 100);
    const platformFeePkr = Math.max(calculatedFee, minFee);
    const payoutPkr = price - platformFeePkr;

    await db.transaction(async () => {
      await db.prepare(`
        UPDATE shifts SET
          title = COALESCE(?, title),
          description = COALESCE(?, description),
          department = COALESCE(?, department),
          role_id = COALESCE(?, role_id),
          specialty_id = COALESCE(?, specialty_id),
          start_time = COALESCE(?, start_time),
          end_time = COALESCE(?, end_time),
          total_price_pkr = ?,
          platform_fee_pkr = ?,
          payout_pkr = ?,
          urgency = COALESCE(?, urgency),
          visibility = COALESCE(?, visibility),
          requirements = COALESCE(?, requirements),
          city_id = COALESCE(?, city_id),
          counter_offer_allowed = COALESCE(?, counter_offer_allowed),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        title ?? null,
        description ?? null,
        department ?? null,
        roleId ?? null,
        specialtyId ?? null,
        startTime ?? null,
        endTime ?? null,
        price,
        platformFeePkr,
        payoutPkr,
        urgency ?? null,
        visibility ?? null,
        requirements ?? null,
        cityId ?? null,
        counterOfferAllowed !== undefined ? Boolean(counterOfferAllowed) : null,
        req.params.id,
      );

      if (Array.isArray(skillIds)) {
        await db.prepare('DELETE FROM shift_skills WHERE shift_id = ?').run(req.params.id);
        const insertSkill = db.prepare('INSERT INTO shift_skills (shift_id, skill_id) VALUES (?, ?)');
        for (const skillId of skillIds) {
          await insertSkill.run(req.params.id, skillId);
        }
      }

      await logAudit({
        userId: req.user!.userId,
        action: 'edit_shift',
        entityType: 'shift',
        entityId: req.params.id,
      });
    })();

    res.json({ message: 'Shift updated successfully' });
  }),
);

/**
 * PUT /api/shifts/:id/cancel
 * Cancel a shift
 */
shiftsRouter.put(
  '/:id/cancel',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const shift = await db.prepare<any>('SELECT * FROM shifts WHERE id = ?').get(req.params.id);

    if (!shift) {
      res.status(404).json({ error: 'Shift not found' });
      return;
    }

    if (shift.poster_id !== req.user!.userId && req.user!.role !== 'platform_admin') {
      res.status(403).json({ error: 'Only the poster or admin can cancel' });
      return;
    }

    if (!['open', 'booked'].includes(shift.status)) {
      res.status(400).json({ error: `Cannot cancel shift in ${shift.status} status` });
      return;
    }

    const cancelPenalty = await getNumericPolicy('cancel_reliability_penalty', 10);

    await db.transaction(async () => {
      await db.prepare("UPDATE shifts SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(shift.id);
      await db.prepare("UPDATE offers SET status = 'expired' WHERE shift_id = ? AND status = 'pending'").run(shift.id);

      const booking = await db.prepare<any>(
        "SELECT * FROM bookings WHERE shift_id = ? AND status IN ('confirmed', 'pending_payment')",
      ).get(shift.id);

      if (booking) {
        await db.prepare(`
          UPDATE bookings SET
            status = 'cancelled',
            cancelled_by = ?,
            cancellation_reason = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(req.user!.userId, req.body.reason || 'Shift cancelled by poster', booking.id);

        await processCancellationRefund(booking, shift);

        await db.prepare(`
          INSERT INTO notifications (id, user_id, type, title, body, data)
          VALUES (?, ?, 'booking_cancelled', 'Shift Cancelled', ?, ?)
        `).run(
          uuidv4(),
          booking.doctor_id,
          `The shift "${shift.title}" has been cancelled by the poster`,
          { bookingId: booking.id, shiftId: shift.id },
        );

        if (req.user!.userId === booking.doctor_id) {
          await db.prepare(`
            UPDATE doctor_profiles
            SET reliability_score = GREATEST(0, reliability_score - ?), updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
          `).run(cancelPenalty, booking.doctor_id);
        }
      }

      await logAudit({
        userId: req.user!.userId,
        action: 'cancel_shift',
        entityType: 'shift',
        entityId: shift.id,
      });
    })();

    res.json({ message: 'Shift cancelled' });
  }),
);
