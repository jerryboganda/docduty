# PostgreSQL Migration Report

## Audit Summary

SQLite was previously embedded across the dependency graph, runtime, scripts, tests, CI, and documentation:

- runtime dependency on `better-sqlite3`
- synchronous SQLite access in the API route layer and utilities
- SQLite-specific SQL such as `datetime('now')`, PRAGMA usage, and 0/1 boolean handling
- local file database configuration via `DB_PATH`
- file-copy backup and restore scripts targeting `data/docduty.db`
- tests bootstrapping temporary `.db` files
- CI and Docker assets without PostgreSQL services
- legacy data stored in `data/docduty.db`

Primary risk areas discovered during audit:

- mixed timestamp formats in SQLite (`datetime('now')` strings and ISO timestamps)
- JSON-like payloads stored as plain text
- integer-backed booleans
- implicit SQLite typing behavior
- synchronous route code that would break once the driver became asynchronous
- operational scripts tightly coupled to file-based backups

## Target Architecture

The current target state is PostgreSQL-only:

- `pg` connection pooling with typed environment validation
- SQL migration runner with advisory locking and checksum verification
- PostgreSQL-native schema using UUID primary keys, `timestamptz`, `jsonb`, booleans, foreign keys, and explicit indexes
- readiness and health checks backed by live database probes
- deterministic startup that runs migrations before seeding
- CI and container orchestration aligned around PostgreSQL

## Migration Plan

1. Remove SQLite runtime packages and file-path configuration.
2. Introduce typed PostgreSQL configuration and pooled connections.
3. Replace the schema with migration-managed PostgreSQL DDL.
4. Convert every API route and utility from synchronous SQLite calls to async PostgreSQL access.
5. Normalize booleans, timestamps, JSON handling, and PostgreSQL query semantics.
6. Replace file-copy operational scripts with PostgreSQL tooling.
7. Convert tests and CI to PostgreSQL.
8. Provide a one-time legacy data import path from SQLite to PostgreSQL.
9. Update Docker assets and documentation.

## Data Migration Strategy

Legacy SQLite data currently exists at `data/docduty.db`.

The migration path is:

1. Export SQLite tables through `scripts/sqlite_export.py`.
2. Apply PostgreSQL migrations to the target database.
3. Run `npm run db:import:sqlite`.
4. The importer:
   - validates source availability
   - refuses to overwrite a non-empty target unless `IMPORT_TRUNCATE=true`
   - normalizes timestamps into UTC-compatible values
   - converts integer booleans into native PostgreSQL booleans
   - parses text JSON into `jsonb`
   - loads data in dependency order inside a single transaction
   - validates row counts table by table before commit

Recommended command:

```bash
IMPORT_TRUNCATE=true SQLITE_PATH=data/docduty.db npm run db:import:sqlite
```

## Operational Guidance

- Use `DATABASE_URL` for runtime connections and `MIGRATION_DATABASE_URL` for migration execution.
- Use `TEST_DATABASE_URL` for integration and end-to-end tests.
- Use `db:migrate` during deploy before serving traffic.
- Use `db:backup` and `db:restore` with PostgreSQL client tools installed (`pg_dump`, `pg_restore`, `psql`).
- Keep `SEED_DEMO_DATA=false` in production.

## Validation Expectations

- `npm run lint`
- `npm run build`
- `npm run test:integration`
- `npm run test:e2e`
- `GET /api/health`
- `GET /api/readiness`

## Residual Notes

- Historical audit and assessment documents may still describe the old SQLite architecture as part of their original findings. The live codebase, runtime path, Docker setup, CI workflow, and test harness now target PostgreSQL only.
