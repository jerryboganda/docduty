/**
 * Contact Routes - Public contact form submissions
 */

import { Router, Response, Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database/schema.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const contactRouter = Router();

contactRouter.post('/', rateLimit(5, 60000), asyncHandler(async (req: Request, res: Response) => {
  const db = getDb();
  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    res.status(400).json({ error: 'name, email, subject, and message are required' });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: 'Invalid email address' });
    return;
  }

  const id = uuidv4();
  await db.prepare(`
    INSERT INTO contact_submissions (id, name, email, phone, subject, message)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, name.trim(), email.trim(), phone?.trim() || null, subject.trim(), message.trim());

  res.status(201).json({ id, message: 'Thank you for contacting us. We will get back to you shortly.' });
}));
