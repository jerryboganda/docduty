/**
 * Messages Routes - In-booking chat
 * SSOT Section 16: Notifications & Messaging
 */

import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database/schema.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { notifyUser, notifyBooking } from '../utils/pusher.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const messagesRouter = Router();
messagesRouter.use(authMiddleware);

const conversationsQuery = `
  SELECT b.id as booking_id, s.title as shift_title,
    b.doctor_id, b.poster_id,
    dp.full_name as doctor_name,
    fa.name as facility_name,
    CASE
      WHEN b.doctor_id = ? THEN fa.name
      ELSE dp.full_name
    END as other_party_name,
    (SELECT content FROM messages WHERE booking_id = b.id ORDER BY created_at DESC LIMIT 1) as last_message,
    (SELECT created_at FROM messages WHERE booking_id = b.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
    (SELECT COUNT(*) FROM messages WHERE booking_id = b.id) as message_count
  FROM bookings b
  JOIN shifts s ON b.shift_id = s.id
  LEFT JOIN doctor_profiles dp ON dp.user_id = b.doctor_id
  LEFT JOIN facility_accounts fa ON fa.user_id = b.poster_id
  WHERE (b.doctor_id = ? OR b.poster_id = ?)
    AND EXISTS (SELECT 1 FROM messages WHERE booking_id = b.id)
  ORDER BY last_message_at DESC
`;

messagesRouter.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const conversations = await db.prepare(conversationsQuery).all(req.user!.userId, req.user!.userId, req.user!.userId);
    res.json({ conversations });
  } catch (err: any) {
    console.error('[Messages Conversations]', err.message);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
}));

messagesRouter.get('/conversations', asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const conversations = await db.prepare(conversationsQuery).all(req.user!.userId, req.user!.userId, req.user!.userId);
    res.json({ conversations });
  } catch (err: any) {
    console.error('[Messages Conversations]', err.message);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
}));

messagesRouter.get('/:bookingId', asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const bookingId = req.params.bookingId;
    const booking = await db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId) as any;
    if (!booking) { res.status(404).json({ error: 'Booking not found' }); return; }

    if (
      req.user!.role !== 'platform_admin' &&
      booking.doctor_id !== req.user!.userId &&
      booking.poster_id !== req.user!.userId
    ) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const messages = await db.prepare(`
      SELECT m.*, dp.full_name as sender_name, u.role as sender_role
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      LEFT JOIN doctor_profiles dp ON dp.user_id = m.sender_id
      WHERE m.booking_id = ?
      ORDER BY m.created_at ASC
    `).all(bookingId);

    res.json({ messages });
  } catch (err: any) {
    console.error('[Messages Get]', err.message);
    res.status(500).json({ error: 'Failed to get messages' });
  }
}));

messagesRouter.post('/:bookingId', asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const bookingId = req.params.bookingId;
    const { content } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({ error: 'Message content is required' });
      return;
    }

    const phiPatterns = /\b(patient|MR#|medical\s*record|diagnosis|treatment)\b/i;
    if (phiPatterns.test(content)) {
      res.status(400).json({ error: 'Messages must not contain patient health information (PHI)' });
      return;
    }

    const booking = await db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId) as any;
    if (!booking) { res.status(404).json({ error: 'Booking not found' }); return; }

    if (booking.doctor_id !== req.user!.userId && booking.poster_id !== req.user!.userId && req.user!.role !== 'platform_admin') {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const messageId = uuidv4();
    await db.prepare(`
      INSERT INTO messages (id, booking_id, sender_id, content)
      VALUES (?, ?, ?, ?)
    `).run(messageId, bookingId, req.user!.userId, content.trim());

    const recipientId = req.user!.userId === booking.doctor_id ? booking.poster_id : booking.doctor_id;
    await db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, body, data)
      VALUES (?, ?, 'new_message', 'New Message', 'You have a new message', ?)
    `).run(uuidv4(), recipientId, { bookingId, messageId });

    const senderProfile = await db.prepare(`
      SELECT
        CASE
          WHEN u.role = 'doctor' THEN dp.full_name
          WHEN u.role = 'facility_admin' THEN fa.name
          ELSE u.phone
        END as display_name
      FROM users u
      LEFT JOIN doctor_profiles dp ON dp.user_id = u.id
      LEFT JOIN facility_accounts fa ON fa.user_id = u.id
      WHERE u.id = ?
    `).get(req.user!.userId) as any;
    const senderName = senderProfile?.display_name || 'User';

    notifyBooking(bookingId, {
      id: messageId,
      sender_id: req.user!.userId,
      sender_name: senderName,
      content: content.trim(),
      sent_at: new Date().toISOString(),
    });
    notifyUser(recipientId, {
      id: uuidv4(),
      type: 'new_message',
      title: 'New Message',
      message: `${senderName} sent you a message`,
      entity_type: 'booking',
      entity_id: bookingId,
    });

    res.status(201).json({ messageId, message: 'Message sent' });
  } catch (err: any) {
    console.error('[Messages Send]', err.message);
    res.status(500).json({ error: 'Failed to send message' });
  }
}));
