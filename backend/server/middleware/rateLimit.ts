/**
 * Rate Limiter Middleware
 * Simple in-memory rate limiter for OTP and sensitive endpoints
 */

import type { Request, Response, NextFunction } from 'express';

const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${req.ip}-${req.originalUrl}`;
    const now = Date.now();
    const record = requestCounts.get(key);

    if (!record || now > record.resetAt) {
      requestCounts.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (record.count >= maxRequests) {
      res.status(429).json({ error: 'Too many requests. Please try again later.' });
      return;
    }

    record.count++;
    next();
  };
}

// Cleanup old entries periodically
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestCounts) {
    if (now > record.resetAt) {
      requestCounts.delete(key);
    }
  }
}, 60000);
cleanupTimer.unref();
