/**
 * Disputes Routes - Create, manage, resolve
 * SSOT Section 15: Disputes, Ratings, Reliability
 */

import { Router, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database/schema.js';
import { authMiddleware, type AuthRequest, requireRole } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';
import { asyncHandler } from '../utils/asyncHandler.js';

type PolicyRow = { value: string };

export const disputesRouter = Router();
disputesRouter.use(authMiddleware);

async function getNumericPolicy(key: string, fallback: number): Promise<number> {
  const db = getDb();
  const policy = await db.prepare<PolicyRow>('SELECT value FROM policy_config WHERE key = ?').get(key);
  const parsed = Number.parseInt(policy?.value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * POST /api/disputes
 * Raise a dispute
 */
disputesRouter.post(
  '/',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const { bookingId, type, description } = req.body;

    if (!bookingId || !type || !description) {
      res.status(400).json({ error: 'bookingId, type, and description are required' });
      return;
    }

    if (!['no_show', 'late', 'duty_mismatch', 'facility_issue', 'payment', 'other'].includes(type)) {
      res.status(400).json({ error: 'Invalid dispute type' });
      return;
    }

    const booking = await db.prepare<any>('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    if (
      req.user!.role !== 'platform_admin'
      && req.user!.userId !== booking.doctor_id
      && req.user!.userId !== booking.poster_id
    ) {
      res.status(403).json({ error: 'You can only raise disputes for bookings you are involved in' });
      return;
    }

    const raisedAgainst = req.user!.userId === booking.doctor_id ? booking.poster_id : booking.doctor_id;
    const disputeId = uuidv4();

    await db.transaction(async () => {
      await db.prepare(`
        INSERT INTO disputes (id, booking_id, raised_by, raised_against, type, description, status)
        VALUES (?, ?, ?, ?, ?, ?, 'open')
      `).run(disputeId, bookingId, req.user!.userId, raisedAgainst, type, description);

      if (['in_progress', 'completed'].includes(booking.status)) {
        await db.prepare("UPDATE bookings SET status = 'disputed', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(bookingId);
      }

      const attendanceLogs = await db.prepare('SELECT * FROM attendance_events WHERE booking_id = ?').all(bookingId);
      if (attendanceLogs.length > 0) {
        await db.prepare(`
          INSERT INTO dispute_evidence (id, dispute_id, type, content, submitted_by)
          VALUES (?, ?, 'attendance_log', ?, ?)
        `).run(uuidv4(), disputeId, JSON.stringify(attendanceLogs), req.user!.userId);
      }

      await db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, body, data)
        VALUES (?, ?, 'dispute_raised', 'Dispute Raised', ?, ?)
      `).run(
        uuidv4(),
        raisedAgainst,
        `A ${type} dispute has been raised for booking`,
        { disputeId, bookingId },
      );

      await logAudit({
        userId: req.user!.userId,
        action: 'raise_dispute',
        entityType: 'dispute',
        entityId: disputeId,
      });
    })();

    res.status(201).json({ disputeId, status: 'open', message: 'Dispute raised successfully' });
  }),
);

/**
 * GET /api/disputes
 * List disputes
 */
disputesRouter.get(
  '/',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const { status, type, page = '1', limit = '20' } = req.query;

    let where = 'WHERE 1=1';
    const params: unknown[] = [];

    if (req.user!.role !== 'platform_admin') {
      where += ' AND (d.raised_by = ? OR d.raised_against = ?)';
      params.push(req.user!.userId, req.user!.userId);
    }

    if (status) {
      where += ' AND d.status = ?';
      params.push(status);
    }
    if (type) {
      where += ' AND d.type = ?';
      params.push(type);
    }

    const pageNumber = Number.parseInt(String(page), 10) || 1;
    const limitNumber = Number.parseInt(String(limit), 10) || 20;
    const offset = (pageNumber - 1) * limitNumber;

    const totalRow = await db.prepare<{ count: number }>(`SELECT COUNT(*)::int AS count FROM disputes d ${where}`).get(...params);
    const disputes = await db.prepare(`
      SELECT d.*,
        s.title AS shift_title, s.start_time, s.end_time,
        rby.phone AS raised_by_phone,
        rag.phone AS raised_against_phone,
        dp_by.full_name AS raised_by_name,
        dp_ag.full_name AS raised_against_name
      FROM disputes d
      JOIN bookings b ON d.booking_id = b.id
      JOIN shifts s ON b.shift_id = s.id
      LEFT JOIN users rby ON d.raised_by = rby.id
      LEFT JOIN users rag ON d.raised_against = rag.id
      LEFT JOIN doctor_profiles dp_by ON dp_by.user_id = d.raised_by
      LEFT JOIN doctor_profiles dp_ag ON dp_ag.user_id = d.raised_against
      ${where}
      ORDER BY d.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limitNumber, offset);

    res.json({
      disputes,
      total: totalRow?.count ?? 0,
      page: pageNumber,
      limit: limitNumber,
    });
  }),
);

/**
 * GET /api/disputes/:id
 */
disputesRouter.get(
  '/:id',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const dispute = await db.prepare<any>(`
      SELECT d.*,
        s.title AS shift_title, s.start_time, s.end_time, s.total_price_pkr,
        b.status AS booking_status, b.check_in_time, b.check_out_time,
        rby.phone AS raised_by_phone,
        rag.phone AS raised_against_phone
      FROM disputes d
      JOIN bookings b ON d.booking_id = b.id
      JOIN shifts s ON b.shift_id = s.id
      LEFT JOIN users rby ON d.raised_by = rby.id
      LEFT JOIN users rag ON d.raised_against = rag.id
      WHERE d.id = ?
    `).get(req.params.id);

    if (!dispute) {
      res.status(404).json({ error: 'Dispute not found' });
      return;
    }

    if (
      req.user!.role !== 'platform_admin'
      && req.user!.userId !== dispute.raised_by
      && req.user!.userId !== dispute.raised_against
    ) {
      res.status(403).json({ error: 'You do not have access to this dispute' });
      return;
    }

    dispute.evidence = await db.prepare(
      'SELECT * FROM dispute_evidence WHERE dispute_id = ? ORDER BY created_at ASC',
    ).all(dispute.id);
    dispute.attendanceEvents = await db.prepare(
      'SELECT * FROM attendance_events WHERE booking_id = ? ORDER BY recorded_at ASC',
    ).all(dispute.booking_id);

    res.json(dispute);
  }),
);

