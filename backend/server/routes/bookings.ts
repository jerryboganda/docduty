/**
 * Bookings Routes - Accept shifts, manage bookings
 * SSOT Section 5.6: Matching & Booking + Appendix E: State Machines
 */

import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config.js';
import { getDb } from '../database/schema.js';
import { isPgMemUrl } from '../database/pgmem.js';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';
import { processCancellationRefund } from '../utils/settlement.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const bookingsRouter = Router();
bookingsRouter.use(authMiddleware);

bookingsRouter.post('/accept', requireRole('doctor'), asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const { shiftId, shift_id, offerId } = req.body;
    const resolvedShiftId = shiftId || shift_id;

    if (!resolvedShiftId) {
      res.status(400).json({ error: 'shiftId is required' });
      return;
    }

    const result = await db.transaction(async () => {
      const shift = await db.prepare('SELECT * FROM shifts WHERE id = ? FOR UPDATE').get(resolvedShiftId) as any;
      if (!shift) throw new Error('Shift not found');
      if (shift.status !== 'open') throw new Error('Shift is no longer available');
      if (shift.poster_id === req.user!.userId) throw new Error('Cannot accept your own shift');

      const conflict = await db.prepare(`
        SELECT b.id FROM bookings b
        JOIN shifts s ON b.shift_id = s.id
        WHERE b.doctor_id = ? AND b.status IN ('confirmed', 'in_progress')
          AND s.start_time < ? AND s.end_time > ?
      `).get(req.user!.userId, shift.end_time, shift.start_time);
      if (conflict) throw new Error('You have a conflicting booking during this time');

      if (offerId) {
        await db.prepare("UPDATE offers SET status = 'accepted', responded_at = CURRENT_TIMESTAMP WHERE id = ? AND doctor_id = ?")
          .run(offerId, req.user!.userId);
      }

      const posterWallet = await db.prepare('SELECT * FROM wallets WHERE user_id = ? FOR UPDATE').get(shift.poster_id) as any;
      if (!posterWallet || posterWallet.balance_pkr < shift.total_price_pkr) {
        throw new Error('Insufficient balance for escrow hold');
      }
      const newBalancePkr = Number(posterWallet.balance_pkr) - Number(shift.total_price_pkr);
      const newHeldPkr = Number(posterWallet.held_pkr) + Number(shift.total_price_pkr);
      if (newBalancePkr < 0 || newHeldPkr < 0) {
        throw new Error('Insufficient balance for escrow hold');
      }

      const bookingId = uuidv4();
      await db.prepare(`
        INSERT INTO bookings (id, shift_id, doctor_id, poster_id, offer_id, status, total_price_pkr, platform_fee_pkr, payout_pkr)
        VALUES (?, ?, ?, ?, ?, 'confirmed', ?, ?, ?)
      `).run(
        bookingId,
        resolvedShiftId,
        req.user!.userId,
        shift.poster_id,
        offerId || null,
        shift.total_price_pkr,
        shift.platform_fee_pkr,
        shift.payout_pkr,
      );

      await db.prepare("UPDATE shifts SET status = 'booked', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(resolvedShiftId);
      await db.prepare("UPDATE offers SET status = 'expired' WHERE shift_id = ? AND status = 'pending' AND doctor_id != ?")
        .run(resolvedShiftId, req.user!.userId);

      await db.prepare("UPDATE wallets SET balance_pkr = ?, held_pkr = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .run(newBalancePkr, newHeldPkr, posterWallet.id);

      await db.prepare(`INSERT INTO ledger_transactions (id, wallet_id, booking_id, type, amount_pkr, direction, description)
        VALUES (?, ?, ?, 'escrow_hold', ?, 'debit', 'Escrow hold for booking')`)
        .run(uuidv4(), posterWallet.id, bookingId, shift.total_price_pkr);

      await db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, body, data)
        VALUES (?, ?, 'booking_confirmed', 'Booking Confirmed', ?, ?)
      `).run(
        uuidv4(),
        shift.poster_id,
        `Your shift "${shift.title}" has been accepted`,
        { bookingId, shiftId: resolvedShiftId },
      );

      return { bookingId };
    })();

    await logAudit({ userId: req.user!.userId, action: 'accept_shift', entityType: 'booking', entityId: result.bookingId });

    res.status(201).json({
      bookingId: result.bookingId,
      shiftId: resolvedShiftId,
      status: 'confirmed',
      message: 'Shift accepted successfully',
    });
  } catch (err: any) {
    console.error('[Bookings Accept]', err.message);
    const statusCode = err.message.includes('not found') || err.message.includes('no longer') ? 409 : 500;
    res.status(statusCode).json({ error: err.message });
  }
}));

bookingsRouter.post('/counter', requireRole('doctor'), asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const { shiftId, shift_id, counterAmountPkr, proposed_amount } = req.body;
    const resolvedShiftId = shiftId || shift_id;
    const amount = counterAmountPkr || proposed_amount;

    if (!resolvedShiftId || !amount) {
      res.status(400).json({ error: 'shiftId and counterAmountPkr are required' });
      return;
    }

    const shift = await db.prepare('SELECT * FROM shifts WHERE id = ?').get(resolvedShiftId) as any;
    if (!shift) { res.status(404).json({ error: 'Shift not found' }); return; }
    if (shift.status !== 'open') { res.status(400).json({ error: 'Shift not available' }); return; }
    if (!shift.counter_offer_allowed) { res.status(400).json({ error: 'Counter offers not allowed for this shift' }); return; }

    const offerId = uuidv4();
    await db.prepare(`
      INSERT INTO offers (id, shift_id, doctor_id, type, counter_amount_pkr, status)
      VALUES (?, ?, ?, 'counter', ?, 'pending')
    `).run(offerId, resolvedShiftId, req.user!.userId, amount);

    await db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, body, data)
      VALUES (?, ?, 'counter_offer', 'Counter Offer Received', ?, ?)
    `).run(
      uuidv4(),
      shift.poster_id,
      `A doctor has sent a counter offer of PKR ${amount}`,
      { shiftId: resolvedShiftId, offerId },
    );

    res.status(201).json({ offerId, message: 'Counter offer submitted' });
  } catch (err: any) {
    console.error('[Bookings Counter]', err.message);
    res.status(500).json({ error: 'Failed to submit counter offer' });
  }
}));

