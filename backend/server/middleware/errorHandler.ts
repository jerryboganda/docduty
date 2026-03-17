/**
 * Global Error Handler Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  logger.error('Unhandled error', { name: err.name, error: err.message });

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Don't leak internal errors in production
  res.status(500).json({ error: 'Internal server error' });
}
