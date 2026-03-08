import fs from 'node:fs';
import path from 'node:path';
import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { Client } from 'pg';
import { env } from '../server/config.js';
import { runMigrations } from '../server/database/migrate.js';

type TableRows = Record<string, Array<Record<string, unknown>>>;

const root = process.cwd();
const sqlitePath = process.env.SQLITE_PATH
  ? (path.isAbsolute(process.env.SQLITE_PATH) ? process.env.SQLITE_PATH : path.join(root, process.env.SQLITE_PATH))
  : path.join(root, 'data', 'docduty.db');
const pythonExporter = path.join(root, 'scripts', 'sqlite_export.py');
const phpExporter = path.join(root, 'scripts', 'sqlite_export.php');
const replaceExisting = ['1', 'true', 'yes', 'on'].includes((process.env.IMPORT_TRUNCATE || '').trim().toLowerCase());
const orderedTables = [
  'provinces',
  'cities',
  'specialties',
  'roles',
  'skills',
  'users',
  'doctor_profiles',
  'doctor_skills',
  'facility_accounts',
  'facility_locations',
  'wallets',
  'shifts',
  'shift_skills',
  'offers',
  'bookings',
  'attendance_events',
  'ledger_transactions',
  'payouts',
  'disputes',
  'dispute_evidence',
  'ratings',
  'notifications',
  'messages',
  'audit_logs',
  'otp_codes',
  'refresh_tokens',
  'policy_config',
  'contact_submissions',
  'user_preferences',
] as const;
const timestampColumns = new Set([
  'start_time',
  'end_time',
  'created_at',
  'updated_at',
  'requested_at',
  'used_at',
  'expires_at',
  'dispatched_at',
  'responded_at',
  'check_in_time',
  'check_out_time',
  'settled_at',
  'processed_at',
  'recorded_at',
  'resolved_at',
]);
const booleanColumns: Record<string, string[]> = {
  facility_locations: ['is_active'],
  shifts: ['counter_offer_allowed'],
  attendance_events: ['geo_valid', 'qr_valid', 'mock_location_detected', 'admin_override'],
  notifications: ['is_read'],
  user_preferences: [
    'push_notifications',
    'sms_notifications',
    'email_notifications',
    'marketing_emails',
    'show_online_status',
  ],
};
const jsonColumns: Record<string, string[]> = {
  attendance_events: ['device_info'],
  notifications: ['data'],
  audit_logs: ['old_value', 'new_value'],
};