bookingsRouter.put('/offers/:offerId/respond', requireRole('facility_admin', 'doctor', 'platform_admin'), asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const { action } = req.body;

    if (!['accept', 'reject'].includes(action)) {
      res.status(400).json({ error: 'action must be accept or reject' });
      return;
    }

    const offer = await db.prepare('SELECT * FROM offers WHERE id = ?').get(req.params.offerId) as any;
    if (!offer) { res.status(404).json({ error: 'Offer not found' }); return; }
    if (offer.status !== 'pending') { res.status(400).json({ error: 'Offer is no longer pending' }); return; }

    const shift = await db.prepare('SELECT * FROM shifts WHERE id = ?').get(offer.shift_id) as any;
    if (!shift) { res.status(404).json({ error: 'Shift not found' }); return; }
    if (shift.poster_id !== req.user!.userId && req.user!.role !== 'platform_admin') {
      res.status(403).json({ error: 'Only the shift poster can respond to counter offers' });
      return;
    }

    if (action === 'reject') {
      await db.prepare("UPDATE offers SET status = 'rejected', responded_at = CURRENT_TIMESTAMP WHERE id = ?")
        .run(offer.id);

      await db.prepare(`INSERT INTO notifications (id, user_id, type, title, body, data) VALUES (?, ?, 'counter_rejected', 'Counter Offer Rejected', ?, ?)`)
        .run(uuidv4(), offer.doctor_id, 'Your counter offer was not accepted', { shiftId: shift.id, offerId: offer.id });

      res.json({ message: 'Counter offer rejected' });
      return;
    }

    const result = await db.transaction(async () => {
      const lockedShift = await db.prepare('SELECT * FROM shifts WHERE id = ? FOR UPDATE').get(shift.id) as any;
      if (!lockedShift || lockedShift.status !== 'open') throw new Error('Shift is no longer available');

      const counterPrice = offer.counter_amount_pkr;
      const commissionPct = parseInt(
        (await db.prepare("SELECT value FROM policy_config WHERE key = 'platform_commission_pct'").get() as any)?.value || '10',
        10,
      );
      const minFee = parseInt(
        (await db.prepare("SELECT value FROM policy_config WHERE key = 'min_platform_fee_pkr'").get() as any)?.value || '200',
        10,
      );
      const calculatedFee = Math.round(counterPrice * commissionPct / 100);
      const platformFeePkr = Math.max(calculatedFee, minFee);
      const payoutPkr = counterPrice - platformFeePkr;

      const posterWallet = await db.prepare('SELECT * FROM wallets WHERE user_id = ? FOR UPDATE').get(lockedShift.poster_id) as any;
      if (!posterWallet || posterWallet.balance_pkr < counterPrice) {
        throw new Error('Insufficient balance for escrow hold');
      }
      const newBalancePkr = Number(posterWallet.balance_pkr) - Number(counterPrice);
      const newHeldPkr = Number(posterWallet.held_pkr) + Number(counterPrice);
      if (newBalancePkr < 0 || newHeldPkr < 0) {
        throw new Error('Insufficient balance for escrow hold');
      }

      await db.prepare("UPDATE offers SET status = 'accepted', responded_at = CURRENT_TIMESTAMP WHERE id = ?").run(offer.id);
      await db.prepare("UPDATE shifts SET total_price_pkr = ?, platform_fee_pkr = ?, payout_pkr = ?, status = 'booked', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .run(counterPrice, platformFeePkr, payoutPkr, lockedShift.id);
      await db.prepare("UPDATE offers SET status = 'expired' WHERE shift_id = ? AND status = 'pending' AND id != ?")
        .run(lockedShift.id, offer.id);

      const bookingId = uuidv4();
      await db.prepare(`INSERT INTO bookings (id, shift_id, doctor_id, poster_id, offer_id, status, total_price_pkr, platform_fee_pkr, payout_pkr)
        VALUES (?, ?, ?, ?, ?, 'confirmed', ?, ?, ?)`)
        .run(bookingId, lockedShift.id, offer.doctor_id, lockedShift.poster_id, offer.id, counterPrice, platformFeePkr, payoutPkr);

      await db.prepare("UPDATE wallets SET balance_pkr = ?, held_pkr = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .run(newBalancePkr, newHeldPkr, posterWallet.id);
      await db.prepare(`INSERT INTO ledger_transactions (id, wallet_id, booking_id, type, amount_pkr, direction, description)
        VALUES (?, ?, ?, 'escrow_hold', ?, 'debit', 'Escrow hold for counter-offer acceptance')`)
        .run(uuidv4(), posterWallet.id, bookingId, counterPrice);

      await db.prepare(`INSERT INTO notifications (id, user_id, type, title, body, data) VALUES (?, ?, 'counter_accepted', 'Counter Offer Accepted!', ?, ?)`)
        .run(uuidv4(), offer.doctor_id, `Your counter offer of PKR ${counterPrice} was accepted`, { bookingId, shiftId: lockedShift.id });

      return { bookingId };
    })();

    await logAudit({ userId: req.user!.userId, action: 'accept_counter_offer', entityType: 'booking', entityId: result.bookingId });
    res.json({ bookingId: result.bookingId, message: 'Counter offer accepted, booking confirmed' });
  } catch (err: any) {
    console.error('[Counter Respond]', err.message);
    res.status(err.message.includes('no longer') ? 409 : 500).json({ error: err.message });
  }
}));

