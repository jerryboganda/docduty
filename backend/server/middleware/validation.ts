/**
 * Validation Middleware
 * Simple validation helpers to prevent bad data from reaching the database
 */

import { Request, Response, NextFunction } from 'express';

export function validateRequired(fields: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missing: string[] = [];
    for (const field of fields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        missing.push(field);
      }
    }
    if (missing.length > 0) {
      res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
      return;
    }
    next();
  };
}

export function validatePhone(phone: string): boolean {
  // Pakistan phone format: +923XXXXXXXXX or 03XXXXXXXXX
  return /^(\+92|0)3\d{9}$/.test(phone);
}

export function validateUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}
