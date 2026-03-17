/**
 * Users Routes - Profile management
 * SSOT Section 5.6: Profiles
 */

import { Router, type Response } from 'express';
import { getDb } from '../database/schema.js';
import { authMiddleware, type AuthRequest, requireRole } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { UserRow, DoctorProfileRow, FacilityAccountRow, UserPreferencesRow } from '../types.js';

export const usersRouter = Router();
usersRouter.use(authMiddleware);

function parsePage(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * GET /api/users/profile
 * Get current user's profile
 */
usersRouter.get(
  '/profile',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const user = await db.prepare<Pick<UserRow, 'id' | 'phone' | 'email' | 'role' | 'status' | 'verification_status' | 'avatar_url' | 'created_at' | 'updated_at'>>(`
      SELECT id, phone, email, role, status, verification_status, avatar_url, created_at, updated_at
      FROM users
      WHERE id = ?
    `).get(req.user!.userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    let profile: Record<string, unknown> | null = null;
    if (user.role === 'doctor') {
      const doctorProfile = await db.prepare<DoctorProfileRow & { specialty_name: string | null; city_name: string | null; province_name: string | null }>(`
        SELECT dp.*, s.name AS specialty_name, c.name AS city_name,
          p.name AS province_name
        FROM doctor_profiles dp
        LEFT JOIN specialties s ON dp.specialty_id = s.id
        LEFT JOIN cities c ON dp.city_id = c.id
        LEFT JOIN provinces p ON c.province_id = p.id
        WHERE dp.user_id = ?
      `).get(user.id);

      if (doctorProfile) {
        const skills = await db.prepare(`
          SELECT sk.id, sk.name
          FROM doctor_skills ds
          JOIN skills sk ON ds.skill_id = sk.id
          WHERE ds.doctor_id = ?
        `).all(doctorProfile.id);
        profile = { ...doctorProfile, skills };
      }
    } else if (user.role === 'facility_admin') {
      const facilityProfile = await db.prepare<FacilityAccountRow & { city_name: string | null }>(`
        SELECT fa.*, c.name AS city_name
        FROM facility_accounts fa
        LEFT JOIN cities c ON fa.city_id = c.id
        WHERE fa.user_id = ?
      `).get(user.id);

      if (facilityProfile) {
        const locations = await db.prepare(`
          SELECT *
          FROM facility_locations
          WHERE facility_id = ? AND is_active = TRUE
        `).all(facilityProfile.id);
        profile = { ...facilityProfile, locations };
      }
    }

    res.json({ ...user, profile });
  }),
);

/**
 * PUT /api/users/profile
 * Update current user's profile
 */
