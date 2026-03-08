/**
 * Admin Routes - Verification, users, policies, audit
 * SSOT Section 5.6: Admin Console + Section 9: NFR
 */

import { Router, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { getDb } from '../database/schema.js';
import { authMiddleware, type AuthRequest, requireRole } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';
import { asyncHandler } from '../utils/asyncHandler.js';

type CountRow = { count?: number; c?: number; total?: number };

export const adminRouter = Router();
adminRouter.use(authMiddleware);
adminRouter.use(requireRole('platform_admin'));

let analyticsCache: { key: string; data: unknown; expiresAt: number } | null = null;

function parsePage(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function calcTrend(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return Math.round(((current - previous) / previous) * 100);
}

// ============================================================
// DASHBOARD
// ============================================================

adminRouter.get(
  '/dashboard',
  asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();

    const pendingVerifications = await db.prepare<CountRow>(
      "SELECT COUNT(*)::int AS c FROM users WHERE verification_status = 'pending_review'",
    ).get();
    const openDisputes = await db.prepare<CountRow>(
      "SELECT COUNT(*)::int AS c FROM disputes WHERE status IN ('open', 'under_review')",
    ).get();
    const pendingPayouts = await db.prepare<CountRow>(
      "SELECT COUNT(*)::int AS c FROM payouts WHERE status = 'pending'",
    ).get();
    const suspiciousAttendance = await db.prepare<CountRow>(
      'SELECT COUNT(*)::int AS c FROM attendance_events WHERE admin_override_by IS NOT NULL',
    ).get();

    const recentVerifications = await db.prepare(`
      SELECT u.id, u.phone, u.role, u.verification_status, u.created_at,
        dp.full_name, fa.name AS facility_name
      FROM users u
      LEFT JOIN doctor_profiles dp ON dp.user_id = u.id
      LEFT JOIN facility_accounts fa ON fa.user_id = u.id
      WHERE u.verification_status = 'pending_review'
      ORDER BY u.created_at DESC
      LIMIT 5
    `).all();

    const recentDisputes = await db.prepare(`
      SELECT d.*, rby.phone AS raised_by_phone
      FROM disputes d
      LEFT JOIN users rby ON d.raised_by = rby.id
      ORDER BY d.created_at DESC
      LIMIT 5
    `).all();

    const alerts = await db.prepare(`
      SELECT *
      FROM notifications
      WHERE type IN ('system_alert', 'verification_update', 'no_show')
      ORDER BY created_at DESC
      LIMIT 5
    `).all();

    res.json({
      pending_verifications: pendingVerifications?.c ?? 0,
      open_disputes: openDisputes?.c ?? 0,
      pending_payouts: pendingPayouts?.c ?? 0,
      suspicious_attendance: suspiciousAttendance?.c ?? 0,
      recent_verifications: recentVerifications,
      recent_disputes: recentDisputes,
      alerts,
    });
  }),
);

// ============================================================
// VERIFICATION QUEUE
// ============================================================

adminRouter.get(
  '/verifications',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const { status = 'pending_review' } = req.query;

    const users = await db.prepare(`
      SELECT u.id, u.phone, u.role, u.verification_status, u.created_at,
        dp.full_name, dp.cnic, dp.pmdc_license, dp.specialty_id, sp.name AS specialty_name,
        fa.name AS facility_name, fa.registration_number
      FROM users u
      LEFT JOIN doctor_profiles dp ON dp.user_id = u.id
      LEFT JOIN specialties sp ON dp.specialty_id = sp.id
      LEFT JOIN facility_accounts fa ON fa.user_id = u.id
      WHERE u.verification_status = ?
      ORDER BY u.created_at ASC
    `).all(status);

    res.json({ users });
  }),
);