/**
 * POST /api/disputes/:id/evidence
 * Submit additional evidence
 */
disputesRouter.post(
  '/:id/evidence',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const { type, content } = req.body;

    if (!type || !content) {
      res.status(400).json({ error: 'type and content are required' });
      return;
    }

    const dispute = await db.prepare<any>('SELECT * FROM disputes WHERE id = ?').get(req.params.id);
    if (!dispute) {
      res.status(404).json({ error: 'Dispute not found' });
      return;
    }

    if (
      req.user!.role !== 'platform_admin'
      && req.user!.userId !== dispute.raised_by
      && req.user!.userId !== dispute.raised_against
    ) {
      res.status(403).json({ error: 'You can only submit evidence to disputes you are involved in' });
      return;
    }

    const evidenceId = uuidv4();
    await db.prepare(`
      INSERT INTO dispute_evidence (id, dispute_id, type, content, submitted_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(evidenceId, req.params.id, type, String(content), req.user!.userId);

    res.status(201).json({ evidenceId, message: 'Evidence submitted' });
  }),
);

/**
 * PUT /api/disputes/:id/review
 * Admin moves dispute to under_review
 */
disputesRouter.put(
  '/:id/review',
  requireRole('platform_admin'),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const dispute = await db.prepare<any>('SELECT * FROM disputes WHERE id = ?').get(req.params.id);

    if (!dispute) {
      res.status(404).json({ error: 'Dispute not found' });
      return;
    }

    if (dispute.status !== 'open') {
      res.status(400).json({ error: `Cannot review dispute in ${dispute.status} status` });
      return;
    }

    await db.prepare("UPDATE disputes SET status = 'under_review', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(dispute.id);
    await logAudit({
      userId: req.user!.userId,
      action: 'review_dispute',
      entityType: 'dispute',
      entityId: dispute.id,
    });

    res.json({ message: 'Dispute moved to under review' });
  }),
);

/**
 * PUT /api/disputes/:id/resolve
 * Admin resolves a dispute
 */
disputesRouter.put(
  '/:id/resolve',
  requireRole('platform_admin'),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const { resolutionType, resolutionNotes } = req.body;

    if (!resolutionType) {
      res.status(400).json({ error: 'resolutionType is required' });
      return;
    }

    const dispute = await db.prepare<any>('SELECT * FROM disputes WHERE id = ?').get(req.params.id);
    if (!dispute) {
      res.status(404).json({ error: 'Dispute not found' });
      return;
    }

    const nextStatus = resolutionType === 'dismissed' ? 'dismissed' : 'resolved';

    await db.transaction(async () => {
      await db.prepare(`
        UPDATE disputes SET
          status = ?,
          resolution_type = ?,
          resolution_notes = ?,
          resolved_by = ?,
          resolved_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(nextStatus, resolutionType, resolutionNotes || null, req.user!.userId, dispute.id);

      await db.prepare("UPDATE bookings SET status = 'resolved', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(dispute.booking_id);

      const booking = await db.prepare<any>('SELECT * FROM bookings WHERE id = ?').get(dispute.booking_id);
      if (booking) {
        await processDisputeResolution(booking, resolutionType);
      }

      for (const userId of [dispute.raised_by, dispute.raised_against]) {
        await db.prepare(`
          INSERT INTO notifications (id, user_id, type, title, body, data)
          VALUES (?, ?, 'dispute_resolved', 'Dispute Resolved', ?, ?)
        `).run(uuidv4(), userId, `Dispute resolved: ${resolutionType}`, { disputeId: dispute.id });
      }

      await logAudit({
        userId: req.user!.userId,
        action: 'resolve_dispute',
        entityType: 'dispute',
        entityId: dispute.id,
        newValue: { resolutionType, resolutionNotes, status: nextStatus },
      });
    })();

    res.json({ message: 'Dispute resolved', resolutionType, status: nextStatus });
  }),
);

