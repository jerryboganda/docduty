/**
 * Background Jobs - No-show detection, shift expiry, payout batching
 * SSOT Section 5.6, Appendix D, Appendix E
 */

import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database/schema.js';
import { logAudit } from './audit.js';

async function detectNoShows(): Promise<void> {
  try {
    const db = getDb();
    const policies = await db.prepare<{ key: string; value: string }>(`
      SELECT key, value FROM policy_config
      WHERE key IN ('no_show_threshold_min', 'no_show_reliability_penalty', 'noshow_penalty_fee_pkr')
    `).all();
    const policyMap: Record<string, string> = {};
    for (const policy of policies) {
      policyMap[policy.key] = policy.value;
    }

    const noShowThresholdMin = parseInt(policyMap.no_show_threshold_min || '15', 10);
    const penalty = parseInt(policyMap.no_show_reliability_penalty || '20', 10);
    const noshowFeePkr = parseInt(policyMap.noshow_penalty_fee_pkr || '500', 10);

    const overdueBookings = await db.prepare(`
      SELECT b.*, s.start_time, s.end_time, s.title as shift_title
      FROM bookings b
      JOIN shifts s ON b.shift_id = s.id
      WHERE b.status = 'confirmed'
        AND s.start_time + (? * INTERVAL '1 minute') < CURRENT_TIMESTAMP
        AND b.no_show_detected_at IS NULL
    `).all(noShowThresholdMin) as any[];

    await db.transaction(async () => {
      for (const booking of overdueBookings) {
        const checkIn = await db.prepare(
          "SELECT id FROM attendance_events WHERE booking_id = ? AND event_type = 'check_in'"
        ).get(booking.id);

        if (checkIn) {
          continue;
        }

        await db.prepare(`
          UPDATE bookings SET status = 'no_show', no_show_detected_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(booking.id);

        await db.prepare("UPDATE shifts SET status = 'open', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
          .run(booking.shift_id);

        await db.prepare(`
          UPDATE doctor_profiles SET reliability_score = GREATEST(0, reliability_score - ?), updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `).run(penalty, booking.doctor_id);

        const doctorWallet = await db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(booking.doctor_id) as any;
        if (doctorWallet && noshowFeePkr > 0) {
          await db.prepare("UPDATE wallets SET balance_pkr = GREATEST(0, balance_pkr - ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?")
            .run(noshowFeePkr, doctorWallet.id);
          await db.prepare(`INSERT INTO ledger_transactions (id, wallet_id, booking_id, type, amount_pkr, direction, description)
            VALUES (?, ?, ?, 'penalty', ?, 'debit', 'No-show penalty fee')`)
            .run(uuidv4(), doctorWallet.id, booking.id, noshowFeePkr);
        }

        const posterWallet = await db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(booking.poster_id) as any;
        if (posterWallet) {
          await db.prepare("UPDATE wallets SET balance_pkr = balance_pkr + ?, held_pkr = GREATEST(0, held_pkr - ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?")
            .run(booking.total_price_pkr, booking.total_price_pkr, posterWallet.id);

          await db.prepare(`INSERT INTO ledger_transactions (id, wallet_id, booking_id, type, amount_pkr, direction, description)
            VALUES (?, ?, ?, 'refund', ?, 'credit', 'No-show refund')`)
            .run(uuidv4(), posterWallet.id, booking.id, booking.total_price_pkr);
        }

        await db.prepare(`
          INSERT INTO notifications (id, user_id, type, title, body, data)
          VALUES (?, ?, 'no_show', 'No-Show Detected', 'The doctor did not check in. Your booking has been refunded.', ?)
        `).run(uuidv4(), booking.poster_id, { bookingId: booking.id });

        await db.prepare(`
          INSERT INTO notifications (id, user_id, type, title, body, data)
          VALUES (?, ?, 'no_show_warning', 'No-Show Warning', 'You were marked as no-show for a shift. This affects your reliability score.', ?)
        `).run(uuidv4(), booking.doctor_id, { bookingId: booking.id });

        await logAudit({
          userId: 'system',
          action: 'no_show_detected',
          entityType: 'booking',
          entityId: booking.id,
          newValue: { doctorId: booking.doctor_id, shiftTitle: booking.shift_title },
        });

        console.log(`[NoShow] Booking ${booking.id}: doctor ${booking.doctor_id} marked as no-show`);
      }
    })();
  } catch (err: any) {
    console.error('[NoShow Detection Error]', err.message);
  }
}

async function expireOldShifts(): Promise<void> {
  try {
    const db = getDb();
    const expired = await db.prepare(`
      UPDATE shifts SET status = 'expired', updated_at = CURRENT_TIMESTAMP
      WHERE status = 'open' AND start_time < CURRENT_TIMESTAMP
    `).run();

    if (expired.changes > 0) {
      await db.prepare(`
        UPDATE offers SET status = 'expired'
        WHERE status = 'pending' AND shift_id IN (
          SELECT id FROM shifts WHERE status = 'expired'
        )
      `).run();

      console.log(`[Expiry] ${expired.changes} shift(s) expired`);
    }
  } catch (err: any) {
    console.error('[Shift Expiry Error]', err.message);
  }
}

async function autoCompleteOverdueShifts(): Promise<void> {
  try {
    const db = getDb();
    const overdueBookings = await db.prepare(`
      SELECT b.*, s.end_time
      FROM bookings b
      JOIN shifts s ON b.shift_id = s.id
      WHERE b.status = 'in_progress'
        AND s.end_time + INTERVAL '60 minutes' < CURRENT_TIMESTAMP
    `).all() as any[];

    for (const booking of overdueBookings) {
      const eventId = uuidv4();
      await db.prepare(`
        INSERT INTO attendance_events (id, booking_id, user_id, event_type, admin_override, admin_override_by, admin_override_reason)
        VALUES (?, ?, ?, 'check_out', ?, 'system', 'Auto-completed: shift end time exceeded by 60+ minutes')
      `).run(eventId, booking.id, booking.doctor_id, true);

      await db.prepare("UPDATE bookings SET status = 'completed', check_out_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .run(booking.id);
      await db.prepare("UPDATE shifts SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .run(booking.shift_id);

      await processAutoSettlement(booking);
      console.log(`[AutoComplete] Booking ${booking.id} auto-completed`);
    }
  } catch (err: any) {
    console.error('[AutoComplete Error]', err.message);
  }
}

async function processAutoSettlement(booking: any): Promise<void> {
  try {
    const db = getDb();
    await db.transaction(async () => {
      const posterWallet = await db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(booking.poster_id) as any;
      if (posterWallet) {
        await db.prepare("UPDATE wallets SET held_pkr = GREATEST(0, held_pkr - ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?")
          .run(booking.total_price_pkr, posterWallet.id);
        await db.prepare(`INSERT INTO ledger_transactions (id, wallet_id, booking_id, type, amount_pkr, direction, description)
          VALUES (?, ?, ?, 'escrow_release', ?, 'credit', 'Escrow released (auto-complete)')`)
          .run(uuidv4(), posterWallet.id, booking.id, booking.total_price_pkr);
        await db.prepare(`INSERT INTO ledger_transactions (id, wallet_id, booking_id, type, amount_pkr, direction, description)
          VALUES (?, ?, ?, 'platform_fee', ?, 'debit', 'Platform commission')`)
          .run(uuidv4(), posterWallet.id, booking.id, booking.platform_fee_pkr);
      }

      const doctorWallet = await db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(booking.doctor_id) as any;
      if (doctorWallet) {
        await db.prepare("UPDATE wallets SET balance_pkr = balance_pkr + ?, total_earned_pkr = total_earned_pkr + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
          .run(booking.payout_pkr, booking.payout_pkr, doctorWallet.id);
        await db.prepare(`INSERT INTO ledger_transactions (id, wallet_id, booking_id, type, amount_pkr, direction, description)
          VALUES (?, ?, ?, 'payout', ?, 'credit', 'Shift payout (auto-complete)')`)
          .run(uuidv4(), doctorWallet.id, booking.id, booking.payout_pkr);
      }
    })();
  } catch (err: any) {
    console.error('[Auto Settlement Error]', err.message);
  }
}

export function startBackgroundJobs(): void {
  console.log('[Jobs] Starting background jobs...');

  setInterval(() => { void detectNoShows(); }, 2 * 60 * 1000);
  setInterval(() => { void expireOldShifts(); }, 5 * 60 * 1000);
  setInterval(() => { void autoCompleteOverdueShifts(); }, 10 * 60 * 1000);

  setTimeout(() => {
    void detectNoShows();
    void expireOldShifts();
    void autoCompleteOverdueShifts();
  }, 5000);

  console.log('[Jobs] Background jobs scheduled');
}
