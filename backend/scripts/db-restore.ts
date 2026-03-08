import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { env } from '../server/config.js';

const root = process.cwd();
const source = process.env.BACKUP_FILE
  ? (path.isAbsolute(process.env.BACKUP_FILE) ? process.env.BACKUP_FILE : path.join(root, process.env.BACKUP_FILE))
  : '';

if (!source) {
  console.error('BACKUP_FILE env var is required');
  process.exit(1);
}

if (!fs.existsSync(source)) {
  console.error(`Backup file not found: ${source}`);
  process.exit(1);
}

const isPlainSql = source.toLowerCase().endsWith('.sql');
const command = isPlainSql ? 'psql' : 'pg_restore';
const args = isPlainSql
  ? [env.databaseUrl, '--file', source]
  : ['--clean', '--if-exists', '--no-owner', '--dbname', env.databaseUrl, source];

const result = spawnSync(command, args, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.error) {
  console.error(`[db:restore] Failed to execute ${command}. Ensure PostgreSQL client tools are installed and on PATH.`);
  console.error(result.error.message);
  process.exit(1);
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log(`Database restored from ${source}`);
