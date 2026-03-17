/**
 * DocDuty Express Server - Entry Point
 * SSOT Section 10: System Architecture
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import crypto from 'crypto';
import { env } from './config.js';
import { checkDatabaseHealth, initializeDatabase } from './database/schema.js';
import { seedReferenceData } from './database/seed.js';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { facilitiesRouter } from './routes/facilities.js';
import { shiftsRouter } from './routes/shifts.js';
import { bookingsRouter } from './routes/bookings.js';
import { attendanceRouter } from './routes/attendance.js';
import { walletsRouter } from './routes/wallets.js';
import { disputesRouter } from './routes/disputes.js';
import { ratingsRouter } from './routes/ratings.js';
import { notificationsRouter } from './routes/notifications.js';
import { messagesRouter } from './routes/messages.js';
import { adminRouter } from './routes/admin.js';
import { referenceRouter } from './routes/reference.js';
import { contactRouter } from './routes/contact.js';
import { uploadsRouter, handleMulterError } from './routes/uploads.js';
import { doctorVerificationRouter } from './routes/doctorVerification.js';
import { authMiddleware, requireRole } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

const app = express();
const requestMetrics = new Map<string, { count: number; totalMs: number }>();
const startupState = {
  ready: false,
  error: null as string | null,
};
let bootstrapPromise: Promise<void> | null = null;

app.disable('x-powered-by');
app.set('etag', false);
// M-004: Trust proxy so rate-limiter sees real client IPs behind reverse proxy
app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.frontendOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use((req, res, next) => {
  const requestId = req.header('x-request-id') || crypto.randomUUID();
  res.setHeader('x-request-id', requestId);
  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const key = `${req.method} ${req.path} ${res.statusCode}`;
    const existing = requestMetrics.get(key) || { count: 0, totalMs: 0 };
    existing.count += 1;
    existing.totalMs += durationMs;
    requestMetrics.set(key, existing);
    logger.info('HTTP request', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs,
    });
  });

  next();
});

app.use('/api/uploads', express.static(env.uploadsDir, {
  maxAge: '7d',
  immutable: true,
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'");
  },
}));

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter, uploadsRouter);
app.use('/api/doctor', doctorVerificationRouter);
app.use('/api/facilities', facilitiesRouter);
app.use('/api/shifts', shiftsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/wallets', walletsRouter);
app.use('/api/disputes', disputesRouter);
app.use('/api/ratings', ratingsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/reference', referenceRouter);
app.use('/api/contact', contactRouter);

app.get('/api/health', async (_req, res) => {
  try {
    await checkDatabaseHealth();
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      error: error instanceof Error ? error.message : 'Database unavailable',
      timestamp: new Date().toISOString(),
    });
  }
});

app.get('/api/readiness', async (_req, res) => {
  if (!startupState.ready) {
    res.status(503).json({
      status: 'starting',
      env: env.nodeEnv,
      error: startupState.error,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  try {
    await checkDatabaseHealth();
    res.json({ status: 'ready', env: env.nodeEnv, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      env: env.nodeEnv,
      error: error instanceof Error ? error.message : 'Database unavailable',
      timestamp: new Date().toISOString(),
    });
  }
});

app.get('/api/metrics', authMiddleware, requireRole('platform_admin'), (_req, res) => {
  const lines = [
    '# TYPE http_requests_total counter',
    '# TYPE http_request_duration_ms_avg gauge',
  ];

  for (const [key, value] of requestMetrics.entries()) {
    const [method, ...rest] = key.split(' ');
    const status = rest[rest.length - 1];
    const route = rest.slice(0, -1).join(' ').replace(/"/g, '');
    const avg = value.totalMs / value.count;
    lines.push(`http_requests_total{method="${method}",route="${route}",status="${status}"} ${value.count}`);
    lines.push(`http_request_duration_ms_avg{method="${method}",route="${route}",status="${status}"} ${avg.toFixed(2)}`);
  }

  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.send(lines.join('\n'));
});

app.use(handleMulterError);
app.use(errorHandler);

export async function bootstrap(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      await initializeDatabase();
      await seedReferenceData();
      startupState.ready = true;
      startupState.error = null;
    })().catch((error) => {
      startupState.ready = false;
      startupState.error = error instanceof Error ? error.message : 'Unknown bootstrap error';
      throw error;
    });
  }

  await bootstrapPromise;
}

if (!env.isTest) {
  void bootstrap()
    .then(() => {
      app.listen(env.port, () => {
        logger.info('Server started', { port: env.port });
      });
    })
    .catch((error: Error) => {
      logger.error('API bootstrap failed', { error: error.message });
      process.exitCode = 1;
    });
}

export default app;