function quoteIdentifier(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function normalizeTimestamp(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed.replace(' ', 'T')}Z`;
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(trimmed)) {
    return `${trimmed}Z`;
  }

  return trimmed;
}

function normalizeJson(table: string, column: string, value: unknown): unknown {
  if (!jsonColumns[table]?.includes(column)) {
    return value;
  }

  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'object') {
    return value;
  }

  if (typeof value !== 'string') {
    throw new Error(`Expected JSON text for ${table}.${column}, received ${typeof value}`);
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`Invalid JSON in ${table}.${column}: ${(error as Error).message}`);
  }
}

function normalizeBoolean(table: string, column: string, value: unknown): unknown {
  if (!booleanColumns[table]?.includes(column)) {
    return value;
  }

  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 't', 'yes', 'on'].includes(normalized)) {
      return true;
    }
    if (['0', 'false', 'f', 'no', 'off'].includes(normalized)) {
      return false;
    }
  }

  throw new Error(`Invalid boolean value in ${table}.${column}: ${String(value)}`);
}

function transformValue(table: string, column: string, value: unknown): unknown {
  if (value === undefined) {
    return null;
  }

  let transformed = normalizeBoolean(table, column, value);
  transformed = normalizeJson(table, column, transformed);

  if (timestampColumns.has(column)) {
    transformed = normalizeTimestamp(transformed);
  }

  return transformed;
}

function runPythonExporter(command: string, args: string[]): SpawnSyncReturns<string> {
  return spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 200,
    shell: process.platform === 'win32' && command === 'py',
  });
}

function loadSQLiteExport(): TableRows {
  if (!fs.existsSync(sqlitePath)) {
    throw new Error(`SQLite database not found: ${sqlitePath}`);
  }
  const attempts: Array<[string, string[]]> = [];

  if (fs.existsSync(pythonExporter)) {
    if (process.platform === 'win32') {
      attempts.push(['python', [pythonExporter, sqlitePath]]);
      attempts.push(['py', ['-3', pythonExporter, sqlitePath]]);
    } else {
      attempts.push(['python3', [pythonExporter, sqlitePath]]);
      attempts.push(['python', [pythonExporter, sqlitePath]]);
    }
  }

  if (fs.existsSync(phpExporter)) {
    attempts.push(['php', [phpExporter, sqlitePath]]);

    const laragonPhpRoots = [
      'C:\\laragon\\bin\\php',
      'C:\\Laragon\\bin\\php',
    ];
    for (const rootPath of laragonPhpRoots) {
      if (!fs.existsSync(rootPath)) {
        continue;
      }

      const versions = fs.readdirSync(rootPath)
        .map((entry) => path.join(rootPath, entry, 'php.exe'))
        .filter((candidate) => fs.existsSync(candidate))
        .sort()
        .reverse();
      if (versions.length > 0) {
        attempts.push([versions[0], [phpExporter, sqlitePath]]);
        break;
      }
    }
  }

  if (attempts.length === 0) {
    throw new Error('No SQLite exporter runtime is available. Install Python or ensure Laragon PHP is present.');
  }

  let lastError = '';
  for (const [command, args] of attempts) {
    const result = runPythonExporter(command, args);
    if (result.error) {
      lastError = result.error.message;
      continue;
    }
    if (result.status !== 0) {
      lastError = result.stderr || `Exporter exited with status ${result.status}`;
      continue;
    }

    const parsed = JSON.parse(result.stdout) as { tables?: TableRows };
    if (!parsed.tables || typeof parsed.tables !== 'object') {
      throw new Error('SQLite export payload is missing the expected tables object.');
    }

    return parsed.tables;
  }

  throw new Error(`Unable to export SQLite data. ${lastError}`);
}

function chunkRows<T>(rows: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }
  return chunks;
}

async function ensureTargetIsSafe(client: Client): Promise<void> {
  const result = await client.query<{ count: number }>('SELECT COUNT(*)::int AS count FROM users');
  const existingRows = result.rows[0]?.count ?? 0;

  if (existingRows > 0 && !replaceExisting) {
    throw new Error(
      'Target PostgreSQL database is not empty. Set IMPORT_TRUNCATE=true to replace existing data with the SQLite import.',
    );
  }
}

async function truncateTarget(client: Client): Promise<void> {
  const tables = [...orderedTables].reverse().map((table) => quoteIdentifier(table)).join(', ');
  await client.query(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);
}

async function importTable(client: Client, table: string, rows: Array<Record<string, unknown>>): Promise<void> {
  if (rows.length === 0) {
    return;
  }

  const columns = Object.keys(rows[0]);
  const quotedColumns = columns.map(quoteIdentifier).join(', ');

  for (const batch of chunkRows(rows, 200)) {
    const values: unknown[] = [];
    const placeholders = batch.map((row, rowIndex) => {
      const rowPlaceholders = columns.map((column, columnIndex) => {
        values.push(transformValue(table, column, row[column]));
        return `$${rowIndex * columns.length + columnIndex + 1}`;
      });
      return `(${rowPlaceholders.join(', ')})`;
    }).join(', ');

    await client.query(
      `INSERT INTO ${quoteIdentifier(table)} (${quotedColumns}) VALUES ${placeholders}`,
      values,
    );
  }
}

async function validateCounts(client: Client, tables: TableRows): Promise<void> {
  for (const table of orderedTables) {
    const sourceCount = tables[table]?.length ?? 0;
    const result = await client.query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM ${quoteIdentifier(table)}`);
    const targetCount = result.rows[0]?.count ?? 0;

    if (sourceCount !== targetCount) {
      throw new Error(`Row count mismatch for ${table}: source=${sourceCount}, target=${targetCount}`);
    }
  }
}

async function main(): Promise<void> {
  const tables = loadSQLiteExport();
  const missingFromSource = orderedTables.filter((table) => !Array.isArray(tables[table]));
  if (missingFromSource.length > 0) {
    console.warn(`[db:import:sqlite] Source is missing tables: ${missingFromSource.join(', ')}`);
  }

  await runMigrations();

  const client = new Client({
    connectionString: env.migrationDatabaseUrl,
  });

  await client.connect();

  try {
    await client.query('BEGIN');
    await ensureTargetIsSafe(client);
    if (replaceExisting) {
      await truncateTarget(client);
    }

    for (const table of orderedTables) {
      const rows = tables[table] || [];
      await importTable(client, table, rows);
      console.log(`[db:import:sqlite] Imported ${rows.length} row(s) into ${table}`);
    }

    await validateCounts(client, tables);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }

  console.log(`[db:import:sqlite] Migration completed from ${sqlitePath}`);
}

void main().catch((error: Error) => {
  console.error('[db:import:sqlite]', error.message);
  process.exitCode = 1;
});
