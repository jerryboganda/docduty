/**
 * Uploads Routes - Avatar/profile picture management
 * Handles file upload with validation (type, size, magic bytes)
 */

import { Router, type Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { promises as fsp } from 'node:fs';
import crypto from 'node:crypto';
import { env } from '../config.js';
import { getDb } from '../database/schema.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const uploadsRouter = Router();
uploadsRouter.use(authMiddleware);

const AVATARS_DIR = path.join(env.uploadsDir, 'avatars');
if (!fs.existsSync(AVATARS_DIR)) {
  fs.mkdirSync(AVATARS_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const PUBLIC_API_URL = (process.env.PUBLIC_API_URL || '').trim().replace(/\/$/, '');

const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]],
};

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) {
    return false;
  }

  return signatures.some((signature) => (
    signature.every((byte, index) => buffer.length > index && buffer[index] === byte)
  ));
}

function buildAvatarUrl(filename: string): string {
  const relativePath = `/api/uploads/avatars/${filename}`;
  return PUBLIC_API_URL ? `${PUBLIC_API_URL}${relativePath}` : relativePath;
}

function getStoredFilename(avatarUrl: string): string {
  const normalized = avatarUrl.split('?')[0];
  return path.basename(normalized);
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype as (typeof ALLOWED_MIME_TYPES)[number])) {
      cb(new Error(`Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`));
      return;
    }

    const extension = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      cb(new Error(`Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`));
      return;
    }

    cb(null, true);
  },
});

/**
 * POST /api/users/avatar
 * Upload or replace user avatar
 */
uploadsRouter.post(
  '/avatar',
  upload.single('avatar'),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded. Please select an image file.' });
      return;
    }

    const { buffer, mimetype, size } = req.file;

    if (size > MAX_FILE_SIZE) {
      res.status(400).json({ error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` });
      return;
    }

    if (!validateMagicBytes(buffer, mimetype)) {
      res.status(400).json({ error: 'File content does not match its declared type. Possible file type spoofing detected.' });
      return;
    }

    const extension = path.extname(req.file.originalname).toLowerCase() || '.jpg';
    const safeFilename = `${req.user!.userId}_${crypto.randomBytes(8).toString('hex')}${extension}`;
    const filePath = path.join(AVATARS_DIR, safeFilename);
    const db = getDb();
    const currentUser = await db.prepare<any>('SELECT avatar_url FROM users WHERE id = ?').get(req.user!.userId);

    if (currentUser?.avatar_url) {
      const oldFilename = getStoredFilename(currentUser.avatar_url);
      const oldPath = path.join(AVATARS_DIR, oldFilename);
      if (fs.existsSync(oldPath)) {
        await fsp.unlink(oldPath);
      }
    }

    await fsp.writeFile(filePath, buffer);

    const avatarUrl = buildAvatarUrl(safeFilename);
    await db.prepare('UPDATE users SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(avatarUrl, req.user!.userId);

    await logAudit({
      userId: req.user!.userId,
      action: 'upload_avatar',
      entityType: 'user',
      entityId: req.user!.userId,
    });

    res.json({
      message: 'Avatar uploaded successfully',
      avatarUrl,
    });
  }),
);

/**
 * DELETE /api/users/avatar
 * Remove user avatar
 */
uploadsRouter.delete(
  '/avatar',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDb();
    const currentUser = await db.prepare<any>('SELECT avatar_url FROM users WHERE id = ?').get(req.user!.userId);

    if (currentUser?.avatar_url) {
      const filename = getStoredFilename(currentUser.avatar_url);
      const filePath = path.join(AVATARS_DIR, filename);
      if (fs.existsSync(filePath)) {
        await fsp.unlink(filePath);
      }

      await db.prepare('UPDATE users SET avatar_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(req.user!.userId);

      await logAudit({
        userId: req.user!.userId,
        action: 'remove_avatar',
        entityType: 'user',
        entityId: req.user!.userId,
      });
    }

    res.json({ message: 'Avatar removed successfully', avatarUrl: null });
  }),
);

export function handleMulterError(err: any, _req: any, res: any, next: any): void {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` });
      return;
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      res.status(400).json({ error: 'Only one file can be uploaded at a time' });
      return;
    }
    res.status(400).json({ error: err.message });
    return;
  }

  if (err?.message?.includes('Invalid file')) {
    res.status(400).json({ error: err.message });
    return;
  }

  next(err);
}
