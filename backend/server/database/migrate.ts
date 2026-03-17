import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Pool, type PoolClient } from 'pg';
import { env, getPgSslConfig } from '../config.js';
import { getPgMemPool, isPgMemUrl } from './pgmem.js';
import { logger } from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, 'migrations');
const ADVISORY_LOCK_GROUP = 98_231;
const ADVISORY_LOCK_KEY = 42_026;

type AppliedMigration = {
  filename: string;
  checksum: string;
};

function createMigrationPool(): Pool {
  if (isPgMemUrl(env.migrationDatabaseUrl)) {
    return getPgMemPool();
  }

  return new Pool({
    connectionString: env.migrationDatabaseUrl,
    ssl: getPgSslConfig(),
    max: 1,
    idleTimeoutMillis: env.database.idleTimeoutMs,
    connectionTimeoutMillis: env.database.connectionTimeoutMs,
    query_timeout: env.database.queryTimeoutMs,
    statement_timeout: env.database.statementTimeoutMs,
    application_name: `${env.database.applicationName}-migrator`,
    options: `-c TimeZone=UTC -c idle_in_transaction_session_timeout=${env.database.idleTransactionTimeoutMs}`,
  });
}

function readMigrationFiles(): string[] {
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }

  return fs.readdirSync(migrationsDir)
    .filter((filename) => filename.endsWith('.sql'))
    .sort((left, right) => left.localeCompare(right));
}

function calculateChecksum(filePath: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function normalizeSqlForPgMem(sql: string): string {
  return sql
    .replace(/CREATE EXTENSION IF NOT EXISTS pgcrypto;\s*/g, '')
    .replace(/CREATE OR REPLACE FUNCTION set_updated_at\(\)[\s\S]*?\$\$;\s*/g, '')
    .replace(/CREATE TRIGGER set_[\s\S]*?EXECUTE FUNCTION set_updated_at\(\);\s*/g, '');
}

async function ensureMigrationsTable(client: PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename text PRIMARY KEY,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function runMigrations(): Promise<{ applied: string[]; pending: string[] }> {
  const pool = createMigrationPool();
  const client = await pool.connect();

  try {
    if (!isPgMemUrl(env.migrationDatabaseUrl)) {
      await client.query('SELECT pg_advisory_lock($1, $2)', [ADVISORY_LOCK_GROUP, ADVISORY_LOCK_KEY]);
    }
    await ensureMigrationsTable(client);

    const existing = await client.query<AppliedMigration>(
      'SELECT filename, checksum FROM schema_migrations ORDER BY filename ASC'
    );
    const existingChecksums = new Map(existing.rows.map((row) => [row.filename, row.checksum]));

    const files = readMigrationFiles();
    const pending: string[] = [];
    const applied: string[] = [];

    for (const filename of files) {
      const filePath = path.join(migrationsDir, filename);
      const checksum = calculateChecksum(filePath);
      const knownChecksum = existingChecksums.get(filename);

      if (knownChecksum) {
        if (knownChecksum !== checksum) {
          throw new Error(`Migration checksum mismatch for ${filename}. Refusing to continue.`);
        }
        continue;
      }

      pending.push(filename);
      const rawSql = fs.readFileSync(filePath, 'utf8');
      const sql = isPgMemUrl(env.migrationDatabaseUrl) ? normalizeSqlForPgMem(rawSql) : rawSql;

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (filename, checksum) VALUES ($1, $2)',
          [filename, checksum],
        );
        await client.query('COMMIT');
        applied.push(filename);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }

    return { applied, pending };
  } finally {
    try {
      if (!isPgMemUrl(env.migrationDatabaseUrl)) {
        await client.query('SELECT pg_advisory_unlock($1, $2)', [ADVISORY_LOCK_GROUP, ADVISORY_LOCK_KEY]);
      }
    } catch {
      // Best-effort unlock.
    }
    client.release();
    if (!isPgMemUrl(env.migrationDatabaseUrl)) {
      await pool.end();
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(({ applied, pending }) => {
      logger.info('Migration complete', { status: 'ok', applied, pending });
    })
    .catch((error: Error) => {
      logger.error('Migration failed', { error: error.message });
      process.exitCode = 1;
    });
}
