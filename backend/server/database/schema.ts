import { AsyncLocalStorage } from 'node:async_hooks';
import { Pool, types, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';
import { env, getPgSslConfig } from '../config.js';
import { logger } from '../utils/logger.js';
import { runMigrations } from './migrate.js';
import { getPgMemPool, isPgMemUrl, resetPgMem } from './pgmem.js';

type Queryable = Pick<Pool, 'query'> | Pick<PoolClient, 'query'>;

type RunResult<T extends QueryResultRow = QueryResultRow> = {
  changes: number;
  rowCount: number;
  rows: T[];
};

type TransactionState = {
  client: PoolClient;
  savepointCounter: number;
};

const transactionStorage = new AsyncLocalStorage<DbSession>();
const compiledStatementCache = new Map<string, string>();
const BIGINT_OID = 20;

let runtimePool: Pool | null = null;
let initializationPromise: Promise<void> | null = null;

types.setTypeParser(BIGINT_OID, (value) => {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new Error(`PostgreSQL bigint value exceeds JavaScript safe integer range: ${value}`);
  }

  return parsed;
});

function compileStatement(sql: string): string {
  const cached = compiledStatementCache.get(sql);
  if (cached) {
    return cached;
  }

  let parameterIndex = 0;
  const compiled = sql.replace(/\?/g, () => `$${++parameterIndex}`);
  compiledStatementCache.set(sql, compiled);
  return compiled;
}

function normalizeParams(values: unknown[]): unknown[] {
  return values.map((value) => value === undefined ? null : value);
}

function createRuntimePool(): Pool {
  if (isPgMemUrl(env.databaseUrl)) {
    return getPgMemPool();
  }

  const pool = new Pool({
    connectionString: env.databaseUrl,
    ssl: getPgSslConfig(),
    max: env.database.poolMax,
    idleTimeoutMillis: env.database.idleTimeoutMs,
    connectionTimeoutMillis: env.database.connectionTimeoutMs,
    query_timeout: env.database.queryTimeoutMs,
    statement_timeout: env.database.statementTimeoutMs,
    application_name: env.database.applicationName,
    options: `-c TimeZone=UTC -c idle_in_transaction_session_timeout=${env.database.idleTransactionTimeoutMs}`,
  });

  pool.on('error', (error) => {
    logger.error('Database pool error', { error: error.message });
  });

  return pool;
}

async function getPool(): Promise<Pool> {
  if (!runtimePool) {
    runtimePool = createRuntimePool();
  }

  return runtimePool;
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= env.database.retryMaxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      logger.error(`Database init attempt ${attempt}/${env.database.retryMaxAttempts} failed`, { error: lastError.message });
      if (attempt < env.database.retryMaxAttempts) {
        await delay(env.database.retryBackoffMs * attempt);
      }
    }
  }

  throw lastError || new Error('Database initialization failed');
}

class PreparedStatement<T extends QueryResultRow = QueryResultRow> {
  constructor(
    private readonly session: DbSession,
    private readonly sql: string,
  ) {}

  async get(...params: unknown[]): Promise<T | undefined> {
    const result = await this.session.query<T>(this.sql, params);
    return result.rows[0];
  }

  async all(...params: unknown[]): Promise<T[]> {
    const result = await this.session.query<T>(this.sql, params);
    return result.rows;
  }

  async run(...params: unknown[]): Promise<RunResult<T>> {
    const result = await this.session.query<T>(this.sql, params);
    return {
      changes: result.rowCount ?? 0,
      rowCount: result.rowCount ?? 0,
      rows: result.rows,
    };
  }
}

class DbSession {
  constructor(
    private readonly resolveExecutor: () => Promise<Queryable>,
    readonly transactionState?: TransactionState,
  ) {}

  prepare<T extends QueryResultRow = QueryResultRow>(sql: string): PreparedStatement<T> {
    return new PreparedStatement<T>(this, sql);
  }

  async exec(sql: string): Promise<void> {
    await this.query(sql);
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params: unknown[] = [],
  ): Promise<QueryResult<T>> {
    const activeSession = transactionStorage.getStore();
    const session = activeSession?.transactionState ? activeSession : this;
    const executor = await session.resolveExecutor();
    return executor.query<T>({
      text: compileStatement(sql),
      values: normalizeParams(params),
    });
  }

  transaction<T>(fn: () => Promise<T> | T): () => Promise<T> {
    return async () => {
      const current = transactionStorage.getStore();
      if (current?.transactionState) {
        return current.runNestedTransaction(fn);
      }

      const pool = await getPool();
      const client = await pool.connect();
      const session = new DbSession(async () => client, {
        client,
        savepointCounter: 0,
      });

      try {
        await client.query('BEGIN');
        const result = await transactionStorage.run(session, async () => await fn());
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    };
  }

  private async runNestedTransaction<T>(fn: () => Promise<T> | T): Promise<T> {
    if (!this.transactionState) {
      return this.transaction(fn)();
    }

    const savepointName = `docduty_sp_${++this.transactionState.savepointCounter}`;
    await this.transactionState.client.query(`SAVEPOINT ${savepointName}`);

    try {
      const result = await transactionStorage.run(this, async () => await fn());
      await this.transactionState.client.query(`RELEASE SAVEPOINT ${savepointName}`);
      return result;
    } catch (error) {
      await this.transactionState.client.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
      await this.transactionState.client.query(`RELEASE SAVEPOINT ${savepointName}`);
      throw error;
    }
  }
}

const rootSession = new DbSession(getPool);

export function getDb(): DbSession {
  return transactionStorage.getStore() || rootSession;
}

export async function initializeDatabase(): Promise<void> {
  if (!initializationPromise) {
    initializationPromise = withRetry(async () => {
      await runMigrations();
      await checkDatabaseHealth();
    });
  }

  await initializationPromise;
}

export async function checkDatabaseHealth(): Promise<void> {
  const pool = await getPool();
  await pool.query('SELECT 1');
}

export async function closeDatabase(): Promise<void> {
  if (runtimePool) {
    await runtimePool.end();
    runtimePool = null;
  }
  if (isPgMemUrl(env.databaseUrl)) {
    resetPgMem();
  }
  initializationPromise = null;
}
