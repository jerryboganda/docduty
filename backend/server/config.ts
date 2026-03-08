import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

loadEnv({ path: path.resolve(process.cwd(), '.env.local'), override: false });

const DEV_JWT_SECRET = 'docduty-dev-secret-change-in-production';
const DEV_REFRESH_SECRET = 'docduty-dev-refresh-secret-change-in-production';
const DEFAULT_DATABASE_URL = 'postgresql://docduty:docduty@localhost:5432/docduty';
const DEFAULT_TEST_DATABASE_URL = 'postgresql://docduty:docduty@localhost:5432/docduty_test';

const rawEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  FRONTEND_ORIGIN: z.string().default('http://localhost:3000,http://127.0.0.1:3000,http://localhost:8080'),
  START_BACKGROUND_JOBS: z.string().optional(),
  PUBLIC_API_URL: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  JWT_REFRESH_SECRET: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  MIGRATION_DATABASE_URL: z.string().optional(),
  TEST_DATABASE_URL: z.string().optional(),
  DATABASE_SSL_MODE: z.enum(['disable', 'require', 'no-verify']).default('disable'),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
  DATABASE_IDLE_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  DATABASE_CONNECTION_TIMEOUT_MS: z.coerce.number().int().positive().default(5_000),
  DATABASE_STATEMENT_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
  DATABASE_QUERY_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
  DATABASE_IDLE_TRANSACTION_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
  DATABASE_RETRY_MAX_ATTEMPTS: z.coerce.number().int().positive().default(8),
  DATABASE_RETRY_BACKOFF_MS: z.coerce.number().int().positive().default(1_500),
  DATABASE_APPLICATION_NAME: z.string().default('docduty-api'),
  UPLOADS_DIR: z.string().default('data/uploads'),
  SEED_REFERENCE_DATA: z.string().optional(),
  SEED_DEMO_DATA: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),
});

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  throw new Error(`Invalid boolean value: ${value}`);
}

const rawEnv = rawEnvSchema.parse(process.env);
const isProduction = rawEnv.NODE_ENV === 'production';
const isTest = rawEnv.NODE_ENV === 'test';

const jwtSecret = rawEnv.JWT_SECRET || (isProduction ? '' : DEV_JWT_SECRET);
const jwtRefreshSecret = rawEnv.JWT_REFRESH_SECRET || (isProduction ? '' : DEV_REFRESH_SECRET);

if (!jwtSecret) {
  throw new Error('FATAL: JWT_SECRET environment variable is required in production');
}

if (!jwtRefreshSecret) {
  throw new Error('FATAL: JWT_REFRESH_SECRET environment variable is required in production');
}

const databaseUrl = isTest
  ? rawEnv.TEST_DATABASE_URL || rawEnv.DATABASE_URL || DEFAULT_TEST_DATABASE_URL
  : rawEnv.DATABASE_URL || (isProduction ? '' : DEFAULT_DATABASE_URL);

if (!databaseUrl) {
  throw new Error('FATAL: DATABASE_URL environment variable is required');
}

const migrationDatabaseUrl = isTest
  ? rawEnv.TEST_DATABASE_URL || rawEnv.MIGRATION_DATABASE_URL || databaseUrl
  : rawEnv.MIGRATION_DATABASE_URL || databaseUrl;
const seedDemoDefault = isTest || rawEnv.NODE_ENV === 'development';

export const env = {
  nodeEnv: rawEnv.NODE_ENV,
  isProduction,
  isTest,
  port: rawEnv.PORT,
  frontendOrigins: rawEnv.FRONTEND_ORIGIN
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  startBackgroundJobs: parseBoolean(rawEnv.START_BACKGROUND_JOBS, true),
  publicApiUrl: rawEnv.PUBLIC_API_URL?.trim() || '',
  jwtSecret,
  jwtRefreshSecret,
  databaseUrl,
  migrationDatabaseUrl,
  database: {
    sslMode: rawEnv.DATABASE_SSL_MODE,
    poolMax: rawEnv.DATABASE_POOL_MAX,
    idleTimeoutMs: rawEnv.DATABASE_IDLE_TIMEOUT_MS,
    connectionTimeoutMs: rawEnv.DATABASE_CONNECTION_TIMEOUT_MS,
    statementTimeoutMs: rawEnv.DATABASE_STATEMENT_TIMEOUT_MS,
    queryTimeoutMs: rawEnv.DATABASE_QUERY_TIMEOUT_MS,
    idleTransactionTimeoutMs: rawEnv.DATABASE_IDLE_TRANSACTION_TIMEOUT_MS,
    retryMaxAttempts: rawEnv.DATABASE_RETRY_MAX_ATTEMPTS,
    retryBackoffMs: rawEnv.DATABASE_RETRY_BACKOFF_MS,
    applicationName: rawEnv.DATABASE_APPLICATION_NAME,
  },
  uploadsDir: path.resolve(process.cwd(), rawEnv.UPLOADS_DIR),
  seedReferenceData: parseBoolean(rawEnv.SEED_REFERENCE_DATA, true),
  seedDemoData: parseBoolean(rawEnv.SEED_DEMO_DATA, seedDemoDefault),
  rateLimitWindowMs: rawEnv.RATE_LIMIT_WINDOW_MS,
  rateLimitMaxRequests: rawEnv.RATE_LIMIT_MAX_REQUESTS,
} as const;

export function getPgSslConfig(): false | { rejectUnauthorized: boolean } {
  switch (env.database.sslMode) {
    case 'disable':
      return false;
    case 'require':
      return { rejectUnauthorized: true };
    case 'no-verify':
      return { rejectUnauthorized: false };
    default:
      return false;
  }
}