adminRouter.put(
  '/verifications/:userId',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const { decision, reason } = req.body;

    if (!['verified', 'rejected'].includes(decision)) {
      res.status(400).json({ error: 'decision must be verified or rejected' });
      return;
    }

    const user = await db.prepare<any>('SELECT * FROM users WHERE id = ?').get(req.params.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const oldStatus = user.verification_status;

    await db.transaction(async () => {
      await db.prepare('UPDATE users SET verification_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(decision, user.id);

      if (user.role === 'facility_admin') {
        await db.prepare(`
          UPDATE facility_accounts
          SET verification_status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `).run(decision, user.id);
      }

      await db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, body, data)
        VALUES (?, ?, 'verification_update', ?, ?, ?)
      `).run(
        uuidv4(),
        user.id,
        decision === 'verified' ? 'Verification Approved' : 'Verification Rejected',
        decision === 'verified'
          ? 'Your account has been verified. You can now use all features.'
          : `Verification rejected: ${reason || 'Please re-submit documents.'}`,
        { decision, reason: reason || null },
      );

      await logAudit({
        userId: req.user!.userId,
        action: 'verify_user',
        entityType: 'user',
        entityId: user.id,
        oldValue: { verification_status: oldStatus },
        newValue: { verification_status: decision, reason },
      });
    })();

    res.json({ message: `User ${decision}` });
  }),
);

// ============================================================
// USER MANAGEMENT
// ============================================================

adminRouter.get(
  '/users',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const { role, search } = req.query;
    let where = 'WHERE 1=1';
    const params: unknown[] = [];

    if (role) {
      where += ' AND u.role = ?';
      params.push(role);
    }
    if (search) {
      const term = `%${search}%`;
      where += ' AND (u.phone ILIKE ? OR dp.full_name ILIKE ? OR fa.name ILIKE ? OR c.name ILIKE ?)';
      params.push(term, term, term, term);
    }

    const users = await db.prepare(`
      SELECT u.id, u.phone, u.role, u.status, u.verification_status, u.created_at,
        dp.full_name AS doctor_name, dp.specialty_id, sp.name AS specialty_name,
        fa.name AS facility_name,
        c.name AS city_name
      FROM users u
      LEFT JOIN doctor_profiles dp ON dp.user_id = u.id
      LEFT JOIN specialties sp ON dp.specialty_id = sp.id
      LEFT JOIN facility_accounts fa ON fa.user_id = u.id
      LEFT JOIN cities c ON c.id = COALESCE(dp.city_id, fa.city_id)
      ${where}
      ORDER BY u.created_at DESC
      LIMIT 200
    `).all(...params);

    res.json({ users });
  }),
);

adminRouter.put(
  '/users/:id/status',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const { status: newStatus, reason } = req.body;
    const user = await db.prepare<any>('SELECT * FROM users WHERE id = ?').get(req.params.id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    if (!['active', 'suspended', 'banned'].includes(newStatus)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    await db.prepare('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, user.id);
    await logAudit({
      userId: req.user!.userId,
      action: newStatus === 'suspended' ? 'suspend_user' : 'unsuspend_user',
      entityType: 'user',
      entityId: user.id,
      oldValue: { status: user.status },
      newValue: { status: newStatus, reason },
    });

    res.json({ message: `User ${newStatus}`, newStatus });
  }),
);

adminRouter.get(
  '/facilities',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const { city, status, type, search, page = '1', limit = '50' } = req.query;

    let where = 'WHERE 1=1';
    const params: unknown[] = [];
    if (city) {
      where += ' AND c.name = ?';
      params.push(city);
    }
    if (status) {
      where += ' AND fl.is_active = ?';
      params.push(status === 'active');
    }
    if (type) {
      where += ' AND fa.type = ?';
      params.push(type);
    }
    if (search) {
      const term = `%${search}%`;
      where += ' AND (fa.name ILIKE ? OR fl.name ILIKE ? OR fl.address ILIKE ?)';
      params.push(term, term, term);
    }

    const pageNumber = parsePage(page, 1);
    const limitNumber = parsePage(limit, 50);
    const offset = (pageNumber - 1) * limitNumber;

    const totalRow = await db.prepare<CountRow>(`
      SELECT COUNT(*)::int AS count
      FROM facility_locations fl
      JOIN facility_accounts fa ON fl.facility_id = fa.id
      LEFT JOIN cities c ON fa.city_id = c.id
      ${where}
    `).get(...params);

    const facilities = await db.prepare(`
      SELECT fl.id, fl.facility_id, fl.name AS location_name, fl.address, fl.geofence_radius_m, fl.qr_rotate_interval_min, fl.is_active,
        fa.name AS facility_name, fa.type AS facility_type, c.name AS city_name
      FROM facility_locations fl
      JOIN facility_accounts fa ON fl.facility_id = fa.id
      LEFT JOIN cities c ON fa.city_id = c.id
      ${where}
      ORDER BY fa.name, fl.name
      LIMIT ? OFFSET ?
    `).all(...params, limitNumber, offset);

    res.json({ facilities, total: totalRow?.count ?? 0, page: pageNumber, limit: limitNumber });
  }),
);

adminRouter.put(
  '/facilities/:id/rotate-qr',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const location = await db.prepare<any>('SELECT * FROM facility_locations WHERE id = ?').get(req.params.id);

    if (!location) {
      res.status(404).json({ error: 'Location not found' });
      return;
    }

    const newSecret = crypto.randomBytes(32).toString('hex');
    await db.prepare('UPDATE facility_locations SET qr_secret = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newSecret, location.id);

    await logAudit({
      userId: req.user!.userId,
      action: 'rotate_qr_secret',
      entityType: 'facility_location',
      entityId: location.id,
      newValue: { locationName: location.name },
    });

    res.json({ message: 'QR secret rotated', locationId: location.id });
  }),
);

adminRouter.put(
  '/users/:id/ban',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const { reason } = req.body;
    const user = await db.prepare<any>('SELECT * FROM users WHERE id = ?').get(req.params.id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const newStatus = user.status === 'banned' ? 'active' : 'banned';
    await db.prepare('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, user.id);
    await logAudit({
      userId: req.user!.userId,
      action: newStatus === 'banned' ? 'ban_user' : 'unban_user',
      entityType: 'user',
      entityId: user.id,
      oldValue: { status: user.status },
      newValue: { status: newStatus, reason },
    });

    res.json({ message: `User ${newStatus}`, newStatus });
  }),
);

adminRouter.put(
  '/users/:id/suspend',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const { reason } = req.body;
    const user = await db.prepare<any>('SELECT * FROM users WHERE id = ?').get(req.params.id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
    await db.prepare('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, user.id);
    await logAudit({
      userId: req.user!.userId,
      action: newStatus === 'suspended' ? 'suspend_user' : 'unsuspend_user',
      entityType: 'user',
      entityId: user.id,
      oldValue: { status: user.status },
      newValue: { status: newStatus, reason },
    });

    res.json({ message: `User ${newStatus}`, newStatus });
  }),
);

// ============================================================
// POLICIES
// ============================================================

adminRouter.get(
  '/policies',
  asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const policies = await db.prepare('SELECT * FROM policy_config ORDER BY key').all();
    res.json({ policies });
  }),
);

adminRouter.put(
  '/policies/:key',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const { value } = req.body;
    const key = req.params.key;

    const existing = await db.prepare<any>('SELECT * FROM policy_config WHERE key = ?').get(key);
    if (!existing) {
      res.status(404).json({ error: 'Policy not found' });
      return;
    }

    const numericPolicies: Record<string, { min: number; max: number }> = {
      platform_commission_pct: { min: 0, max: 50 },
      min_platform_fee_pkr: { min: 0, max: 10_000 },
      min_shift_rate_pkr: { min: 0, max: 100_000 },
      no_show_threshold_min: { min: 5, max: 120 },
      no_show_reliability_penalty: { min: 0, max: 100 },
      noshow_penalty_fee_pkr: { min: 0, max: 50_000 },
      cancel_24h_refund_pct: { min: 0, max: 100 },
      cancel_2_24h_refund_pct: { min: 0, max: 100 },
      cancel_under_2h_refund_pct: { min: 0, max: 100 },
    };

    if (numericPolicies[key]) {
      const numValue = Number.parseFloat(String(value));
      if (Number.isNaN(numValue)) {
        res.status(400).json({ error: `Policy '${key}' requires a numeric value` });
        return;
      }
      const range = numericPolicies[key];
      if (numValue < range.min || numValue > range.max) {
        res.status(400).json({ error: `Policy '${key}' must be between ${range.min} and ${range.max}` });
        return;
      }
    }

    const oldValue = existing.value;
    await db.prepare(`
      UPDATE policy_config
      SET value = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE key = ?
    `).run(String(value), req.user!.userId, key);

    await logAudit({
      userId: req.user!.userId,
      action: 'update_policy',
      entityType: 'policy',
      entityId: key,
      oldValue: { value: oldValue },
      newValue: { value: String(value) },
    });

    res.json({ message: 'Policy updated' });
  }),
);

// ============================================================
// AUDIT LOGS
// ============================================================

adminRouter.get(
  '/audit-logs',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const { action, entityType, userId, page = '1', limit = '50' } = req.query;

    let where = 'WHERE 1=1';
    const params: unknown[] = [];
    if (action) {
      where += ' AND al.action = ?';
      params.push(action);
    }
    if (entityType) {
      where += ' AND al.entity_type = ?';
      params.push(entityType);
    }
    if (userId) {
      where += ' AND al.user_id = ?';
      params.push(userId);
    }

    const pageNumber = parsePage(page, 1);
    const limitNumber = parsePage(limit, 50);
    const offset = (pageNumber - 1) * limitNumber;

    const totalRow = await db.prepare<CountRow>(`SELECT COUNT(*)::int AS count FROM audit_logs al ${where}`).get(...params);
    const logs = await db.prepare(`
      SELECT al.*, u.phone AS user_phone, u.role AS user_role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${where}
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limitNumber, offset);

    res.json({ logs, total: totalRow?.count ?? 0, page: pageNumber, limit: limitNumber });
  }),
);