usersRouter.put(
  '/profile',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const { email, avatarUrl } = req.body;

    const doctorProfileFields: string[] = [];
    const doctorProfileValues: unknown[] = [];
    const facilityFields: string[] = [];
    const facilityValues: unknown[] = [];

    if (req.user!.role === 'doctor') {
      const {
        fullName,
        full_name,
        cnic,
        pmdcLicense,
        pmdc_number,
        specialtyId,
        cityId,
        coverageRadiusKm,
        bio,
        experienceYears,
        availabilityStatus,
      } = req.body;

      if (experienceYears !== undefined) {
        const years = Number.parseInt(String(experienceYears), 10);
        if (!Number.isFinite(years) || years < 0 || years > 60) {
          res.status(400).json({ error: 'experienceYears must be between 0 and 60' });
          return;
        }
        doctorProfileFields.push('experience_years = ?');
        doctorProfileValues.push(years);
      }

      if (availabilityStatus !== undefined) {
        if (!['available', 'busy', 'offline'].includes(availabilityStatus)) {
          res.status(400).json({ error: 'availabilityStatus must be one of: available, busy, offline' });
          return;
        }
        doctorProfileFields.push('availability_status = ?');
        doctorProfileValues.push(availabilityStatus);
      }

      if (coverageRadiusKm !== undefined) {
        const radius = Number.parseInt(String(coverageRadiusKm), 10);
        if (!Number.isFinite(radius) || radius < 1 || radius > 500) {
          res.status(400).json({ error: 'coverageRadiusKm must be between 1 and 500' });
          return;
        }
        doctorProfileFields.push('coverage_radius_km = ?');
        doctorProfileValues.push(radius);
      }

      const resolvedFullName = fullName ?? full_name;
      const resolvedPmdcLicense = pmdcLicense ?? pmdc_number;
      if (resolvedFullName !== undefined) {
        doctorProfileFields.push('full_name = ?');
        doctorProfileValues.push(resolvedFullName);
      }
      if (cnic !== undefined) {
        doctorProfileFields.push('cnic = ?');
        doctorProfileValues.push(cnic);
      }
      if (resolvedPmdcLicense !== undefined) {
        doctorProfileFields.push('pmdc_license = ?');
        doctorProfileValues.push(resolvedPmdcLicense);
      }
      if (specialtyId !== undefined) {
        doctorProfileFields.push('specialty_id = ?');
        doctorProfileValues.push(specialtyId);
      }
      if (cityId !== undefined) {
        doctorProfileFields.push('city_id = ?');
        doctorProfileValues.push(cityId);
      }
      if (bio !== undefined) {
        doctorProfileFields.push('bio = ?');
        doctorProfileValues.push(bio);
      }
    } else if (req.user!.role === 'facility_admin') {
      const { name, registrationNumber, type, cityId } = req.body;
      if (name !== undefined) {
        facilityFields.push('name = ?');
        facilityValues.push(name);
      }
      if (registrationNumber !== undefined) {
        facilityFields.push('registration_number = ?');
        facilityValues.push(registrationNumber);
      }
      if (type !== undefined) {
        facilityFields.push('type = ?');
        facilityValues.push(type);
      }
      if (cityId !== undefined) {
        facilityFields.push('city_id = ?');
        facilityValues.push(cityId);
      }
    }

    await db.transaction(async () => {
      if (email !== undefined || avatarUrl !== undefined) {
        const userFields: string[] = [];
        const userValues: unknown[] = [];

        if (email !== undefined) {
          userFields.push('email = ?');
          userValues.push(email);
        }
        if (avatarUrl !== undefined) {
          userFields.push('avatar_url = ?');
          userValues.push(avatarUrl);
        }

        userFields.push('updated_at = CURRENT_TIMESTAMP');
        await db.prepare(`UPDATE users SET ${userFields.join(', ')} WHERE id = ?`)
          .run(...userValues, req.user!.userId);
      }

      if (req.user!.role === 'doctor') {
        if (doctorProfileFields.length > 0) {
          await db.prepare(`UPDATE doctor_profiles SET ${doctorProfileFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`)
            .run(...doctorProfileValues, req.user!.userId);
        }

        if (Array.isArray(req.body.skillIds)) {
          const profile = await db.prepare<{ id: string }>('SELECT id FROM doctor_profiles WHERE user_id = ?').get(req.user!.userId);
          if (profile) {
            await db.prepare('DELETE FROM doctor_skills WHERE doctor_id = ?').run(profile.id);
            const insertSkill = db.prepare('INSERT INTO doctor_skills (doctor_id, skill_id) VALUES (?, ?)');
            for (const skillId of req.body.skillIds) {
              await insertSkill.run(profile.id, skillId);
            }
          }
        }
      } else if (req.user!.role === 'facility_admin' && facilityFields.length > 0) {
        await db.prepare(`UPDATE facility_accounts SET ${facilityFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`)
          .run(...facilityValues, req.user!.userId);
      }

      await logAudit({
        userId: req.user!.userId,
        action: 'update_profile',
        entityType: 'user',
        entityId: req.user!.userId,
      });
    })();

    res.json({ message: 'Profile updated successfully' });
  }),
);

/**
 * GET /api/users/preferences
 * Get current user's notification/privacy preferences
 */
usersRouter.get(
  '/preferences',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    let prefs = await db.prepare<UserPreferencesRow>('SELECT * FROM user_preferences WHERE user_id = ?').get(req.user!.userId);
    if (!prefs) {
      await db.prepare('INSERT INTO user_preferences (user_id) VALUES (?)').run(req.user!.userId);
      prefs = await db.prepare<UserPreferencesRow>('SELECT * FROM user_preferences WHERE user_id = ?').get(req.user!.userId);
    }
    res.json(prefs);
  }),
);

/**
 * PUT /api/users/preferences
 * Update current user's notification/privacy preferences
 */
