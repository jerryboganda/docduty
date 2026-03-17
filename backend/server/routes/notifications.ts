/**
 * Notifications Routes
 * SSOT Section 16: Notifications & Messaging
 */

import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database/schema.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { notifyUser } from '../utils/pusher.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logger } from '../utils/logger.js';

export const notificationsRouter = Router();
notificationsRouter.use(authMiddleware);

notificationsRouter.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const { unreadOnly, page = '1', limit = '20' } = req.query;

    let where = 'WHERE user_id = ?';
    const params: unknown[] = [req.user!.userId];

    if (unreadOnly === 'true') {
      where += ' AND is_read = FALSE';
    }

    const parsedLimit = parseInt(limit as string, 10);
    const parsedPage = parseInt(page as string, 10);
    const offset = (parsedPage - 1) * parsedLimit;
    const total = (await db.prepare<{ count: number }>(`SELECT COUNT(*)::int as count FROM notifications ${where}`).get(...params))?.count || 0;
    const unreadCount = (await db.prepare<{ count: number }>('SELECT COUNT(*)::int as count FROM notifications WHERE user_id = ? AND is_read = FALSE').get(req.user!.userId))?.count || 0;

    const notifications = await db.prepare(`
      SELECT * FROM notifications ${where}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, parsedLimit, offset);

    res.json({ notifications, total, unreadCount, page: parsedPage, limit: parsedLimit });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Notifications list failed', { error: message });
    res.status(500).json({ error: 'Failed to list notifications' });
  }
}));

notificationsRouter.put('/:id/read', asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    await db.prepare('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.user!.userId);
    res.json({ message: 'Marked as read' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Notification mark-read failed', { error: message });
    res.status(500).json({ error: 'Failed to mark as read' });
  }
}));

notificationsRouter.put('/read-all', asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    await db.prepare('UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE')
      .run(req.user!.userId);
    res.json({ message: 'All notifications marked as read' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Notifications mark-all-read failed', { error: message });
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
}));

notificationsRouter.post('/push', asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'platform_admin') {
      res.status(403).json({ error: 'Admin only' });
      return;
    }

    const db = getDb();
    const { userId, type, title, body, data, entityType, entityId } = req.body;

    if (!userId || !type || !title) {
      res.status(400).json({ error: 'userId, type, and title are required' });
      return;
    }

    const notifId = uuidv4();
    await db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, body, data)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(notifId, userId, type, title, body || '', data || null);

    notifyUser(userId, {
      id: notifId,
      type,
      title,
      message: body || title,
      entity_type: entityType,
      entity_id: entityId,
    });

    res.status(201).json({ id: notifId, message: 'Notification created and pushed' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Notification push failed', { error: message });
    res.status(500).json({ error: 'Failed to push notification' });
  }
}));
