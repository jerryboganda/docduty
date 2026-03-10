/**
 * Shared Settlement Utilities
 * Extracted from attendance.ts and bookings.ts to avoid duplication
 * SSOT Appendix F: Settlement Pseudocode & Invariants
 */

import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database/schema.js';
import { logAudit } from './audit.js';

export async function processSettlement(booking: any): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();

    const result = await db.transaction(async () => {
      // C2 fix: Atomic idempotency check with row-level lock inside transaction
      const locked = await db.prepare(
        'SELECT settled_at FROM bookings WHERE id = ? FOR UPDATE'
      ).get(booking.id) as any;

      if (locked?.settled_at) {
        return false; // Already settled
      }

      await db.prepare("UPDATE bookings SET settled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .run(booking.id);

      const posterWallet = await db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(booking.poster_id) as any;
      if (posterWallet) {
        await db.prepare("UPDATE wallets SET held_pkr = GREATEST(0, held_pkr - ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?")
          .run(booking.total_price_pkr, posterWallet.id);

        await db.prepare(`INSERT INTO ledger_transactions (id, wallet_id, booking_id, type, amount_pkr, direction, description)
          VALUES (?, ?, ?, 'escrow_release', ?, 'credit', 'Escrow released on completion')`)
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
          VALUES (?, ?, ?, 'payout', ?, 'credit', 'Shift payout on completion')`)
          .run(uuidv4(), doctorWallet.id, booking.id, booking.payout_pkr);
      }

      await db.prepare(`
        UPDATE doctor_profiles SET
          total_shifts_completed = total_shifts_completed + 1,
          reliability_score = LEAST(100, reliability_score + 1),
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(booking.doctor_id);

      return true;
    })();

    await logAudit({
      userId: 'system',
      action: 'settlement_completed',
      entityType: 'booking',
      entityId: booking.id,
      newValue: { payout: booking.payout_pkr, fee: booking.platform_fee_pkr },
    });

    return { success: !!result };
  } catch (err: any) {
    console.error('[Settlement Error]', err.message);
    return { success: false, error: err.message };
  }
}

export async function processCancellationRefund(booking: any, shift: any): Promise<void> {
  try {
    const db = getDb();
    const now = new Date();
    const shiftStart = new Date(shift.start_time);
    const hoursUntilStart = (shiftStart.getTime() - now.getTime()) / (1000 * 60 * 60);

    let refundPct: number;
    if (hoursUntilStart > 24) {
      refundPct = parseInt((await db.prepare("SELECT value FROM policy_config WHERE key = 'cancel_24h_refund_pct'").get() as any)?.value || '100', 10);
    } else if (hoursUntilStart > 2) {
      refundPct = parseInt((await db.prepare("SELECT value FROM policy_config WHERE key = 'cancel_2_24h_refund_pct'").get() as any)?.value || '50', 10);
    } else {
      refundPct = parseInt((await db.prepare("SELECT value FROM policy_config WHERE key = 'cancel_under_2h_refund_pct'").get() as any)?.value || '0', 10);
    }

    const refundAmount = Math.round(booking.total_price_pkr * refundPct / 100);
    const penaltyAmount = booking.total_price_pkr - refundAmount;

    const posterWallet = await db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(booking.poster_id) as any;
    if (posterWallet) {
      await db.prepare("UPDATE wallets SET balance_pkr = balance_pkr + ?, held_pkr = GREATEST(0, held_pkr - ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .run(refundAmount, booking.total_price_pkr, posterWallet.id);

      if (refundAmount > 0) {
        await db.prepare(`INSERT INTO ledger_transactions (id, wallet_id, booking_id, type, amount_pkr, direction, description)
          VALUES (?, ?, ?, 'refund', ?, 'credit', ?)`)
          .run(uuidv4(), posterWallet.id, booking.id, refundAmount, `Cancellation refund (${refundPct}%)`);
      }
    }

    if (penaltyAmount > 0) {
      const doctorWallet = await db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(booking.doctor_id) as any;
      if (doctorWallet) {
        await db.prepare("UPDATE wallets SET balance_pkr = balance_pkr + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
          .run(penaltyAmount, doctorWallet.id);

        await db.prepare(`INSERT INTO ledger_transactions (id, wallet_id, booking_id, type, amount_pkr, direction, description)
          VALUES (?, ?, ?, 'payout', ?, 'credit', 'Cancellation protection fee')`)
          .run(uuidv4(), doctorWallet.id, booking.id, penaltyAmount);
      }
    }
  } catch (err: any) {
    console.error('[Cancellation Refund Error]', err.message);
  }
}