usersRouter.put(
  '/preferences',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const {
      push_notifications,
      sms_notifications,
      email_notifications,
      marketing_emails,
      profile_visibility,
      show_online_status,
    } = req.body;

    const existing = await db.prepare('SELECT user_id FROM user_preferences WHERE user_id = ?').get(req.user!.userId);
    if (!existing) {
      await db.prepare('INSERT INTO user_preferences (user_id) VALUES (?)').run(req.user!.userId);
    }

    const fields: string[] = [];
    const values: unknown[] = [];
    if (push_notifications !== undefined) {
      fields.push('push_notifications = ?');
      values.push(Boolean(push_notifications));
    }
    if (sms_notifications !== undefined) {
      fields.push('sms_notifications = ?');
      values.push(Boolean(sms_notifications));
    }
    if (email_notifications !== undefined) {
      fields.push('email_notifications = ?');
      values.push(Boolean(email_notifications));
    }
    if (marketing_emails !== undefined) {
      fields.push('marketing_emails = ?');
      values.push(Boolean(marketing_emails));
    }
    if (profile_visibility !== undefined) {
      fields.push('profile_visibility = ?');
      values.push(profile_visibility);
    }
    if (show_online_status !== undefined) {
      fields.push('show_online_status = ?');
      values.push(Boolean(show_online_status));
    }

    if (fields.length > 0) {
      fields.push('updated_at = CURRENT_TIMESTAMP');
      await db.prepare(`UPDATE user_preferences SET ${fields.join(', ')} WHERE user_id = ?`)
        .run(...values, req.user!.userId);
    }

    res.json({ message: 'Preferences updated' });
  }),
);

/**
 * GET /api/users/:id
 * Get user by ID (admin or self gets full data; others get restricted view)
 */
usersRouter.get(
  '/:id',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const targetId = req.params.id;

    // H-006: Non-admin, non-self users get restricted profile (no phone/PII)
    const isPrivileged = req.user!.role === 'platform_admin' || req.user!.userId === targetId;

    const user = await db.prepare<Pick<UserRow, 'id' | 'phone' | 'email' | 'role' | 'status' | 'verification_status' | 'avatar_url' | 'created_at'>>(`
      SELECT id, phone, email, role, status, verification_status, avatar_url, created_at
      FROM users
      WHERE id = ?
    `).get(targetId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    let profile: DoctorProfileRow | FacilityAccountRow | null = null;
    if (user.role === 'doctor') {
      profile = (await db.prepare<DoctorProfileRow & { specialty_name: string | null; city_name: string | null }>(`
        SELECT dp.*, s.name AS specialty_name, c.name AS city_name
        FROM doctor_profiles dp
        LEFT JOIN specialties s ON dp.specialty_id = s.id
        LEFT JOIN cities c ON dp.city_id = c.id
        WHERE dp.user_id = ?
      `).get(user.id)) ?? null;
    } else if (user.role === 'facility_admin') {
      profile = (await db.prepare<FacilityAccountRow & { city_name: string | null }>(`
        SELECT fa.*, c.name AS city_name
        FROM facility_accounts fa
        LEFT JOIN cities c ON fa.city_id = c.id
        WHERE fa.user_id = ?
      `).get(user.id)) ?? null;
    }

    if (!isPrivileged) {
      // Strip PII for non-privileged callers
      const { phone: _phone, email: _email, ...safeUser } = user;
      res.json({ ...safeUser, profile });
      return;
    }

    res.json({ ...user, profile });
  }),
);

/**
 * GET /api/users
 * Admin: List all users with filters
 */
usersRouter.get(
  '/',
  requireRole('platform_admin'),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const { role, status, verificationStatus, search, page = '1', limit = '20' } = req.query;

    let where = 'WHERE 1=1';
    const params: unknown[] = [];

    if (role) {
      where += ' AND u.role = ?';
      params.push(role);
    }
    if (status) {
      where += ' AND u.status = ?';
      params.push(status);
    }
    if (verificationStatus) {
      where += ' AND u.verification_status = ?';
      params.push(verificationStatus);
    }
    if (search) {
      const term = `%${search}%`;
      where += ' AND (u.phone ILIKE ? OR u.email ILIKE ?)';
      params.push(term, term);
    }

    const pageNumber = parsePage(page, 1);
    const limitNumber = parsePage(limit, 20);
    const offset = (pageNumber - 1) * limitNumber;

    const totalRow = await db.prepare<{ count: number }>(`SELECT COUNT(*)::int AS count FROM users u ${where}`).get(...params);
    const users = await db.prepare(`
      SELECT u.id, u.phone, u.email, u.role, u.status, u.verification_status, u.created_at
      FROM users u
      ${where}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limitNumber, offset);

    res.json({ users, total: totalRow?.count ?? 0, page: pageNumber, limit: limitNumber });
  }),
);
