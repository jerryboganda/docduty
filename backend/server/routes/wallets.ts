/**
 * Wallets Routes - Balance, transactions, payouts
 * SSOT Section 14: Payments, Ledger, Settlement
 */

import { Router, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database/schema.js';
import { authMiddleware, type AuthRequest, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { WalletRow, PayoutRow } from '../types.js';

export const walletsRouter = Router();
walletsRouter.use(authMiddleware);

function parsePage(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * GET /api/wallets/balance (also aliased as /api/wallets/me for mobile)
 */
walletsRouter.get(
  ['/balance', '/me'],
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const wallet = await db.prepare<WalletRow>('SELECT * FROM wallets WHERE user_id = ?').get(req.user!.userId);

    if (!wallet) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }

    const body = {
      id: wallet.id,
      userId: wallet.user_id,
      balancePkr: wallet.balance_pkr,
      heldPkr: wallet.held_pkr,
      availablePkr: wallet.balance_pkr - wallet.held_pkr,
      totalEarnedPkr: wallet.total_earned_pkr,
      totalSpentPkr: wallet.total_spent_pkr,
    };
    // /me returns { wallet: ... } for mobile compat; /balance returns flat for web compat
    if (req.path === '/me') {
      res.json({ wallet: body });
    } else {
      res.json(body);
    }
  }),
);

/**
 * GET /api/wallets/transactions (also aliased as /api/wallets/ledger for mobile)
 */
walletsRouter.get(
  ['/transactions', '/ledger'],
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const wallet = await db.prepare<Pick<WalletRow, 'id'>>('SELECT id FROM wallets WHERE user_id = ?').get(req.user!.userId);
    if (!wallet) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }

    const { type, page = '1', limit = '20', startDate, endDate } = req.query;
    let where = 'WHERE lt.wallet_id = ?';
    const params: unknown[] = [wallet.id];

    if (type) {
      where += ' AND lt.type = ?';
      params.push(type);
    }
    if (startDate) {
      where += ' AND lt.created_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      where += " AND lt.created_at < (?::date + INTERVAL '1 day')";
      params.push(endDate);
    }

    const pageNumber = parsePage(page, 1);
    const limitNumber = parsePage(limit, 20);
    const offset = (pageNumber - 1) * limitNumber;

    const totalRow = await db.prepare<{ count: number }>(`SELECT COUNT(*)::int AS count FROM ledger_transactions lt ${where}`).get(...params);
    const transactions = await db.prepare(`
      SELECT lt.*, s.title AS shift_title
      FROM ledger_transactions lt
      LEFT JOIN bookings b ON lt.booking_id = b.id
      LEFT JOIN shifts s ON b.shift_id = s.id
      ${where}
      ORDER BY lt.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limitNumber, offset);

    res.json({ transactions, total: totalRow?.count ?? 0, page: pageNumber, limit: limitNumber });
  }),
);

/**
 * POST /api/wallets/deposit
 * Add funds to wallet - restricted to platform_admin only.
 */
walletsRouter.post(
  '/deposit',
  requireRole('platform_admin'),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const { targetUserId, reference } = req.body;
    const amountPkr = req.body.amountPkr ?? req.body.amount;

    if (!amountPkr || typeof amountPkr !== 'number' || !Number.isInteger(amountPkr) || amountPkr <= 0) {
      res.status(400).json({ error: 'amountPkr must be a positive integer' });
      return;
    }

    if (amountPkr > 1_000_000) {
      res.status(400).json({ error: 'Maximum deposit is PKR 1,000,000 per transaction' });
      return;
    }

    const userId = targetUserId || req.user!.userId;
    const wallet = await db.prepare<WalletRow>('SELECT * FROM wallets WHERE user_id = ?').get(userId);
    if (!wallet) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }

    await db.transaction(async () => {
      await db.prepare(`
        UPDATE wallets
        SET balance_pkr = balance_pkr + ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(amountPkr, wallet.id);

      await db.prepare(`
        INSERT INTO ledger_transactions (id, wallet_id, type, amount_pkr, direction, description, reference_id)
        VALUES (?, ?, 'deposit', ?, 'credit', 'Wallet deposit (admin-verified)', ?)
      `).run(uuidv4(), wallet.id, amountPkr, reference || null);
    })();

    res.json({ message: 'Deposit successful', newBalance: wallet.balance_pkr + amountPkr });
  }),
);

/**
 * POST /api/wallets/payout
 * Request payout (withdrawal)
 */
walletsRouter.post(
  '/payout',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const amountPkr = req.body.amountPkr ?? req.body.amount;
    const paymentMethod = req.body.paymentMethod ?? req.body.bankDetails;

    if (!amountPkr || typeof amountPkr !== 'number' || !Number.isInteger(amountPkr) || amountPkr <= 0) {
      res.status(400).json({ error: 'amountPkr must be a positive integer' });
      return;
    }

    if (amountPkr > 500_000) {
      res.status(400).json({ error: 'Maximum payout is PKR 500,000 per transaction' });
      return;
    }

    const wallet = await db.prepare<WalletRow>('SELECT * FROM wallets WHERE user_id = ?').get(req.user!.userId);
    if (!wallet) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }

    const payoutId = uuidv4();
    await db.transaction(async () => {
      // Re-check balance inside transaction with row-level lock to prevent race conditions
      const lockedWallet = await db.prepare<WalletRow>(
        'SELECT * FROM wallets WHERE id = ? FOR UPDATE'
      ).get(wallet.id);

      if (!lockedWallet) {
        throw new Error('Wallet not found during lock');
      }

      const available = lockedWallet.balance_pkr - lockedWallet.held_pkr;
      if (amountPkr > available) {
        throw new Error(`Insufficient balance. Available: PKR ${available}`);
      }

      await db.prepare(`
        INSERT INTO payouts (id, wallet_id, amount_pkr, status, payment_method)
        VALUES (?, ?, ?, 'pending', ?)
      `).run(payoutId, lockedWallet.id, amountPkr, paymentMethod || 'bank_transfer');

      await db.prepare(`
        UPDATE wallets
        SET balance_pkr = balance_pkr - ?, total_spent_pkr = total_spent_pkr + ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(amountPkr, amountPkr, lockedWallet.id);

      await db.prepare(`
        INSERT INTO ledger_transactions (id, wallet_id, type, amount_pkr, direction, description, reference_id)
        VALUES (?, ?, 'withdrawal', ?, 'debit', 'Payout request', ?)
      `).run(uuidv4(), lockedWallet.id, amountPkr, payoutId);
    })();

    res.json({ payoutId, message: 'Payout request submitted', status: 'pending' });
  }),
);

/**
 * GET /api/wallets/payouts
 * List payout requests
 */
walletsRouter.get(
  '/payouts',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const wallet = await db.prepare<Pick<WalletRow, 'id'>>('SELECT id FROM wallets WHERE user_id = ?').get(req.user!.userId);
    if (!wallet) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }

    const payouts = await db.prepare<PayoutRow>('SELECT * FROM payouts WHERE wallet_id = ? ORDER BY created_at DESC').all(wallet.id);
    res.json({ payouts });
  }),
);