// ============================================================
// ANALYTICS
// ============================================================

adminRouter.get(
  '/analytics',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const { startDate, endDate, period = '30' } = req.query;

    const days = parsePage(period, 30);
    const rangeStart = (startDate as string) || new Date(Date.now() - days * 86_400_000).toISOString();
    const rangeEnd = (endDate as string) || new Date().toISOString();
    const cacheKey = `${rangeStart}|${rangeEnd}`;

    if (analyticsCache && analyticsCache.key === cacheKey && Date.now() < analyticsCache.expiresAt) {
      res.json(analyticsCache.data);
      return;
    }

    const previousWindowMs = new Date(rangeEnd).getTime() - new Date(rangeStart).getTime();
    const prevStart = new Date(new Date(rangeStart).getTime() - previousWindowMs).toISOString();

    const shiftCounts = await db.prepare<any>(`
      SELECT
        COUNT(*)::int AS total,
        COALESCE(SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END), 0)::int AS open,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0)::int AS completed,
        COALESCE(SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END), 0)::int AS cancelled
      FROM shifts
      WHERE created_at >= ? AND created_at <= ?
    `).get(rangeStart, rangeEnd);

    const bookingCounts = await db.prepare<any>(`
      SELECT
        COUNT(*)::int AS total,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0)::int AS completed,
        COALESCE(SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END), 0)::int AS no_show,
        COALESCE(SUM(CASE WHEN status = 'disputed' THEN 1 ELSE 0 END), 0)::int AS disputed
      FROM bookings
      WHERE created_at >= ? AND created_at <= ?
    `).get(rangeStart, rangeEnd);

    const disputeCounts = await db.prepare<any>(`
      SELECT
        COUNT(*)::int AS total,
        COALESCE(SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END), 0)::int AS open,
        COALESCE(SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END), 0)::int AS resolved
      FROM disputes
      WHERE created_at >= ? AND created_at <= ?
    `).get(rangeStart, rangeEnd);

    const userCounts = await db.prepare<any>(`
      SELECT
        COUNT(*)::int AS total,
        COALESCE(SUM(CASE WHEN role = 'doctor' THEN 1 ELSE 0 END), 0)::int AS doctors,
        COALESCE(SUM(CASE WHEN role = 'facility_admin' THEN 1 ELSE 0 END), 0)::int AS facilities,
        COALESCE(SUM(CASE WHEN created_at >= ? AND created_at <= ? THEN 1 ELSE 0 END), 0)::int AS new_this_period
      FROM users
    `).get(rangeStart, rangeEnd);

    const financials = await db.prepare<any>(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'platform_fee' THEN amount_pkr ELSE 0 END), 0)::int AS total_platform_fees,
        COALESCE(SUM(CASE WHEN type = 'payout' THEN amount_pkr ELSE 0 END), 0)::int AS total_payouts
      FROM ledger_transactions
      WHERE created_at >= ? AND created_at <= ?
    `).get(rangeStart, rangeEnd);

    const pendingPayouts = await db.prepare<CountRow>(
      "SELECT COALESCE(SUM(amount_pkr), 0)::int AS total FROM payouts WHERE status = 'pending'",
    ).get();
    const totalRevenue = await db.prepare<CountRow>(`
      SELECT COALESCE(SUM(total_price_pkr), 0)::int AS total
      FROM shifts
      WHERE status = 'completed' AND created_at >= ? AND created_at <= ?
    `).get(rangeStart, rangeEnd);

    const prevShifts = await db.prepare<CountRow>(
      'SELECT COUNT(*)::int AS c FROM shifts WHERE created_at >= ? AND created_at < ?',
    ).get(prevStart, rangeStart);
    const prevBookings = await db.prepare<CountRow>(
      'SELECT COUNT(*)::int AS c FROM bookings WHERE created_at >= ? AND created_at < ?',
    ).get(prevStart, rangeStart);
    const prevRevenue = await db.prepare<CountRow>(`
      SELECT COALESCE(SUM(total_price_pkr), 0)::int AS c
      FROM shifts
      WHERE status = 'completed' AND created_at >= ? AND created_at < ?
    `).get(prevStart, rangeStart);
    const prevUsers = await db.prepare<CountRow>(
      'SELECT COUNT(*)::int AS c FROM users WHERE created_at >= ? AND created_at < ?',
    ).get(prevStart, rangeStart);

    const analytics = {
      shifts: {
        total: shiftCounts?.total ?? 0,
        open: shiftCounts?.open ?? 0,
        completed: shiftCounts?.completed ?? 0,
        cancelled: shiftCounts?.cancelled ?? 0,
      },
      bookings: {
        total: bookingCounts?.total ?? 0,
        completed: bookingCounts?.completed ?? 0,
        noShow: bookingCounts?.no_show ?? 0,
        disputed: bookingCounts?.disputed ?? 0,
      },
      disputes: {
        total: disputeCounts?.total ?? 0,
        open: disputeCounts?.open ?? 0,
        resolved: disputeCounts?.resolved ?? 0,
      },
      users: {
        total: userCounts?.total ?? 0,
        doctors: userCounts?.doctors ?? 0,
        facilities: userCounts?.facilities ?? 0,
        newThisPeriod: userCounts?.new_this_period ?? 0,
      },
      financials: {
        totalPlatformFees: financials?.total_platform_fees ?? 0,
        totalPayouts: financials?.total_payouts ?? 0,
        pendingPayouts: pendingPayouts?.total ?? 0,
        totalRevenue: totalRevenue?.total ?? 0,
      },
      trends: {
        shifts: calcTrend(shiftCounts?.total ?? 0, prevShifts?.c ?? 0),
        bookings: calcTrend(bookingCounts?.total ?? 0, prevBookings?.c ?? 0),
        revenue: calcTrend(totalRevenue?.total ?? 0, prevRevenue?.c ?? 0),
        users: calcTrend(userCounts?.new_this_period ?? 0, prevUsers?.c ?? 0),
      },
      timeSeries: {
        shifts: await db.prepare(`
          SELECT DATE(created_at) AS date, COUNT(*)::int AS count
          FROM shifts
          WHERE created_at >= ? AND created_at <= ?
          GROUP BY DATE(created_at)
          ORDER BY date
        `).all(rangeStart, rangeEnd),
        bookings: await db.prepare(`
          SELECT DATE(created_at) AS date, COUNT(*)::int AS count
          FROM bookings
          WHERE created_at >= ? AND created_at <= ?
          GROUP BY DATE(created_at)
          ORDER BY date
        `).all(rangeStart, rangeEnd),
        revenue: await db.prepare(`
          SELECT DATE(created_at) AS date, COALESCE(SUM(total_price_pkr), 0)::int AS amount
          FROM shifts
          WHERE status = 'completed' AND created_at >= ? AND created_at <= ?
          GROUP BY DATE(created_at)
          ORDER BY date
        `).all(rangeStart, rangeEnd),
        users: await db.prepare(`
          SELECT DATE(created_at) AS date, COUNT(*)::int AS count
          FROM users
          WHERE created_at >= ? AND created_at <= ?
          GROUP BY DATE(created_at)
          ORDER BY date
        `).all(rangeStart, rangeEnd),
      },
      topDoctors: await db.prepare(`
        SELECT dp.full_name, dp.rating_avg, dp.rating_count, dp.reliability_score,
          COUNT(DISTINCT b.id)::int AS total_bookings
        FROM doctor_profiles dp
        LEFT JOIN bookings b ON b.doctor_id = dp.user_id AND b.status = 'completed'
        GROUP BY dp.user_id, dp.full_name, dp.rating_avg, dp.rating_count, dp.reliability_score
        ORDER BY dp.rating_avg DESC, dp.reliability_score DESC
        LIMIT 10
      `).all(),
      topCities: await db.prepare(`
        SELECT c.name, COUNT(s.id)::int AS shift_count
        FROM cities c
        LEFT JOIN shifts s ON s.city_id = c.id AND s.created_at >= ? AND s.created_at <= ?
        GROUP BY c.id, c.name
        ORDER BY shift_count DESC
        LIMIT 10
      `).all(rangeStart, rangeEnd),
    };

    analyticsCache = {
      key: cacheKey,
      data: analytics,
      expiresAt: Date.now() + 60_000,
    };

    res.json(analytics);
  }),
);

// ============================================================
// SETTLEMENTS / PAYOUTS MANAGEMENT
// ============================================================

adminRouter.get(
  '/payouts',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const { status, startDate, endDate, search, page = '1', limit = '50' } = req.query;

    let where = 'WHERE 1=1';
    const params: unknown[] = [];
    if (status) {
      where += ' AND p.status = ?';
      params.push(status);
    }
    if (startDate) {
      where += ' AND p.created_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      where += " AND p.created_at < (?::date + INTERVAL '1 day')";
      params.push(endDate);
    }
    if (search) {
      const term = `%${search}%`;
      where += ' AND (dp.full_name ILIKE ? OR u.phone ILIKE ?)';
      params.push(term, term);
    }

    const pageNumber = parsePage(page, 1);
    const limitNumber = parsePage(limit, 50);
    const offset = (pageNumber - 1) * limitNumber;

    const totalRow = await db.prepare<CountRow>(`
      SELECT COUNT(*)::int AS count
      FROM payouts p
      JOIN wallets w ON p.wallet_id = w.id
      JOIN users u ON w.user_id = u.id
      LEFT JOIN doctor_profiles dp ON dp.user_id = w.user_id
      ${where}
    `).get(...params);

    const payouts = await db.prepare(`
      SELECT p.*, w.user_id, u.phone, dp.full_name
      FROM payouts p
      JOIN wallets w ON p.wallet_id = w.id
      JOIN users u ON w.user_id = u.id
      LEFT JOIN doctor_profiles dp ON dp.user_id = w.user_id
      ${where}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limitNumber, offset);

    res.json({ payouts, total: totalRow?.count ?? 0, page: pageNumber, limit: limitNumber });
  }),
);

adminRouter.put(
  '/payouts/:id/process',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const { status, paymentReference } = req.body;

    if (!['processing', 'completed', 'failed'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    await db.transaction(async () => {
      await db.prepare(`
        UPDATE payouts
        SET status = ?, payment_reference = ?, processed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(status, paymentReference || null, req.params.id);

      if (status === 'failed') {
        const payout = await db.prepare<any>('SELECT * FROM payouts WHERE id = ?').get(req.params.id);
        if (payout) {
          await db.prepare(`
            UPDATE wallets
            SET balance_pkr = balance_pkr + ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(payout.amount_pkr, payout.wallet_id);

          await db.prepare(`
            INSERT INTO ledger_transactions (id, wallet_id, type, amount_pkr, direction, description, reference_id)
            VALUES (?, ?, 'refund', ?, 'credit', 'Payout failed - refunded', ?)
          `).run(uuidv4(), payout.wallet_id, payout.amount_pkr, payout.id);
        }
      }

      await logAudit({
        userId: req.user!.userId,
        action: 'process_payout',
        entityType: 'payout',
        entityId: req.params.id,
        newValue: { status, paymentReference },
      });
    })();

    res.json({ message: `Payout ${status}` });
  }),
);
