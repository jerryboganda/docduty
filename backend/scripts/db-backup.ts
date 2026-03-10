import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { env } from '../server/config.js';

const root = process.cwd();
const backupsDir = path.join(root, 'data', 'backups', 'postgres');
const format = (process.env.BACKUP_FORMAT || 'custom').trim().toLowerCase();
const extension = format === 'plain' ? 'sql' : 'dump';

fs.mkdirSync(backupsDir, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(backupsDir, `docduty-${timestamp}.${extension}`);

const command = format === 'plain' ? 'pg_dump' : 'pg_dump';
const args = format === 'plain'
  ? ['--file', backupPath, '--format=plain', env.databaseUrl]
  : ['--file', backupPath, '--format=custom', env.databaseUrl];

const result = spawnSync(command, args, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.error) {
  console.error('[db:backup] Failed to execute pg_dump. Ensure PostgreSQL client tools are installed and on PATH.');
  console.error(result.error.message);
  process.exit(1);
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log(`Backup created: ${backupPath}`);

// ── Retention sweep — keep the most recent N backups ────────────────────────
const retainCount = Number(process.env.BACKUP_RETAIN_COUNT) || 30;
const existing = fs
  .readdirSync(backupsDir)
  .filter((f) => f.startsWith('docduty-') && (f.endsWith('.dump') || f.endsWith('.sql')))
  .sort(); // ISO timestamps sort lexicographically

if (existing.length > retainCount) {
  const toDelete = existing.slice(0, existing.length - retainCount);
  for (const file of toDelete) {
    fs.unlinkSync(path.join(backupsDir, file));
    console.log(`[db:backup] Pruned old backup: ${file}`);
  }
  console.log(`[db:backup] Retained ${retainCount} most recent backups, pruned ${toDelete.length}.`);
}
