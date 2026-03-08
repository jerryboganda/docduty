# DocDuty

DocDuty is a full-stack doctor duty replacement and locum marketplace for Pakistan. The platform includes a React/Vite portal, an Express API, realtime messaging, attendance verification, settlements, disputes, and an admin console.

## Stack

- Frontend: React 19, TypeScript, Vite 6, Tailwind CSS v4
- Backend: Node.js, Express 4, TypeScript
- Database: PostgreSQL via `pg`
- Auth: JWT access and refresh tokens
- Realtime: Soketi/Pusher-compatible WebSocket integration

## Workspace Layout

- `web-app/`: React/Vite portal and marketing website
- `mobile-app/`: Flutter mobile application
- `backend/`: Express API, database layer, scripts, and automated tests
- root: shared orchestration files such as `package.json`, Docker assets, CI config, and project docs

## Local Development

Prerequisites:

- Node.js 22+
- PostgreSQL 16+ or Docker Compose

1. Copy `.env.example` to `.env`.
2. Start PostgreSQL locally, or run `docker compose up -d docduty-postgres`.
3. Install dependencies with `npm install`.
4. Run migrations with `npm run db:migrate`.
5. Seed reference and demo data with `npm run db:seed`.
6. Start the stack with `npm run dev:full`.

Default local endpoints:

- Frontend: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:3001/api](http://localhost:3001/api)
- Readiness: [http://localhost:3001/api/readiness](http://localhost:3001/api/readiness)

## Database Workflow

- `npm run db:migrate`: apply SQL migrations to PostgreSQL
- `npm run db:seed`: seed reference data and development/test demo accounts
- `npm run db:backup`: create a PostgreSQL backup with `pg_dump`
- `npm run db:restore`: restore a PostgreSQL backup with `pg_restore` or `psql`
- `npm run db:import:sqlite`: import the legacy `data/docduty.db` SQLite dataset into PostgreSQL

The SQLite import script is intended for one-time migration from the legacy MVP database. It runs only when explicitly invoked and never participates in the runtime path.

## Testing

Integration and end-to-end tests now expect PostgreSQL. Set `TEST_DATABASE_URL` to a disposable database and run:

- `npm run test:integration`
- `npm run test:e2e`
- `npm run ci`

The GitHub Actions workflow provisions PostgreSQL automatically for CI.

## Demo Accounts

The development seed creates these accounts when `SEED_DEMO_DATA=true`:

| Role | Phone | Password |
|------|-------|----------|
| Facility Admin | 03001234567 | test123 |
| Doctor | 03111111111 | test123 |
| Platform Admin | 03000000000 | test123 |

## Migration Notes

The project no longer uses SQLite in production, development, CI, or tests. PostgreSQL is the sole relational database. See `docs/postgresql-migration.md` for the audit summary, migration plan, data migration workflow, and operational guidance.
