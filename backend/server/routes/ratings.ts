/**
 * Ratings Routes
 * SSOT Section 15: Ratings & Reliability
 */

import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database/schema.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logger } from '../utils/logger.js';
import type { BookingRow } from '../types.js';

export const ratingsRouter = Router();
ratingsRouter.use(authMiddleware);

ratingsRouter.post('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const { bookingId, score, comment } = req.body;

    if (!bookingId || !score) {
      res.status(400).json({ error: 'bookingId and score are required' });
      return;
    }

    if (score < 1 || score > 5) {
      res.status(400).json({ error: 'Score must be between 1 and 5' });
      return;
    }

    const booking = await db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId) as BookingRow | undefined;
    if (!booking) { res.status(404).json({ error: 'Booking not found' }); return; }

    if (!['completed', 'resolved'].includes(booking.status)) {
      res.status(400).json({ error: 'Can only rate completed bookings' });
      return;
    }

    const raterId = req.user!.userId;
    if (raterId !== booking.doctor_id && raterId !== booking.poster_id) {
      res.status(403).json({ error: 'You can only rate bookings you are involved in' });
      return;
    }

    const ratedId = raterId === booking.doctor_id ? booking.poster_id : booking.doctor_id;
    const existing = await db.prepare('SELECT id FROM ratings WHERE booking_id = ? AND rater_id = ?').get(bookingId, raterId);
    if (existing) {
      res.status(409).json({ error: 'You have already rated this booking' });
      return;
    }

    const ratingId = uuidv4();
    await db.prepare(`
      INSERT INTO ratings (id, booking_id, rater_id, rated_id, score, comment)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(ratingId, bookingId, raterId, ratedId, score, comment || null);

    const avgResult = await db.prepare<{ avg: number; count: number }>(
      'SELECT COALESCE(AVG(score), 0) as avg, COUNT(*)::int as count FROM ratings WHERE rated_id = ?'
    ).get(ratedId);
    const roundedAverage = Math.round((avgResult?.avg || 0) * 100) / 100;
    const totalRatings = avgResult?.count || 0;

    const ratedProfile = await db.prepare('SELECT id FROM doctor_profiles WHERE user_id = ?').get(ratedId);
    if (ratedProfile) {
      await db.prepare("UPDATE doctor_profiles SET rating_avg = ?, rating_count = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?")
        .run(roundedAverage, totalRatings, ratedId);
    }

    const ratedFacility = await db.prepare('SELECT id FROM facility_accounts WHERE user_id = ?').get(ratedId);
    if (ratedFacility) {
      await db.prepare("UPDATE facility_accounts SET rating_avg = ?, rating_count = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?")
        .run(roundedAverage, totalRatings, ratedId);
    }

    res.status(201).json({ ratingId, message: 'Rating submitted' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Rating submission failed', { error: message });
    res.status(500).json({ error: 'Failed to submit rating' });
  }
}));

ratingsRouter.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const { direction = 'received', page = '1', limit = '20' } = req.query;

    const field = direction === 'given' ? 'rater_id' : 'rated_id';
    const parsedPage = parseInt(page as string, 10);
    const parsedLimit = parseInt(limit as string, 10);
    const offset = (parsedPage - 1) * parsedLimit;

    let where = `WHERE r.${field} = ?`;
    const queryParams: unknown[] = [req.user!.userId];

    const { minScore, maxScore, startDate, endDate } = req.query;
    if (minScore) { where += ' AND r.score >= ?'; queryParams.push(parseInt(minScore as string, 10)); }
    if (maxScore) { where += ' AND r.score <= ?'; queryParams.push(parseInt(maxScore as string, 10)); }
    if (startDate) { where += ' AND r.created_at >= ?'; queryParams.push(startDate); }
    if (endDate) { where += ' AND r.created_at < (?::date + INTERVAL \'1 day\')'; queryParams.push(endDate); }

    const total = (await db.prepare<{ count: number }>(`SELECT COUNT(*)::int as count FROM ratings r ${where}`).get(...queryParams))?.count || 0;

    const ratings = await db.prepare(`
      SELECT r.*, s.title as shift_title,
        dp_rater.full_name as rater_name,
        dp_rated.full_name as rated_name
      FROM ratings r
      JOIN bookings b ON r.booking_id = b.id
      JOIN shifts s ON b.shift_id = s.id
      LEFT JOIN doctor_profiles dp_rater ON dp_rater.user_id = r.rater_id
      LEFT JOIN doctor_profiles dp_rated ON dp_rated.user_id = r.rated_id
      ${where}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...queryParams, parsedLimit, offset);

    res.json({ ratings, total, page: parsedPage, limit: parsedLimit });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Ratings list failed', { error: message });
    res.status(500).json({ error: 'Failed to list ratings' });
  }
}));
