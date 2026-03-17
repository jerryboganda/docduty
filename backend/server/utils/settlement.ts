/**
 * Shared Settlement Utilities
 * Extracted from attendance.ts and bookings.ts to avoid duplication
 * SSOT Appendix F: Settlement Pseudocode & Invariants
 */

import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database/schema.js';
import { logAudit } from './audit.js';
import { logger } from './logger.js';
import type { BookingRow, ShiftRow, WalletRow, PolicyValueRow } from '../types.js';

/** Minimal row returned by the idempotency check. */
interface SettledAtRow {
  settled_at: string | null;
}

export async function processSettlement(booking: BookingRow): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();

    const result = await db.transaction(async () => {
      // C2 fix: Atomic idempotency check with row-level lock inside transaction
      const locked = await db.prepare(
        'SELECT settled_at FROM bookings WHERE id = ? FOR UPDATE'
      ).get(booking.id) as SettledAtRow | undefined;

      if (locked?.settled_at) {
        return false; // Already settled
      }

      await db.prepare("UPDATE bookings SET settled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .run(booking.id);

      const posterWallet = await db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(booking.poster_id) as WalletRow | undefined;
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

      const doctorWallet = await db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(booking.doctor_id) as WalletRow | undefined;
      if (doctorWallet) {
        await db.prepare("UPDATE wallets SET balance_pkr = balance_pkr + ?, total_earned_pkr = total_earned_pkr + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
          .run(booking.payout_pkr, booking.payout_pkr, doctorWallet.id);

        await db.prepare(`INSERT INTO ledger_transactions (id, wallet_id, booking_id, type, amount_pkr, direction, description)
          VALUES (?, ?, ?, 'payout', ?, 'credit', 'Shift payout on completion')`)
          .run(uuidv4(), doctorWallet.id, booking.id, booking.payout_pkr);
      }

      // H-003: total_shifts_completed increment removed here — it is already
      // incremented in attendance.ts checkout to avoid double-counting.

      return true;
    })();

    await logAudit({
      action: 'settlement_completed',
      entityType: 'booking',
      entityId: booking.id,
      newValue: { payout: booking.payout_pkr, fee: booking.platform_fee_pkr },
    });

    return { success: !!result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Settlement failed', { error: message });
    return { success: false, error: message };
  }
}

export async function processCancellationRefund(booking: BookingRow, shift: ShiftRow): Promise<void> {
  try {
    const db = getDb();
    const now = new Date();
    const shiftStart = new Date(shift.start_time);
    const hoursUntilStart = (shiftStart.getTime() - now.getTime()) / (1000 * 60 * 60);

    let refundPct: number;
    if (hoursUntilStart > 24) {
      refundPct = parseInt((await db.prepare("SELECT value FROM policy_config WHERE key = 'cancel_24h_refund_pct'").get() as PolicyValueRow | undefined)?.value || '100', 10);
    } else if (hoursUntilStart > 2) {
      refundPct = parseInt((await db.prepare("SELECT value FROM policy_config WHERE key = 'cancel_2_24h_refund_pct'").get() as PolicyValueRow | undefined)?.value || '50', 10);
    } else {
      refundPct = parseInt((await db.prepare("SELECT value FROM policy_config WHERE key = 'cancel_under_2h_refund_pct'").get() as PolicyValueRow | undefined)?.value || '0', 10);
    }

    const refundAmount = Math.round(booking.total_price_pkr * refundPct / 100);
    const penaltyAmount = booking.total_price_pkr - refundAmount;

    // Wrap all wallet mutations in a single transaction to prevent partial refunds
    await db.transaction(async () => {
      const posterWallet = await db.prepare('SELECT * FROM wallets WHERE user_id = ? FOR UPDATE').get(booking.poster_id) as WalletRow | undefined;
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
        const doctorWallet = await db.prepare('SELECT * FROM wallets WHERE user_id = ? FOR UPDATE').get(booking.doctor_id) as WalletRow | undefined;
        if (doctorWallet) {
          await db.prepare("UPDATE wallets SET balance_pkr = balance_pkr + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
            .run(penaltyAmount, doctorWallet.id);

          await db.prepare(`INSERT INTO ledger_transactions (id, wallet_id, booking_id, type, amount_pkr, direction, description)
            VALUES (?, ?, ?, 'payout', ?, 'credit', 'Cancellation protection fee')`)
            .run(uuidv4(), doctorWallet.id, booking.id, penaltyAmount);
        }
      }
    })();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Cancellation refund failed', { error: message });
  }
}