async function processDisputeResolution(booking: any, resolutionType: string): Promise<void> {
  const db = getDb();
  const doctorWallet = await db.prepare<any>('SELECT * FROM wallets WHERE user_id = ?').get(booking.doctor_id);
  const posterWallet = await db.prepare<any>('SELECT * FROM wallets WHERE user_id = ?').get(booking.poster_id);
  const alreadySettled = Boolean(booking.settled_at);

  switch (resolutionType) {
    case 'full_payout':
      if (!alreadySettled && doctorWallet) {
        await db.prepare(`
          UPDATE wallets
          SET balance_pkr = balance_pkr + ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(booking.payout_pkr, doctorWallet.id);
        await db.prepare(`
          INSERT INTO ledger_transactions (id, wallet_id, booking_id, type, amount_pkr, direction, description)
          VALUES (?, ?, ?, 'payout', ?, 'credit', 'Dispute resolution: full payout')
        `).run(uuidv4(), doctorWallet.id, booking.id, booking.payout_pkr);

        if (posterWallet) {
          await db.prepare(`
            UPDATE wallets
            SET held_pkr = GREATEST(0, held_pkr - ?), updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(booking.total_price_pkr, posterWallet.id);
        }
      }
      break;

    case 'partial_payout': {
      const partialAmount = Math.round(booking.payout_pkr * 0.5);
      if (alreadySettled && doctorWallet) {
        const clawback = booking.payout_pkr - partialAmount;
        await db.prepare(`
          UPDATE wallets
          SET balance_pkr = GREATEST(0, balance_pkr - ?), updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(clawback, doctorWallet.id);
        await db.prepare(`
          INSERT INTO ledger_transactions (id, wallet_id, booking_id, type, amount_pkr, direction, description)
          VALUES (?, ?, ?, 'adjustment', ?, 'debit', 'Dispute resolution: partial payout clawback')
        `).run(uuidv4(), doctorWallet.id, booking.id, clawback);

        if (posterWallet) {
          await db.prepare(`
            UPDATE wallets
            SET balance_pkr = balance_pkr + ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(clawback, posterWallet.id);
          await db.prepare(`
            INSERT INTO ledger_transactions (id, wallet_id, booking_id, type, amount_pkr, direction, description)
            VALUES (?, ?, ?, 'refund', ?, 'credit', 'Dispute resolution: partial refund after settlement')
          `).run(uuidv4(), posterWallet.id, booking.id, clawback);
        }
      } else if (doctorWallet) {
        await db.prepare(`
          UPDATE wallets
          SET balance_pkr = balance_pkr + ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(partialAmount, doctorWallet.id);
        await db.prepare(`
          INSERT INTO ledger_transactions (id, wallet_id, booking_id, type, amount_pkr, direction, description)
          VALUES (?, ?, ?, 'payout', ?, 'credit', 'Dispute resolution: partial payout (50%)')
        `).run(uuidv4(), doctorWallet.id, booking.id, partialAmount);

        const remaining = booking.payout_pkr - partialAmount;
        if (posterWallet && remaining > 0) {
          await db.prepare(`
            UPDATE wallets
            SET balance_pkr = balance_pkr + ?, held_pkr = GREATEST(0, held_pkr - ?), updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(remaining, booking.total_price_pkr, posterWallet.id);
          await db.prepare(`
            INSERT INTO ledger_transactions (id, wallet_id, booking_id, type, amount_pkr, direction, description)
            VALUES (?, ?, ?, 'refund', ?, 'credit', 'Dispute resolution: partial refund (50%)')
          `).run(uuidv4(), posterWallet.id, booking.id, remaining);
        }
      }
      break;
    }

    case 'full_refund':
      if (alreadySettled) {
        if (doctorWallet) {
          await db.prepare(`
            UPDATE wallets
            SET balance_pkr = GREATEST(0, balance_pkr - ?), updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(booking.payout_pkr, doctorWallet.id);
          await db.prepare(`
            INSERT INTO ledger_transactions (id, wallet_id, booking_id, type, amount_pkr, direction, description)
            VALUES (?, ?, ?, 'adjustment', ?, 'debit', 'Dispute resolution: full refund clawback')
          `).run(uuidv4(), doctorWallet.id, booking.id, booking.payout_pkr);
        }
      } else if (posterWallet) {
        await db.prepare(`
          UPDATE wallets
          SET held_pkr = GREATEST(0, held_pkr - ?), updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(booking.total_price_pkr, posterWallet.id);
      }

      if (posterWallet) {
        await db.prepare(`
          UPDATE wallets
          SET balance_pkr = balance_pkr + ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(booking.total_price_pkr, posterWallet.id);
        await db.prepare(`
          INSERT INTO ledger_transactions (id, wallet_id, booking_id, type, amount_pkr, direction, description)
          VALUES (?, ?, ?, 'refund', ?, 'credit', 'Dispute resolution: full refund')
        `).run(uuidv4(), posterWallet.id, booking.id, booking.total_price_pkr);
      }
      break;

    case 'partial_refund': {
      const refundAmount = Math.round(booking.total_price_pkr * 0.5);
      if (alreadySettled) {
        const doctorClawback = Math.round(booking.payout_pkr * 0.5);
        if (doctorWallet) {
          await db.prepare(`
            UPDATE wallets
            SET balance_pkr = GREATEST(0, balance_pkr - ?), updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(doctorClawback, doctorWallet.id);
          await db.prepare(`
            INSERT INTO ledger_transactions (id, wallet_id, booking_id, type, amount_pkr, direction, description)
            VALUES (?, ?, ?, 'adjustment', ?, 'debit', 'Dispute resolution: partial refund clawback')
          `).run(uuidv4(), doctorWallet.id, booking.id, doctorClawback);
        }
      } else if (posterWallet) {
        await db.prepare(`
          UPDATE wallets
          SET held_pkr = GREATEST(0, held_pkr - ?), updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(booking.total_price_pkr, posterWallet.id);
      }

      if (posterWallet) {
        await db.prepare(`
          UPDATE wallets
          SET balance_pkr = balance_pkr + ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(refundAmount, posterWallet.id);
        await db.prepare(`
          INSERT INTO ledger_transactions (id, wallet_id, booking_id, type, amount_pkr, direction, description)
          VALUES (?, ?, ?, 'refund', ?, 'credit', 'Dispute resolution: partial refund (50%)')
        `).run(uuidv4(), posterWallet.id, booking.id, refundAmount);
      }
      break;
    }

    case 'penalty': {
      await db.prepare(`
        UPDATE doctor_profiles
        SET reliability_score = GREATEST(0, reliability_score - 15), updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(booking.doctor_id);

      if (doctorWallet) {
        const penaltyFee = await getNumericPolicy('dispute_penalty_fee_pkr', 500);
        await db.prepare(`
          UPDATE wallets
          SET balance_pkr = GREATEST(0, balance_pkr - ?), updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(penaltyFee, doctorWallet.id);
        await db.prepare(`
          INSERT INTO ledger_transactions (id, wallet_id, booking_id, type, amount_pkr, direction, description)
          VALUES (?, ?, ?, 'penalty', ?, 'debit', 'Dispute penalty fee')
        `).run(uuidv4(), doctorWallet.id, booking.id, penaltyFee);
      }
      break;
    }

    case 'dismissed':
    case 'no_action':
      if (!alreadySettled) {
        if (posterWallet) {
          await db.prepare(`
            UPDATE wallets
            SET held_pkr = GREATEST(0, held_pkr - ?), updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(booking.total_price_pkr, posterWallet.id);
          await db.prepare(`
            INSERT INTO ledger_transactions (id, wallet_id, booking_id, type, amount_pkr, direction, description)
            VALUES (?, ?, ?, 'escrow_release', ?, 'credit', 'Escrow released after dispute dismissed')
          `).run(uuidv4(), posterWallet.id, booking.id, booking.total_price_pkr);
          await db.prepare(`
            INSERT INTO ledger_transactions (id, wallet_id, booking_id, type, amount_pkr, direction, description)
            VALUES (?, ?, ?, 'platform_fee', ?, 'debit', 'Platform commission')
          `).run(uuidv4(), posterWallet.id, booking.id, booking.platform_fee_pkr);
        }

        if (doctorWallet) {
          await db.prepare(`
            UPDATE wallets
            SET balance_pkr = balance_pkr + ?, total_earned_pkr = total_earned_pkr + ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(booking.payout_pkr, booking.payout_pkr, doctorWallet.id);
          await db.prepare(`
            INSERT INTO ledger_transactions (id, wallet_id, booking_id, type, amount_pkr, direction, description)
            VALUES (?, ?, ?, 'payout', ?, 'credit', 'Settlement after dispute dismissed')
          `).run(uuidv4(), doctorWallet.id, booking.id, booking.payout_pkr);
        }

        await db.prepare('UPDATE bookings SET settled_at = CURRENT_TIMESTAMP WHERE id = ?').run(booking.id);
      }
      break;

    default:
      throw new Error(`Unsupported dispute resolution type: ${resolutionType}`);
  }
}
