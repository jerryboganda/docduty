import { newDb, DataType, type IMemoryDb } from 'pg-mem';
import type { Pool } from 'pg';

let runtimeDb: IMemoryDb | null = null;

function registerFunctions(db: IMemoryDb): void {
  db.public.registerFunction({
    name: 'current_database',
    returns: DataType.text,
    implementation: () => 'docduty_test',
  });
}

function createMemoryDb(): IMemoryDb {
  const db = newDb({
    autoCreateForeignKeyIndices: true,
  });
  registerFunctions(db);
  return db;
}

export function isPgMemUrl(connectionString: string): boolean {
  return connectionString.startsWith('pgmem://');
}

export function getPgMemPool(): Pool {
  if (!runtimeDb) {
    runtimeDb = createMemoryDb();
  }

  const adapter = runtimeDb.adapters.createPg();
  return new adapter.Pool() as unknown as Pool;
}

export function resetPgMem(): void {
  runtimeDb = null;
}