bookingsRouter.get('/offers', asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    let where = "WHERE o.type = 'counter' AND o.status = 'pending'";
    const params: any[] = [];

    if (req.user!.role === 'facility_admin' || req.user!.role === 'doctor') {
      where += ' AND s.poster_id = ?';
      params.push(req.user!.userId);
    }

    const offers = await db.prepare(`
      SELECT o.*, s.title as shift_title, s.total_price_pkr as original_price,
        dp.full_name as doctor_name, dp.reliability_score, dp.rating_avg
      FROM offers o
      JOIN shifts s ON o.shift_id = s.id
      LEFT JOIN doctor_profiles dp ON dp.user_id = o.doctor_id
      ${where}
      ORDER BY o.created_at DESC
    `).all(...params);

    res.json({ offers });
  } catch (err: any) {
    console.error('[Offers List]', err.message);
    res.status(500).json({ error: 'Failed to list offers' });
  }
}));

bookingsRouter.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const { status, page = '1', limit = '20' } = req.query;

    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (req.user!.role === 'doctor') {
      where += ' AND b.doctor_id = ?';
      params.push(req.user!.userId);
    } else if (req.user!.role === 'facility_admin') {
      where += ' AND b.poster_id = ?';
      params.push(req.user!.userId);
    }

    if (status) { where += ' AND b.status = ?'; params.push(status); }

    const parsedLimit = parseInt(limit as string, 10);
    const parsedPage = parseInt(page as string, 10);
    const offset = (parsedPage - 1) * parsedLimit;
    const total = (await db.prepare<{ count: number }>(`SELECT COUNT(*)::int as count FROM bookings b ${where}`).get(...params))?.count || 0;

    const bookings = isPgMemUrl(env.databaseUrl)
      ? await db.prepare(`
        SELECT b.*
        FROM bookings b
        ${where}
        ORDER BY b.created_at DESC
        LIMIT ? OFFSET ?
      `).all(...params, parsedLimit, offset)
      : await db.prepare(`
        SELECT b.*,
          s.title as shift_title, s.type as shift_type, s.start_time, s.end_time,
          s.department, s.urgency,
          dp.full_name as doctor_name, dp.reliability_score as doctor_reliability,
          sp.name as specialty_name,
          fl.name as location_name, fl.address as location_address
        FROM bookings b
        JOIN shifts s ON b.shift_id = s.id
        LEFT JOIN doctor_profiles dp ON dp.user_id = b.doctor_id
        LEFT JOIN specialties sp ON s.specialty_id = sp.id
        LEFT JOIN facility_locations fl ON s.facility_location_id = fl.id
        ${where}
        ORDER BY b.created_at DESC
        LIMIT ? OFFSET ?
      `).all(...params, parsedLimit, offset);

    if (isPgMemUrl(env.databaseUrl)) {
      for (const booking of bookings as any[]) {
        const shift = await db.prepare(`
          SELECT title as shift_title, type as shift_type, start_time, end_time, department, urgency
          FROM shifts
          WHERE id = ?
        `).get(booking.shift_id) as any;

        if (shift) {
          Object.assign(booking, shift);
        }
      }
    }

    res.json({ bookings, total, page: parsedPage, limit: parsedLimit });
  } catch (err: any) {
    console.error('[Bookings List]', err.message);
    res.status(500).json({ error: 'Failed to list bookings' });
  }
}));

