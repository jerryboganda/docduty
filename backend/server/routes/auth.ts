/**
 * Auth Routes - OTP + JWT
 * SSOT Section 5.6: Authentication & Identity
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database/schema.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, authMiddleware, AuthRequest } from '../middleware/auth.js';
import { validatePhone } from '../middleware/validation.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { logAudit } from '../utils/audit.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getOrCreateDoctorVerification, mapCanonicalStatusToLegacy } from '../utils/doctorVerification.js';

export const authRouter = Router();

authRouter.post('/register', rateLimit(5, 60000), asyncHandler(async (req: Request, res: Response) => {
  try {
    const { phone, password, role, fullName } = req.body;

    if (!phone || !password || !role) {
      res.status(400).json({ error: 'phone, password, and role are required' });
      return;
    }

    if (!validatePhone(phone)) {
      res.status(400).json({ error: 'Invalid Pakistan phone number format' });
      return;
    }

    if (!['doctor', 'facility_admin'].includes(role)) {
      res.status(400).json({ error: 'Invalid role. Only doctor and facility_admin registration is allowed.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const db = getDb();
    const existing = await db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    if (existing) {
      res.status(409).json({ error: 'Phone number already registered' });
      return;
    }

    const userId = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);

    await db.transaction(async () => {
      await db.prepare(`
        INSERT INTO users (id, phone, role, password_hash, status, verification_status)
        VALUES (?, ?, ?, ?, 'active', 'unverified')
      `).run(userId, phone, role, passwordHash);

      await db.prepare('INSERT INTO wallets (id, user_id) VALUES (?, ?)').run(uuidv4(), userId);

      if (role === 'doctor') {
        await db.prepare(`
          INSERT INTO doctor_profiles (id, user_id, full_name)
          VALUES (?, ?, ?)
        `).run(uuidv4(), userId, fullName || 'Doctor');
      } else {
        await db.prepare(`
          INSERT INTO facility_accounts (id, user_id, name)
          VALUES (?, ?, ?)
        `).run(uuidv4(), userId, fullName || 'Facility');
      }
    })();

    const payload = { userId, role, phone };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await db.prepare(`
      INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP + INTERVAL '30 days')
    `).run(uuidv4(), userId, bcrypt.hashSync(refreshToken, 5));

    await logAudit({ userId, action: 'register', entityType: 'user', entityId: userId });

    res.status(201).json({
      user: { id: userId, phone, role },
      accessToken,
      refreshToken,
    });
  } catch (err: any) {
    console.error('[Auth Register]', err.message);
    res.status(500).json({ error: 'Registration failed' });
  }
}));

authRouter.post('/login', rateLimit(10, 60000), asyncHandler(async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      res.status(400).json({ error: 'phone and password are required' });
      return;
    }

    const db = getDb();
    const user = await db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as any;

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (user.status === 'suspended' || user.status === 'banned') {
      res.status(403).json({ error: `Account is ${user.status}` });
      return;
    }

    if (!bcrypt.compareSync(password, user.password_hash)) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const payload = { userId: user.id, role: user.role, phone: user.phone };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await db.prepare(`
      INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP + INTERVAL '30 days')
    `).run(uuidv4(), user.id, bcrypt.hashSync(refreshToken, 5));

    let profile = null;
    if (user.role === 'doctor') {
      profile = await db.prepare('SELECT * FROM doctor_profiles WHERE user_id = ?').get(user.id);
    } else if (user.role === 'facility_admin') {
      profile = await db.prepare('SELECT * FROM facility_accounts WHERE user_id = ?').get(user.id);
    }

    // C1 fix: Return canonical verification status for doctors
    let verificationStatus = user.verification_status;
    if (user.role === 'doctor') {
      const dv = await getOrCreateDoctorVerification(user.id);
      verificationStatus = mapCanonicalStatusToLegacy(dv.current_status);
    }

    await logAudit({ userId: user.id, action: 'login', entityType: 'user', entityId: user.id });

    res.json({
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        status: user.status,
        verificationStatus,
        avatarUrl: user.avatar_url || null,
        profile,
      },
      accessToken,
      refreshToken,
    });
  } catch (err: any) {
    console.error('[Auth Login]', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
}));

authRouter.post('/request-otp', rateLimit(3, 60000), asyncHandler(async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone || !validatePhone(phone)) {
      res.status(400).json({ error: 'Valid Pakistan phone number required' });
      return;
    }

    const db = getDb();
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));

    await db.prepare(`
      INSERT INTO otp_codes (id, phone, code, expires_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP + INTERVAL '5 minutes')
    `).run(uuidv4(), phone, otpCode);

    console.log(`[OTP] Code for ${phone}: ${otpCode}`);
    res.json({ message: 'OTP sent successfully', expiresInSeconds: 300 });
  } catch (err: any) {
    console.error('[Auth OTP]', err.message);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
}));

authRouter.post('/verify-otp', rateLimit(5, 60000), asyncHandler(async (req: Request, res: Response) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      res.status(400).json({ error: 'phone and code are required' });
      return;
    }

    const db = getDb();
    const otp = await db.prepare(`
      SELECT * FROM otp_codes
      WHERE phone = ? AND code = ? AND used = FALSE AND expires_at > CURRENT_TIMESTAMP
      ORDER BY created_at DESC LIMIT 1
    `).get(phone, code) as any;

    if (!otp) {
      res.status(400).json({ error: 'Invalid or expired OTP' });
      return;
    }

    await db.prepare('UPDATE otp_codes SET used = TRUE WHERE id = ?').run(otp.id);
    res.json({ verified: true, phone });
  } catch (err: any) {
    console.error('[Auth Verify OTP]', err.message);
    res.status(500).json({ error: 'OTP verification failed' });
  }
}));

authRouter.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: 'refreshToken is required' });
      return;
    }

    const decoded = verifyRefreshToken(refreshToken);
    const db = getDb();
    const storedTokens = await db.prepare(`
      SELECT token_hash FROM refresh_tokens
      WHERE user_id = ? AND expires_at > CURRENT_TIMESTAMP
      ORDER BY created_at DESC
    `).all(decoded.userId) as Array<{ token_hash: string }>;

    const matchesStoredToken = storedTokens.some((row) => bcrypt.compareSync(refreshToken, row.token_hash));
    if (!matchesStoredToken) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    const newAccessToken = generateAccessToken({
      userId: decoded.userId,
      role: decoded.role,
      phone: decoded.phone,
    });

    res.json({ accessToken: newAccessToken });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
}));

authRouter.get('/me', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const user = await db.prepare(`
      SELECT id, phone, email, role, status, verification_status, avatar_url, created_at
      FROM users WHERE id = ?
    `).get(req.user!.userId) as any;

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    let profile = null;
    if (user.role === 'doctor') {
      profile = await db.prepare(`
        SELECT dp.*, s.name as specialty_name, c.name as city_name
        FROM doctor_profiles dp
        LEFT JOIN specialties s ON dp.specialty_id = s.id
        LEFT JOIN cities c ON dp.city_id = c.id
        WHERE dp.user_id = ?
      `).get(user.id);
    } else if (user.role === 'facility_admin') {
      profile = await db.prepare(`
        SELECT fa.*, c.name as city_name
        FROM facility_accounts fa
        LEFT JOIN cities c ON fa.city_id = c.id
        WHERE fa.user_id = ?
      `).get(user.id);
    }

    // C1 fix: Return canonical verification status for doctors
    if (user.role === 'doctor') {
      const dv = await getOrCreateDoctorVerification(user.id);
      user.verification_status = mapCanonicalStatusToLegacy(dv.current_status);
    }

    res.json({ ...user, profile });
  } catch (err: any) {
    console.error('[Auth Me]', err.message);
    res.status(500).json({ error: 'Failed to get user info' });
  }
}));

authRouter.put('/password', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'currentPassword and newPassword are required' });
      return;
    }

    if (String(newPassword).length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }

    const db = getDb();
    const user = await db.prepare('SELECT id, password_hash FROM users WHERE id = ?').get(req.user!.userId) as any;

    if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    const passwordHash = bcrypt.hashSync(newPassword, 10);
    await db.transaction(async () => {
      await db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(passwordHash, req.user!.userId);
      await db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(req.user!.userId);
      await logAudit({
        userId: req.user!.userId,
        action: 'change_password',
        entityType: 'user',
        entityId: req.user!.userId,
      });
    })();

    res.json({ message: 'Password updated successfully' });
  } catch (err: any) {
    console.error('[Auth Password]', err.message);
    res.status(500).json({ error: 'Failed to update password' });
  }
}));

authRouter.post('/logout', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    await db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(req.user!.userId);
    await logAudit({ userId: req.user!.userId, action: 'logout', entityType: 'user', entityId: req.user!.userId });
    res.json({ message: 'Logged out successfully' });
  } catch (err: any) {
    console.error('[Auth Logout]', err.message);
    res.status(500).json({ error: 'Logout failed' });
  }
}));