bookingsRouter.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const booking = await db.prepare(`
      SELECT b.*,
        s.title as shift_title, s.type as shift_type, s.start_time, s.end_time,
        s.department, s.urgency, s.description as shift_description,
        s.requirements, s.facility_location_id,
        dp.full_name as doctor_name, dp.reliability_score, dp.rating_avg as doctor_rating,
        dp.pmdc_license, dp.experience_years,
        sp.name as specialty_name,
        fl.name as location_name, fl.address as location_address,
        fl.latitude as location_lat, fl.longitude as location_lng, fl.geofence_radius_m
      FROM bookings b
      JOIN shifts s ON b.shift_id = s.id
      LEFT JOIN doctor_profiles dp ON dp.user_id = b.doctor_id
      LEFT JOIN specialties sp ON s.specialty_id = sp.id
      LEFT JOIN facility_locations fl ON s.facility_location_id = fl.id
      WHERE b.id = ?
    `).get(req.params.id) as any;

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    if (
      req.user!.role !== 'platform_admin' &&
      booking.doctor_id !== req.user!.userId &&
      booking.poster_id !== req.user!.userId
    ) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    booking.attendanceEvents = await db.prepare(`
      SELECT * FROM attendance_events WHERE booking_id = ? ORDER BY recorded_at ASC
    `).all(booking.id);

    res.json(booking);
  } catch (err: any) {
    console.error('[Bookings Get]', err.message);
    res.status(500).json({ error: 'Failed to get booking' });
  }
}));

bookingsRouter.put('/:id/cancel', asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const booking = await db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id) as any;

    if (!booking) { res.status(404).json({ error: 'Booking not found' }); return; }
    if (!['confirmed', 'pending_payment'].includes(booking.status)) {
      res.status(400).json({ error: `Cannot cancel booking in ${booking.status} status` });
      return;
    }
    if (booking.doctor_id !== req.user!.userId && booking.poster_id !== req.user!.userId && req.user!.role !== 'platform_admin') {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    await db.transaction(async () => {
      await db.prepare("UPDATE bookings SET status = 'cancelled', cancelled_by = ?, cancellation_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .run(req.user!.userId, req.body.reason || 'Cancelled', booking.id);

      await db.prepare("UPDATE shifts SET status = 'open', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(booking.shift_id);

      const shift = await db.prepare('SELECT * FROM shifts WHERE id = ?').get(booking.shift_id) as any;
      if (shift) {
        await processCancellationRefund(booking, shift);
      }

      if (req.user!.userId === booking.doctor_id) {
        const cancelPenalty = parseInt(
          (await db.prepare("SELECT value FROM policy_config WHERE key = 'cancel_reliability_penalty'").get() as any)?.value || '10',
          10,
        );
        await db.prepare(`UPDATE doctor_profiles SET reliability_score = GREATEST(0, reliability_score - ?), updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`)
          .run(cancelPenalty, booking.doctor_id);
      }

      const otherPartyId = req.user!.userId === booking.doctor_id ? booking.poster_id : booking.doctor_id;
      const cancellerRole = req.user!.userId === booking.doctor_id ? 'doctor' : 'facility';
      await db.prepare(`INSERT INTO notifications (id, user_id, type, title, body, data) VALUES (?, ?, 'booking_cancelled', 'Booking Cancelled', ?, ?)`)
        .run(uuidv4(), otherPartyId, `The ${cancellerRole} has cancelled the booking`, { bookingId: booking.id });
    })();

    await logAudit({ userId: req.user!.userId, action: 'cancel_booking', entityType: 'booking', entityId: booking.id });
    res.json({ message: 'Booking cancelled' });
  } catch (err: any) {
    console.error('[Bookings Cancel]', err.message);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
}));
