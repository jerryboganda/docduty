# Project SSOT

## 1. Executive Overview

| Item | Value |
| --- | --- |
| Project name | DocDuty |
| Project purpose | Pakistan-focused healthcare staffing marketplace for doctor duty replacement, facility staffing, attendance verification, settlements, disputes, and admin oversight |
| Current production status | Partially Verified, Production Critical. Source and deployment configs target production domains and VPS deployment. Live production behavior was not re-verified in this audit. |
| Main platforms | Backend API, portal web app, standalone marketing website, Flutter mobile app, Docker-based production stack |
| High-level architecture summary | Monorepo with a Node/Express/PostgreSQL backend, React/Vite portal for doctor/facility/admin surfaces, separate React/Vite marketing website, Flutter mobile client, Docker Compose deployment, and Nginx Proxy Manager as the public reverse proxy |
| Critical operational summary | PostgreSQL is the sole runtime database. API startup runs migrations and seeding, then serves health/readiness/metrics. Background jobs run inline inside the API process. Production domain split is website on `docduty.com.pk`, portal on `portal.docduty.com.pk`, admin on `admin.docduty.com.pk`, API on `api.docduty.com.pk`. |
| Current top risks | Stale CI wiring after workspace reorganization, tracked `.env` file with plaintext dev credentials, single-process inline jobs, incomplete production ops documentation, mobile/backend contract drift, website contact form not connected |
| Last audit date | 2026-03-07 |

### Confidence Status by Major Area

| Area | Status | Notes |
| --- | --- | --- |
| Backend/API | Verified | Source, routes, config, migrations, jobs, tests, and scripts inspected directly |
| Portal web app | Verified | Source, routing, API client, build config, and host split inspected directly |
| Website / marketing site | Partially Verified | Source and build path inspected directly; runtime production behavior and analytics instrumentation not found |
| Mobile app | Partially Verified | Current code is integrated with backend contracts, but several route/role/API mismatches remain |
| Production infrastructure | Partially Verified | Repo and operator-reported deployment facts available; VPS provider, OS, DNS provider, SSL issuer, and monitoring setup remain unverified |
| CI/CD | Partially Verified | Workflow file exists, but pathing is stale relative to the current workspace layout |
| Secrets and access | Partially Verified | Secret names and usage identified; ownership, storage discipline, and rotation policy are incompletely documented |

### 1.1 Support Contact Canonical Values

| Item | Canonical value | Scope | Notes |
| --- | --- | --- | --- |
| Public support phone | `+92 321 4261 950` | Website, portal/web app support surfaces, mobile app help/legal surfaces, structured metadata, and public support copy | This is the canonical customer-facing phone number and should replace legacy `111-DOCDUTY` references |
| Public support email | `support@docduty.pk` | Public support/help/legal surfaces where a support inbox is displayed | Legacy `.com` references should be treated as stale unless explicitly required |
| General contact email | `hello@docduty.pk` | Marketing/footer/organization contact metadata | Keep distinct from support inbox usage |

Scope rule: these canonical contact values apply to public and support-facing product surfaces only. They do not replace seeded auth users, demo credentials, OTP examples, or role test phone numbers.

### 1.2 Session-Implemented State (2026-03-08)

The following repo and localhost corrections were implemented and verified in this working session:

1. Local PostgreSQL verification was moved back onto Laragon-backed PostgreSQL on `127.0.0.1:5432`, with `docduty` and `docduty_test` databases created and the backend test runtime re-pointed to real PostgreSQL.
2. Local app hosting was verified on:
   - portal/web app: `http://127.0.0.1:3000`
   - backend API: `http://127.0.0.1:3001/api`
   - marketing website: `http://127.0.0.1:3002`
   - Flutter mobile web build: `http://127.0.0.1:3003`
3. Localhost runtime fixes were applied so login/register flows remain local on `localhost` and `127.0.0.1`, including host-aware redirect handling and backend CORS acceptance for both local origins.
4. Marketing site CTA routing was normalized:
   - all marketing `Login` entry points route to the portal sign-in page
   - all marketing `Get Started` / register CTAs route to the portal registration state on `/login?mode=register`
   - doctor/facility-specific CTAs preselect the appropriate registration role
5. Marketing hero and homepage presentation fixes were applied without changing the product narrative:
   - hero structural/responsive alignment corrected
   - dark footer transition corrected
   - hero heading tightened to a cleaner line structure
   - live marketplace badge upgraded with premium motion treatment
   - attendance radar/orbit expanded into a denser multi-signal proof-system visualization and the stray outer border was removed
6. Cross-surface support contact standardization was updated to use the canonical support phone `+92 321 4261 950` on current website, web app admin, and mobile support/legal surfaces.
7. Earlier route/metadata cleanup from this same session remains part of the current working state, including admin route drift fixes and broken marketing metadata cleanup.

## 2. System Landscape

### 2.1 Product Surfaces

#### Canonical Naming and Aliases

| Canonical name | Alias seen in repo/history | Canonical meaning | Status |
| --- | --- | --- | --- |
| Backend API | `docduty-api`, API, server | Express/PostgreSQL service under `backend/` | Verified |
| Portal web app | portal, web app | Doctor + facility + admin React app under `web-app/` | Verified |
| Admin surface | admin panel, admin portal | Platform-admin route tree inside the portal web app, hosted separately on `admin.docduty.com.pk` | Verified |
| Website / marketing site | main website, marketing site | Standalone React marketing app under `website/` | Verified |
| Mobile app | Flutter app | Cross-platform Flutter client under `mobile-app/` | Verified |
| Production VPS | production server, VPS | Single operator-reported Docker host fronted by Nginx Proxy Manager | Partially Verified |

#### Active Product Surfaces

| Surface | Description | Status |
| --- | --- | --- |
| Backend | REST API, auth, data access, jobs, uploads, analytics, audit logging | Production Critical |
| Mobile app | Flutter app for doctor, facility, and admin role flows | Production Critical, Partially Verified |
| Web app | React portal for doctor and facility flows plus separately hosted admin surface | Production Critical |
| Website / marketing site | Standalone public site and mobile web host under `/mobile/` in production image | Production Critical |
| Admin panels / dashboards | React admin surface in `web-app/`; Flutter admin shell exists but is only partially aligned to backend | Production Critical, Needs Cleanup |
| Internal tools | Health/readiness/metrics endpoints, audit views, route inventory, accessibility audit, load test scripts | Verified |

### 2.2 Repository Map

DocDuty is currently one monorepo with multiple deployable application folders.

| Name | Purpose | Owner | Path / location | Primary stack | Deployment target | Related services | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `backend` | API, database layer, migrations, scripts, tests, env, Docker assets | Founder/Ops role not formally assigned | `C:\Users\Admin\Desktop\DocDuty\backend` | Node 22, Express 4, TypeScript, PostgreSQL | `api.docduty.com.pk`, Docker container `docduty-api` | `web-app`, `website`, `mobile-app`, PostgreSQL | Verified | Contains current package manifest and operational scripts |
| `web-app` | Portal React SPA for doctor, facility, and admin surfaces | Founder/Product engineering, formal owner not documented | `C:\Users\Admin\Desktop\DocDuty\web-app` | React 19, Vite 6, TypeScript, Tailwind v4 | `portal.docduty.com.pk`, `admin.docduty.com.pk`, Docker container `docduty-portal` | `backend` | Verified | Hostname-aware routing splits admin vs portal surfaces |
| `website` | Standalone public marketing website | Founder/Growth, formal owner not documented | `C:\Users\Admin\Desktop\DocDuty\website` | React 18, Vite 5, shadcn/ui-style component stack, PWA plugin | `docduty.com.pk`, Docker container `docduty-marketing` | `mobile-app` web build | Partially Verified | Package name still generic (`vite_react_shadcn_ts`) |
| `mobile-app` | Flutter mobile client | Founder/Product engineering, formal owner not documented | `C:\Users\Admin\Desktop\DocDuty\mobile-app` | Flutter 3.x, Dart, GetX, Dio | Native builds and web build served under `/mobile/` in marketing image | `backend` | Partially Verified | Current code integrates with API but has unresolved role/endpoint mismatches |
| `backend/ops` | Deployment, Compose, container, Nginx, CI assets | Ops owner not documented | `C:\Users\Admin\Desktop\DocDuty\backend\ops` | Docker Compose, Nginx, GitHub Actions YAML | Production VPS | All services | Verified | CI workflow is stored here, not at repo root |
| `backend/archive` | Legacy deployment bundle, logs, historical artifacts | No active owner | `C:\Users\Admin\Desktop\DocDuty\backend\archive` | Mixed | None | Historical only | Legacy | Contains stale SQLite-era artifacts and prior build outputs |

### 2.3 Environment Matrix

| Environment | Purpose | Hosting | Domains | Config source | Deployment method | Differences from other environments | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Local | Developer workstation | Windows workstation, Laragon PostgreSQL or Docker Compose | `localhost:3000`, `127.0.0.1:3000`, `localhost:3001/api`, `127.0.0.1:3001/api`, `127.0.0.1:3002`, `127.0.0.1:3003` | `backend/.env`, `backend/.env.example`, mobile `String.fromEnvironment` values | Direct `npm` / Flutter commands or Compose | Uses Laragon PostgreSQL for current verified local runtime, likely no SSL, realtime usually disabled | Verified |
| Development | Effectively same as local; no dedicated remote dev environment found | Not separately documented | Not separately documented | Same as local | Manual | No distinct development hosting found | Needs Cleanup |
| Staging | Intended pre-production validation | Not found | Not found | Not found | Not found | No staging environment documented or configured | Unverified |
| Production | Customer-facing live system | Single operator-reported VPS with Docker and Nginx Proxy Manager | `docduty.com.pk`, `portal.docduty.com.pk`, `admin.docduty.com.pk`, `api.docduty.com.pk` | Server-side `.env` equivalent, exact path not documented | GitHub pull + Docker Compose, operator-reported | Public TLS, Dockerized, NPM upstream routing, shared VPS | Partially Verified |
| Preview | PR/feature preview environments | Not found | Not found | Not found | Not found | No preview deployment system found | Unverified |

## 3. Architecture

### 3.1 High-Level Architecture

DocDuty is a multi-surface staffing platform centered on a PostgreSQL-backed Express API.

1. Public users reach `docduty.com.pk` for marketing pages.
2. Doctors and facilities use the React portal on `portal.docduty.com.pk`.
3. Platform admins use the same React application on `admin.docduty.com.pk`, with hostname-aware routing.
4. The backend API lives behind `api.docduty.com.pk`.
5. The Flutter mobile app consumes the same REST API.
6. Production deployment runs inside Docker containers behind Nginx Proxy Manager.
7. PostgreSQL is the single primary data store.
8. Uploads are stored on the application filesystem, not object storage.
9. Background jobs run inline inside the API process via `setInterval`.

### 3.2 Backend Architecture

| Area | Current state |
| --- | --- |
| Framework / language | Node.js + Express 4 + TypeScript |
| Entrypoints | `backend/server/index.ts` for runtime, `backend/server/database/migrate.ts` for migrations |
| Modules / services | Route modules for auth, users, facilities, shifts, bookings, attendance, wallets, disputes, ratings, notifications, messages, admin, reference, contact, uploads |
| APIs | JSON REST API under `/api/*`; health, readiness, and metrics endpoints available |
| Auth model | JWT access and refresh tokens, bearer auth, bcrypt password hashing, role-based authorization |
| Database access | PostgreSQL via `pg` pool, parameterized query wrapper, transaction support with nested savepoints via `AsyncLocalStorage` |
| Jobs / workers | Inline background jobs in `backend/server/utils/backgroundJobs.ts`: no-show detection every 2 minutes, shift expiry every 5 minutes, auto-complete every 10 minutes |
| Storage | PostgreSQL + local uploads directory (`UPLOADS_DIR`) |
| Third-party integrations | Pusher-compatible Soketi support, optional Google Maps key usage for mobile, optional Gemini env placeholder present but no active server integration found |
| Deployment / runtime model | API container `docduty-api`; migrations and DB health run at startup before serving traffic |

#### Backend Design Notes

- `initializeDatabase()` runs migrations and health checks before the API listens.
- Seed data runs on bootstrap through `seedReferenceData()`.
- Structured request logging writes JSON to stdout and in-memory request metrics are exposed at `/api/metrics`.
- Health model:
  - `/api/health`: DB connectivity check
  - `/api/readiness`: startup state + DB availability
  - `/api/metrics`: Prometheus-style plaintext metrics
- Uploads are served from `/api/uploads/*` with restrictive headers.
- Admin analytics cache is in-process memory with a 60-second TTL.
- Realtime is optional. If Soketi is unavailable, notifications and messages still persist in the database and clients fall back to polling.

### 3.3 Mobile App Architecture

| Area | Current state |
| --- | --- |
| Framework / platform | Flutter + Dart |
| iOS / Android status | Cross-platform project exists; audit did not verify native store builds in this pass |
| Environments | API base and feature flags come from `String.fromEnvironment` in `mobile-app/lib/core/config/env.dart` |
| Build / release pipeline | Manual Flutter commands; web build is produced by `backend/ops/Dockerfile.marketing` and served under `/mobile/` |
| API dependency | Dio client with bearer token injection and refresh-token retry |
| Auth | Secure token storage via `flutter_secure_storage`, `AuthService`, GetX route guards |
| Feature flags | Realtime enable flag, debug logging flag, Google Maps key, polling intervals |
| Analytics / crash reporting | No third-party analytics or crash reporting integration found |
| Push notifications | No FCM/APNs configuration found; notifications are polling-first in current code |
| Store release process | Not documented |

#### Mobile Status Assessment

- Current codebase is not the stale UI kit described in older due-diligence docs; it has active API services, models, auth, secure storage, and role-based feature folders.
- Current role folders:
  - `features/doctor`
  - `features/facility`
  - `features/admin`
  - `features/auth`
  - `features/shared`
- Current risks:
  - routing uses `admin` in several places while backend canonical role is `platform_admin`
  - service layer expects several endpoints not found in backend, for example `/facilities/me` and approval/reject patterns that differ from current admin routes
  - this makes the mobile surface Partially Verified rather than fully production-ready

### 3.4 Web App Architecture

| Area | Current state |
| --- | --- |
| Framework | React 19 + TypeScript + Vite 6 |
| Routing / rendering model | Client-side SPA with React Router; hostname-aware routing splits admin and portal surfaces |
| Auth | Access and refresh tokens stored in `localStorage`; API client retries 401s via refresh |
| API integration | `web-app/src/lib/api.ts` |
| State management | React Context (`AuthContext`, `ToastContext`) with local component state |
| Build system | Vite builds output into `backend/dist` |
| Deployment target | `portal.docduty.com.pk` and `admin.docduty.com.pk` via `docduty-portal` Docker image |
| Environment setup | `VITE_API_URL`, `VITE_ENABLE_REALTIME`, `VITE_SOKETI_HOST`, `VITE_SOKETI_PORT`, `VITE_SOKETI_APP_KEY` |

#### Web App Notes

- Canonical hostnames are defined in `web-app/src/lib/runtimeHost.ts`.
- Role-to-surface mapping:
  - `doctor` -> `/doctor` on `portal.docduty.com.pk`
  - `facility_admin` -> `/facility` on `portal.docduty.com.pk`
  - `platform_admin` -> `/admin` on `admin.docduty.com.pk`
- Realtime uses `pusher-js` but is disabled by default and falls back to polling.

### 3.5 Website / Marketing Site Architecture

| Area | Current state |
| --- | --- |
| Framework / generator | Standalone React 18 + Vite 5 SPA with PWA plugin |
| Hosting | Built into `docduty-marketing` Nginx image |
| Analytics | No GA4, PostHog, Mixpanel, or similar integration found |
| Forms / leads / contact flows | Backend has `/api/contact`, but current `website/src/pages/ContactPage.tsx` prevents default submit and does not post to the API |
| SEO-related setup | SPA metadata, robots, manifest/PWA support; no advanced SEO or analytics platform found |
| Deployment flow | Built by `backend/ops/Dockerfile.marketing`, which also builds Flutter web and serves it under `/mobile/` |

#### Website Notes

- The website is no longer the same codebase as the portal app.
- The production marketing image serves:
  - website root from `/usr/share/nginx/html`
  - Flutter web build from `/usr/share/nginx/html/mobile`
- The website package name is still generic and should be normalized.

## 4. Infrastructure and Production

### 4.1 Hosting Overview

| System / provider | Purpose | Current state | Status |
| --- | --- | --- | --- |
| Production VPS | Main production host | Single operator-reported VPS running Docker and Nginx Proxy Manager | Partially Verified |
| Docker | Runtime packaging and orchestration | Used for API, portal, marketing/mobile, and PostgreSQL containers | Verified |
| Nginx Proxy Manager | Public reverse proxy and SSL termination | Installed on production VPS, network name `nginx-proxy-manager_default` referenced by Compose | Partially Verified |
| PostgreSQL | Primary relational database | Dockerized `postgres:17-alpine` in Compose; local Laragon PostgreSQL also used in development | Verified |
| CDN | None found | No CDN configuration found | Unverified |
| Object storage | None found | Uploads stored on local filesystem | Verified |
| Managed cache / queue | None found | No Redis, SQS, RabbitMQ, or similar found | Verified |
| Email provider | Placeholder only | SMTP variables commented in `.env.example` | Unverified |
| SMS provider | Placeholder only | SMS variables commented in `.env.example` | Unverified |
| Payment provider | Placeholder only | Payment gateway variables commented in `.env.example` | Unverified |

### 4.2 Production VPS Inventory

| Field | Value |
| --- | --- |
| Server name | `prod-vps-01` |
| Role | Primary production application host |
| Provider | Unknown |
| Region | Unknown |
| OS | Unknown |
| Public/private hostname or safe identifier | Public hostname omitted here; production served through public domains listed below |
| Services hosted | Nginx Proxy Manager, `docduty-postgres`, `docduty-api`, `docduty-portal`, `docduty-marketing` |
| Reverse proxy | Nginx Proxy Manager (operator-reported), plus internal container Nginx for portal and marketing images |
| Runtime / process manager | Docker / Docker Compose |
| Deploy path(s) | Operator-reported `/opt/docduty-platform` |
| Backup status | Manual scripts exist; no verified scheduled production backup job found |
| Monitoring status | Health/readiness/metrics endpoints exist; no verified external monitoring stack found |
| Firewall / security notes | Not documented |
| Maintainer / owner | Founder / Ops role, not formally assigned |
| Last verified date | 2026-03-07 |

### 4.3 Domains / DNS / SSL

| Domain | Purpose | Environment | Target | DNS provider | SSL/TLS provider | Renewal method | Notes / issues |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `docduty.com.pk` | Public marketing site | Production | `docduty-marketing` via Nginx Proxy Manager | Unknown | Likely NPM-managed certificate, not verified | Likely automatic via NPM, not verified | Also expected to expose Flutter web under `/mobile/` |
| `portal.docduty.com.pk` | Doctor + facility web portal | Production | `docduty-portal` via Nginx Proxy Manager | Unknown | Likely NPM-managed certificate, not verified | Likely automatic via NPM, not verified | Canonical portal host in `runtimeHost.ts` |
| `admin.docduty.com.pk` | Platform-admin web surface | Production | `docduty-portal` via Nginx Proxy Manager | Unknown | Likely NPM-managed certificate, not verified | Likely automatic via NPM, not verified | Hostname-aware admin surface |
| `api.docduty.com.pk` | Backend API | Production | `docduty-api` via Nginx Proxy Manager | Unknown | Likely NPM-managed certificate, not verified | Likely automatic via NPM, not verified | Hardcoded in production build args |

### 4.4 Networking / Reverse Proxy / Routing

#### Public Routing Model

| Public host | Upstream | Notes |
| --- | --- | --- |
| `docduty.com.pk` | `docduty-marketing` | Serves marketing site and `/mobile/` Flutter web bundle |
| `portal.docduty.com.pk` | `docduty-portal` | SPA routing with optional `/api/` proxy in internal Nginx config |
| `admin.docduty.com.pk` | `docduty-portal` | Same image as portal, split by hostname in app runtime |
| `api.docduty.com.pk` | `docduty-api` | API should be routed directly by Nginx Proxy Manager |

#### Internal Container Routing

- `backend/ops/portal.nginx.conf`
  - serves SPA from `/usr/share/nginx/html`
  - proxies `/api/` to `http://docduty-api:3001`
- `backend/ops/marketing.nginx.conf`
  - serves website root
  - rewrites `/mobile/*` to Flutter web bundle
- `backend/ops/docker-compose.yml`
  - attaches API, portal, and marketing services to `nginx-proxy-manager_default`

#### Webhook / ingress points

- No inbound webhook endpoints were explicitly documented in the audited source.
- No CDN or edge worker behavior found.

### 4.5 Storage and Data Systems

| System | Purpose | Current implementation | Backup / retention | Status |
| --- | --- | --- | --- | --- |
| PostgreSQL | Primary relational data | `postgres:17-alpine`, DB name defaults to `docduty` | Manual `pg_dump` / `pg_restore` scripts; retention not documented | Production Critical |
| Upload filesystem | User-uploaded files | `UPLOADS_DIR`, default `backend/data/uploads` or `/app/data/uploads` in container | No retention or object-storage lifecycle found | Needs Cleanup |
| Backups | DB export artifacts | `backend/data/backups/postgres` | Manual only; no verified schedule | Needs Cleanup |
| Audit log table | Operational history | `audit_logs` in PostgreSQL | Retention not documented | Verified |
| Queues | Async processing | None; in-process intervals only | Not applicable | Verified |
| Cache | Short-lived analytics cache | In-memory in API process | Lost on restart | Verified |
| Search indexes | Database indexes only | PostgreSQL indexes, no standalone search service | Not applicable | Verified |
| Legacy data | Historical SQLite artifact | Legacy files remain in archive areas only | Should not be used at runtime | Legacy |

## 5. Deployments and Operations

### 5.1 Deployment Flows

#### Backend

Status: Partially Verified, inferred from current repo and operator-reported production deployment.

1. Pull the latest GitHub branch on the production VPS.
2. Update server-side environment configuration for `backend`.
3. Build or rebuild `docduty-api`.
4. Start the API container.
5. API startup runs migrations and DB readiness checks automatically.
6. Verify:
   - `GET /api/health`
   - `GET /api/readiness`
   - critical authenticated endpoints

#### Web app

1. Build `docduty-portal` using `backend/ops/Dockerfile.portal`.
2. Production build injects `VITE_API_URL=https://api.docduty.com.pk/api`.
3. Deploy behind Nginx Proxy Manager on:
   - `portal.docduty.com.pk`
   - `admin.docduty.com.pk`
4. Verify doctor/facility/admin route splits by hostname.

#### Website

1. Build `docduty-marketing` using `backend/ops/Dockerfile.marketing`.
2. The same image also builds Flutter web from `mobile-app`.
3. Deploy behind Nginx Proxy Manager on `docduty.com.pk`.
4. Verify:
   - homepage
   - public pages
   - `/mobile/`

#### Mobile app

1. Native mobile deployment is manual via Flutter tooling.
2. Web build is embedded into the marketing container.
3. Store release process is not documented.

#### Workers / jobs

- There is no separate worker service.
- Background jobs start inside the API process when `START_BACKGROUND_JOBS` is true.
- This is acceptable for a single API instance but unsafe for multi-replica deployment.

#### VPS-managed services

- `docduty-postgres`
- `docduty-api`
- `docduty-portal`
- `docduty-marketing`
- Nginx Proxy Manager (operator-managed, external to repo)

### 5.2 CI/CD

| Item | Current state | Status |
| --- | --- | --- |
| Pipeline definition | `backend/ops/.github/workflows/quality-gates.yml` | Partially Verified |
| Triggers | `push`, `pull_request` | Verified |
| CI database | PostgreSQL service container | Verified |
| CI steps | `npm ci`, Playwright install, `npm run ci`, artifact upload, `npm audit` informational | Verified in file |
| Secrets source references | No formal GitHub Secrets reference documented beyond inline CI env | Needs Cleanup |
| Rollback support | Not defined in CI | Needs Cleanup |
| Manual steps | Deployment is still manual / operator-driven | Verified |
| Failure points | Workflow path is no longer repo-root standard, and commands assume a root package layout that no longer exists | Production Risk |

#### CI/CD Assessment

- The current workflow is likely not active in GitHub Actions because it is not stored under the repo-root `.github/workflows/`.
- Even if moved back to the correct location, it still assumes the old root package layout.
- CI must be normalized to run from `backend/` or restored to a consistent monorepo orchestration model.

### 5.3 Runbooks

#### Start / restart services

Canonical production sequence, inferred:

```powershell
docker compose -f backend/ops/docker-compose.yml up -d --build
```

Targeted restarts:

```powershell
docker compose -f backend/ops/docker-compose.yml restart docduty-api
docker compose -f backend/ops/docker-compose.yml restart docduty-portal
docker compose -f backend/ops/docker-compose.yml restart docduty-marketing
docker compose -f backend/ops/docker-compose.yml restart docduty-postgres
```

#### Deploy

1. Pull latest Git commit.
2. Review `backend/.env` or equivalent production env injection.
3. Rebuild affected services.
4. Restart services.
5. Verify health/readiness and public domains.

#### Rollback

Current rollback model is manual.

Recommended current rollback sequence:

1. Check out previous known-good Git commit.
2. Rebuild and restart affected Docker services.
3. Restore PostgreSQL only if schema or data rollback is required and a verified backup exists.

#### Rotate env / config safely

1. Update secret in secure storage system.
2. Update server-side env injection, not source-controlled files.
3. Restart only affected services.
4. Re-verify `/api/readiness`, login, and critical flows.

#### Inspect logs

Container logs:

```powershell
docker compose -f backend/ops/docker-compose.yml logs -f docduty-api
docker compose -f backend/ops/docker-compose.yml logs -f docduty-portal
docker compose -f backend/ops/docker-compose.yml logs -f docduty-marketing
docker compose -f backend/ops/docker-compose.yml logs -f docduty-postgres
```

Historical local logs are present under `backend/archive/codex-logs/` and are not canonical production logs.

#### Restart workers

- Restart the API container. Jobs are embedded in the API process.

#### Handle failed jobs

- Inspect API logs for:
  - `[NoShow Detection Error]`
  - `[Shift Expiry Error]`
  - `[AutoComplete Error]`
- Correct underlying policy/data issue.
- Restart API if the loop is wedged.

#### Verify production health

Minimum checks:

1. `GET /api/health`
2. `GET /api/readiness`
3. Public website home page
4. Portal login page
5. Admin login page
6. Representative authenticated route for each role

### 5.4 Monitoring / Logging / Alerts

| Capability | Current state | Status |
| --- | --- | --- |
| Application logs | Structured JSON request logs to stdout | Verified |
| Health checks | `/api/health`, `/api/readiness` | Verified |
| Metrics | `/api/metrics` plaintext endpoint | Verified |
| Audit trail | `audit_logs` table and admin audit views | Verified |
| Dashboards | Internal admin analytics only | Verified |
| Uptime checks | None found | Needs Cleanup |
| APM | None found | Needs Cleanup |
| Error reporting | None found | Needs Cleanup |
| Alert ownership | Not documented | Needs Cleanup |
| Product analytics | None found for website, portal, or mobile | Needs Cleanup |

## 6. Configuration and Secrets Reference

### 6.1 Environment Variable Inventory

No raw secret values are included below.

| Name | Used by | Environment(s) | Purpose | Required | Safe example format | Source-of-truth location reference | Owner | Verification status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `PORT` | Backend API | local, production | API listen port | Yes | `3001` | `backend/.env.example`, `backend/server/config.ts` | Backend owner unassigned | Verified |
| `NODE_ENV` | Backend API | local, CI, production | runtime mode | Yes | `development` / `test` / `production` | `backend/.env.example`, `backend/server/config.ts` | Backend owner unassigned | Verified |
| `FRONTEND_ORIGIN` | Backend API CORS | local, production | allowed frontend origin list | Yes | `http://localhost:3000,https://portal.example.com` | `backend/.env.example`, `backend/server/config.ts` | Backend owner unassigned | Verified |
| `START_BACKGROUND_JOBS` | Backend API | local, production, CI | enable inline jobs | Yes | `true` / `false` | `backend/.env.example`, `backend/server/config.ts` | Backend owner unassigned | Verified |
| `PUBLIC_API_URL` | Backend/API-adjacent config | local, production | public API reference for consumers | Optional | `https://api.example.com/api` | `backend/.env.example`, `backend/server/config.ts` | Backend owner unassigned | Verified |
| `UPLOADS_DIR` | Backend API | local, production | upload storage path | Yes | `data/uploads` | `backend/.env.example`, `backend/server/config.ts` | Backend owner unassigned | Verified |
| `JWT_SECRET` | Backend auth | local, CI, production | access-token signing secret | Yes | `<managed-secret>` | `backend/.env.example`, `backend/server/config.ts` | Secrets custodian unassigned | Verified |
| `JWT_REFRESH_SECRET` | Backend auth | local, CI, production | refresh-token signing secret | Yes | `<managed-secret>` | `backend/.env.example`, `backend/server/config.ts` | Secrets custodian unassigned | Verified |
| `DATABASE_URL` | Backend runtime | local, CI, production | primary PostgreSQL connection string | Yes | `postgresql://user:<password>@host:5432/dbname` | `backend/.env.example`, `backend/server/config.ts` | DB owner unassigned | Verified |
| `MIGRATION_DATABASE_URL` | Backend migrations | local, CI, production | migration connection string | Yes | `postgresql://user:<password>@host:5432/dbname` | `backend/.env.example`, `backend/server/config.ts` | DB owner unassigned | Verified |
| `TEST_DATABASE_URL` | Tests | local, CI | disposable Postgres DB | Yes for integration/e2e | `postgresql://user:<password>@host:5432/dbname_test` | `backend/.env.example`, `backend/server/config.ts` | DB owner unassigned | Verified |
| `DATABASE_SSL_MODE` | Backend PG client | local, production | Postgres SSL mode | Yes | `disable` / `require` / `no-verify` | `backend/.env.example`, `backend/server/config.ts` | DB owner unassigned | Verified |
| `DATABASE_POOL_MAX` | Backend PG client | local, production | pool size | Yes | `10` | `backend/.env.example`, `backend/server/config.ts` | DB owner unassigned | Verified |
| `DATABASE_IDLE_TIMEOUT_MS` | Backend PG client | local, production | pool idle timeout | Yes | `30000` | `backend/.env.example`, `backend/server/config.ts` | DB owner unassigned | Verified |
| `DATABASE_CONNECTION_TIMEOUT_MS` | Backend PG client | local, production | connect timeout | Yes | `5000` | `backend/.env.example`, `backend/server/config.ts` | DB owner unassigned | Verified |
| `DATABASE_STATEMENT_TIMEOUT_MS` | Backend PG client | local, production | server-side statement timeout | Yes | `15000` | `backend/.env.example`, `backend/server/config.ts` | DB owner unassigned | Verified |
| `DATABASE_QUERY_TIMEOUT_MS` | Backend PG client | local, production | client query timeout | Yes | `15000` | `backend/.env.example`, `backend/server/config.ts` | DB owner unassigned | Verified |
| `DATABASE_IDLE_TRANSACTION_TIMEOUT_MS` | Backend PG client | local, production | idle-in-transaction limit | Yes | `15000` | `backend/.env.example`, `backend/server/config.ts` | DB owner unassigned | Verified |
| `DATABASE_RETRY_MAX_ATTEMPTS` | Backend bootstrap | local, production | init retry count | Yes | `8` | `backend/.env.example`, `backend/server/config.ts` | Backend owner unassigned | Verified |
| `DATABASE_RETRY_BACKOFF_MS` | Backend bootstrap | local, production | init backoff | Yes | `1500` | `backend/.env.example`, `backend/server/config.ts` | Backend owner unassigned | Verified |
| `DATABASE_APPLICATION_NAME` | Backend PostgreSQL | local, production | PG application name | Yes | `docduty-api` | `backend/.env.example`, `backend/server/config.ts` | Backend owner unassigned | Verified |
| `SEED_REFERENCE_DATA` | Backend bootstrap | local, test, CI | reference seed toggle | Yes | `true` | `backend/.env.example`, `backend/server/config.ts` | Backend owner unassigned | Verified |
| `SEED_DEMO_DATA` | Backend bootstrap | local, test, CI | demo-data seed toggle | Yes | `true` / `false` | `backend/.env.example`, `backend/server/config.ts` | Backend owner unassigned | Verified |
| `RATE_LIMIT_WINDOW_MS` | Backend | local, production | rate-limit window | Yes | `900000` | `backend/.env.example`, `backend/server/config.ts` | Backend owner unassigned | Verified |
| `RATE_LIMIT_MAX_REQUESTS` | Backend | local, production | rate-limit ceiling | Yes | `100` | `backend/.env.example`, `backend/server/config.ts` | Backend owner unassigned | Verified |
| `POSTGRES_DB` | Compose Postgres | local, production | container DB name | Yes for Compose | `docduty` | `backend/.env.example`, `backend/ops/docker-compose.yml` | DB owner unassigned | Verified |
| `POSTGRES_USER` | Compose Postgres | local, production | container DB user | Yes for Compose | `docduty` | `backend/.env.example`, `backend/ops/docker-compose.yml` | DB owner unassigned | Verified |
| `POSTGRES_PASSWORD` | Compose Postgres | local, production | container DB password | Yes for Compose | `<managed-secret>` | `backend/.env.example`, `backend/ops/docker-compose.yml` | Secrets custodian unassigned | Verified |
| `VITE_API_URL` | Portal web app | local, production build | API base URL | Yes | `https://api.example.com/api` | `backend/.env.example`, `web-app/src/lib/api.ts`, `backend/ops/Dockerfile.portal` | Web owner unassigned | Verified |
| `VITE_ENABLE_REALTIME` | Portal web app | local, production build | enable websocket client | Yes | `true` / `false` | `backend/.env.example`, `web-app/src/lib/realtime.ts` | Web owner unassigned | Verified |
| `VITE_SOKETI_HOST` | Portal web app | local, production build | websocket host | Optional | `localhost` | `backend/.env.example`, `web-app/src/lib/realtime.ts` | Web owner unassigned | Verified |
| `VITE_SOKETI_PORT` | Portal web app | local, production build | websocket port | Optional | `6001` | `backend/.env.example`, `web-app/src/lib/realtime.ts` | Web owner unassigned | Verified |
| `VITE_SOKETI_APP_KEY` | Portal web app | local, production build | websocket app key | Required if realtime enabled | `<public-app-key>` | `backend/.env.example`, `web-app/src/lib/realtime.ts` | Realtime owner unassigned | Verified |
| `SOKETI_HOST` | Backend realtime trigger utility | local, production | server-side websocket host | Required if realtime enabled | `127.0.0.1` | `backend/server/utils/pusher.ts` | Realtime owner unassigned | Verified |
| `SOKETI_PORT` | Backend realtime trigger utility | local, production | server-side websocket port | Required if realtime enabled | `6001` | `backend/server/utils/pusher.ts` | Realtime owner unassigned | Verified |
| `SOKETI_APP_ID` | Backend realtime trigger utility | local, production | server-side app id | Required if realtime enabled | `<app-id>` | `backend/server/utils/pusher.ts` | Realtime owner unassigned | Verified |
| `SOKETI_APP_KEY` | Backend realtime trigger utility | local, production | server-side app key | Required if realtime enabled | `<public-app-key>` | `backend/server/utils/pusher.ts` | Realtime owner unassigned | Verified |
| `SOKETI_APP_SECRET` | Backend realtime trigger utility | local, production | server-side app secret | Required if realtime enabled | `<managed-secret>` | `backend/server/utils/pusher.ts` | Realtime owner unassigned | Verified |
| `API_BASE_URL` | Mobile app | local, production build | mobile API base URL | Yes | `https://api.example.com/api` | `mobile-app/lib/core/config/env.dart` | Mobile owner unassigned | Verified |
| `ENABLE_REALTIME` | Mobile app | local, production build | mobile realtime feature flag | Optional | `true` / `false` | `mobile-app/lib/core/config/env.dart` | Mobile owner unassigned | Verified |
| `SOKETI_HOST` | Mobile app | local, production build | mobile realtime host | Optional | `localhost` | `mobile-app/lib/core/config/env.dart` | Mobile owner unassigned | Verified |
| `SOKETI_PORT` | Mobile app | local, production build | mobile realtime port | Optional | `6001` | `mobile-app/lib/core/config/env.dart` | Mobile owner unassigned | Verified |
| `SOKETI_APP_KEY` | Mobile app | local, production build | mobile realtime app key | Optional | `<public-app-key>` | `mobile-app/lib/core/config/env.dart` | Mobile owner unassigned | Verified |
| `GOOGLE_MAPS_API_KEY` | Mobile app | local, production build | map SDK key | Optional but required for maps | `<managed-key>` | `mobile-app/lib/core/config/env.dart` | Mobile owner unassigned | Verified |
| `DEBUG_LOGGING` | Mobile app | local, development | verbose API logs | Optional | `true` / `false` | `mobile-app/lib/core/config/env.dart` | Mobile owner unassigned | Verified |
| `GEMINI_API_KEY` | Reserved backend integration | local, production | future AI service configuration | Optional / inactive | `<managed-secret>` | `backend/.env.example` | AI owner unassigned | Partially Verified |
| `APP_URL` | Reserved integration | local, production | public app URL reference | Optional | `https://portal.example.com` | `backend/.env.example` | Backend owner unassigned | Partially Verified |

### 6.2 Secrets Reference Index

No secret values are reproduced here.

| Secret identifier / name | System / service | Purpose | Environment | Owner | Secure storage system | Rotation status | Last verified date | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `JWT_SECRET` | Backend API | Access-token signing | local, CI, production | Secrets custodian unassigned | Should be secret manager or server-only env injection | Needs formal rotation policy | 2026-03-07 | Plaintext dev value exists in tracked `backend/.env` |
| `JWT_REFRESH_SECRET` | Backend API | Refresh-token signing | local, CI, production | Secrets custodian unassigned | Should be secret manager or server-only env injection | Needs formal rotation policy | 2026-03-07 | Plaintext dev value exists in tracked `backend/.env` |
| `DATABASE_URL` / `MIGRATION_DATABASE_URL` / `TEST_DATABASE_URL` | PostgreSQL | DB connectivity | local, CI, production | DB owner unassigned | Should be secret manager or server-only env injection | Needs formal rotation policy | 2026-03-07 | Local plaintext values exist in tracked `backend/.env` |
| `POSTGRES_PASSWORD` | Dockerized PostgreSQL | Postgres auth | local, production | DB owner unassigned | Should be secret manager or server-only env injection | Needs formal rotation policy | 2026-03-07 | Default example value remains in `.env.example` |
| `SOKETI_APP_SECRET` | Realtime infrastructure | Server-side event trigger secret | local, production | Realtime owner unassigned | Should be secret manager or server-only env injection | Not documented | 2026-03-07 | Realtime is optional; no production provisioning evidence found |
| `GOOGLE_MAPS_API_KEY` | Mobile app | Maps SDK access | mobile builds | Mobile owner unassigned | Mobile build secret store / CI secret | Not documented | 2026-03-07 | Key placeholder only; no verified production key management found |
| Nginx Proxy Manager admin credentials | Production ingress | Proxy / SSL admin console | production | Infra owner unassigned | Should be password manager or vault | Review required | 2026-03-07 | Operator-reported credentials exist outside repo; do not store in SSOT |
| GitHub Actions environment secrets | CI/CD | Build/test/deploy secrets | CI | Release owner unassigned | GitHub Actions Secrets or equivalent | Unverified | 2026-03-07 | No current documented inventory |

### 6.3 SSH / Server Access Reference

No private keys or raw secret material are included.

| System | Access type | Owner | Public key fingerprint | Managed in | Review / rotation status | Least-privilege concerns | Recommended hardening |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `prod-vps-01` | Key-based SSH, operator-reported passwordless access | Founder / Ops role, not formally assigned | Unknown | Local maintainer workstation secure key store, exact location intentionally omitted | Unverified | Shared or undocumented key custody is likely | Move to per-user SSH keys, document fingerprints, add access review cadence |
| Nginx Proxy Manager host | Likely same VPS SSH domain | Founder / Ops role, not formally assigned | Unknown | Same as above | Unverified | Access model not documented | Separate ops access inventory from application creds |

## 7. Third-Party Services and Integrations

| Service | Purpose | Linked systems | Owner | Environment(s) | Dependency criticality | Config reference | Billing / plan notes | Failure impact | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PostgreSQL | Primary relational database | Backend API, local dev, tests, production runtime | DB owner unassigned | local, CI, production | Production Critical | `backend/server/config.ts`, `backend/ops/docker-compose.yml` | Self-hosted in current known setups | API becomes unavailable or degraded | Verified |
| Docker / Docker Compose | Local and VPS service orchestration | Backend, portal, marketing, PostgreSQL | Infra owner unassigned | local, production | Production Critical | `backend/ops/docker-compose.yml` | Self-managed | Deployments and service recovery become manual | Verified |
| Nginx Proxy Manager | Public reverse proxy, TLS termination, domain routing | VPS ingress for marketing, portal, admin, API | Infra owner unassigned | production | Production Critical | Operator-reported; not configured from repo | Self-managed | Public domains and SSL routing fail | Partially Verified |
| Nginx (container) | Static serving and API proxy within app containers | Portal SPA, website, Flutter web bundle | Web owner unassigned | local, production | High | `backend/ops/portal.nginx.conf`, `backend/ops/marketing.nginx.conf` | Bundled with images | Frontend routing and API forwarding fail | Verified |
| Soketi / Pusher protocol | Optional realtime transport for notifications/events | Backend API, portal web app, mobile app | Realtime owner unassigned | local, production | Medium | `backend/server/utils/pusher.ts`, `web-app/src/lib/realtime.ts`, `mobile-app/lib/core/config/env.dart` | Unverified | Realtime updates stop; polling fallback may mask issues | Partially Verified |
| Google Maps Platform | Map rendering and geolocation features in mobile app | Mobile app | Mobile owner unassigned | local, production mobile builds | Medium | `mobile-app/lib/core/config/env.dart` | Unknown | Map-dependent screens fail or degrade | Verified |
| GitHub | Source control and possible CI host | Whole project | Release owner unassigned | all | Production Critical | `.git`, operator-reported repository usage | Unknown | Change history, collaboration, and potential deployment automation are impacted | Verified |
| GitHub Actions | Automated quality gates and deploy potential | Backend tests/builds | Release owner unassigned | CI | Medium | `backend/ops/.github/workflows/quality-gates.yml` | Unknown | Current pipeline does not reliably protect production changes | Partially Verified |
| Laragon | Local Windows service stack including PostgreSQL | Backend local development | Local developer workstation | local | Low | Operator-reported local setup | Local only | Local development blocked if replaced without docs | Partially Verified |
| `@google/genai` / Gemini placeholder | Future AI integration | Backend | AI owner unassigned | local, production | Low | `backend/package.json`, `backend/.env.example` | Unknown | No current user-facing impact because integration is inactive | Partially Verified |

## 8. Product Feature/System Mapping

| Product feature | Backend services | Mobile app components | Web app components | Website components | Third-party dependencies | Data dependencies | Status / notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Authentication and session lifecycle | `server/routes/auth.ts`, JWT helpers in `server/utils/auth.ts`, user model access in `server/database/schema.ts` | `lib/core/services/auth_service.dart`, route middleware in `lib/shared/routes/middleware.dart` | login flows, role routing in `web-app/src/App.tsx` and `web-app/src/lib/runtimeHost.ts` | CTA links only; website does not authenticate directly | PostgreSQL, optional realtime for session-related notifications | `users`, refresh/session token state in DB | Verified for backend and web; mobile role mapping needs cleanup |
| Shift marketplace | `server/routes/shifts.ts`, settlement helpers, notifications | `shift_service.dart`, shift list/detail screens | doctor/facility shift pages under `web-app/src/pages` | doctor/facility marketing pages link into portal | PostgreSQL | `shifts`, `bookings`, `notifications`, `audit_logs` | Partially Verified because mobile endpoint contract drifts from backend |
| Booking lifecycle | `server/routes/bookings.ts`, `server/utils/backgroundJobs.ts` | booking flows via shift/facility/admin services | portal booking management screens | none | PostgreSQL | `bookings`, `attendance_events`, `wallet_ledger` | Backend/web verified; background job execution model is fragile |
| Attendance verification | `server/routes/attendance.ts` | facility/admin workflows through service layer | attendance dashboards and shift detail pages | none | PostgreSQL, optional maps/geofence concepts | `attendance_events`, `bookings`, `shifts` | Partially Verified; mobile behavior not fully revalidated after backend migration |
| Wallets, escrow, settlements, payouts | `server/routes/wallets.ts`, `server/utils/settlement.ts`, `server/routes/admin.ts` | `admin_service.dart`, wallet-related screens | facility/admin wallet and payout views | marketing claims only | PostgreSQL | `wallet_ledger`, `payout_requests`, `audit_logs` | Partially Verified; some mobile admin endpoints no longer match backend |
| Disputes and issue handling | `server/routes/disputes.ts` | dispute-related service calls where implemented | portal/admin dispute screens | trust and safety content only | PostgreSQL | `disputes`, `messages`, `notifications`, `audit_logs` | Verified in backend/web; mobile depth unverified |
| Messaging | `server/routes/messages.ts` | mobile chat/service usage if enabled | web messaging views | none | PostgreSQL, optional realtime | `messages`, `notifications` | Partially Verified; realtime provisioning unverified |
| Notifications | `server/routes/notifications.ts`, realtime trigger utility | `notification_service` patterns via API client and app shell | notification pages in doctor/admin/facility portal | none | Optional Soketi | `notifications` | Verified with polling fallback in web; mobile realtime unverified |
| Admin governance and policy controls | `server/routes/admin.ts` | `admin_service.dart`, admin routing | admin-only portal shell via `admin.docduty.com.pk` | none | PostgreSQL | verification, payout, policy, metrics, audit tables | Partially Verified; mobile uses `admin` alias instead of canonical `platform_admin` in places |
| Public marketing and lead/contact flow | `/api/contact` in backend | none | none | `website/src/pages/ContactPage.tsx`, marketing pages | Nginx static hosting | currently no confirmed persistent CRM/store | Needs Cleanup: website form UI exists but backend integration is not wired |

## 9. Ownership and Access

| Responsibility area | Current owner | Status | Notes |
| --- | --- | --- | --- |
| Technical architecture | Founder-led / not formally assigned | Unverified | No durable owner mapping found in repo |
| Backend service ownership | Unassigned | Needs Cleanup | Code exists but no named maintainer record |
| Web app ownership | Unassigned | Needs Cleanup | Portal/admin frontend lacks explicit owner |
| Website ownership | Unassigned | Needs Cleanup | Marketing site has no named operator or content owner |
| Mobile app ownership | Unassigned | Needs Cleanup | Release and contract maintenance ownership not documented |
| Infrastructure / VPS ownership | Founder-led / not formally assigned | Partially Verified | VPS and Nginx Proxy Manager access appear centralized informally |
| Release management | Unassigned | Needs Cleanup | No explicit release owner, gatekeeper, or change calendar |
| Secrets / credentials custody | Unassigned | Critical Gap | Must be formalized immediately |
| Incident response / escalation | Unassigned | Critical Gap | No on-call or escalation path documented |

**Bus-factor assessment**

- Current bus factor appears to be 1 for infrastructure access, deployment knowledge, and domain operations.
- Production-critical access knowledge is concentrated in operator memory and local workstations rather than a documented operating model.
- This is a Production Critical governance risk even if the software itself is functional.

## 10. Known Issues, Risks, and Technical Debt

| Description | Severity | Affected systems | Recommended action | Confidence level |
| --- | --- | --- | --- | --- |
| Plaintext local secrets are tracked in `backend/.env` | Critical | backend, local development, potentially CI hygiene | Remove from version control, rotate affected secrets, replace with secure `.env.local` and documented secret injection | Verified |
| CI workflow is stored under `backend/ops/.github/workflows` and appears disconnected from the active repo root; commands also assume outdated root layout | High | CI/CD, release quality gates | Move or recreate workflow in repo-root `.github/workflows`, validate branch protections against it | Verified |
| Background jobs run inline inside the API process via `setInterval`, creating coupling between web traffic and scheduled processing | High | backend, production reliability | Split into dedicated worker or scheduled job service before scaling | Verified |
| Production infrastructure facts are partly operator-reported rather than fully source-controlled | High | VPS, domains, reverse proxy, SSL, deploy ops | Export and document Nginx Proxy Manager config, inventory server details, record deploy paths and recovery steps | Partially Verified |
| Website contact form UI is not connected to the backend `POST /api/contact` route | High | website, lead capture | Wire form submission, success/failure states, spam control, and storage/notification path | Verified |
| Mobile app still contains route-role drift (`admin` vs `platform_admin`) and endpoint contract mismatches against the current backend | High | mobile app, admin workflows, facility workflows | Align mobile role model and service endpoints with backend contracts, then run end-to-end validation | Verified |
| No external monitoring, uptime checks, APM, or alert routing are documented | High | production operations | Add uptime monitoring, structured alert ownership, and at least basic error aggregation | Verified |
| Uploads rely on local filesystem storage only | Medium | backend, production data handling | Define persistent volume strategy, retention, and backup for uploads; consider object storage if growth is expected | Verified |
| Backup execution and restore testing are not evidenced for production PostgreSQL | High | database, disaster recovery | Implement scheduled encrypted backups and documented restore drills | Partially Verified |
| Multiple legacy docs and archive notes remain in `backend/docs` and the previous SSOT history, creating ambiguity for new operators | Medium | documentation, onboarding | Mark historical docs explicitly and keep only this SSOT as canonical | Verified |
| Website package metadata still uses generic labels such as `vite_react_shadcn_ts` | Low | website, developer experience | Rename package and title metadata to DocDuty-specific identifiers | Verified |
| Marketing container bundles website and Flutter web output together, increasing coupling between two distinct release surfaces | Medium | website, mobile web distribution, deployment | Keep only if intentional; otherwise separate static delivery or document the rationale clearly | Verified |
| Realtime provisioning is optional and not fully documented; fallback behavior may hide outages | Medium | backend, web app, mobile app | Decide whether realtime is production scope, then either formalize provisioning or remove inactive integration paths | Partially Verified |

## 11. Gaps / Unknowns / Requires Verification

| Item | Why uncertain | Likely source to verify | Impact if wrong | Priority |
| --- | --- | --- | --- | --- |
| VPS provider, region, and operating system | Not encoded in repo; only operator statements exist | VPS console/provider panel, server inventory notes | Recovery and compliance planning are impaired | High |
| DNS provider for `docduty.com.pk` and subdomains | No source-controlled DNS inventory found | Domain registrar or DNS control panel | Domain changes and incident response become slow and risky | High |
| SSL certificate issuer and renewal method | TLS handled by Nginx Proxy Manager outside repo | Nginx Proxy Manager admin console | Silent certificate expiry risk | High |
| Exact production deploy path and release command sequence | Not fully documented in codebase | VPS shell history, deployment scripts, operator notes | Rollbacks and rebuilds are brittle | High |
| Production secret storage system of record | No canonical secret manager documentation found | Founder / ops process, GitHub settings, server env management | Secret rotation and access review are blocked | Critical |
| Firewall rules and inbound port exposure | No server hardening documentation in repo | VPS firewall config, OS firewall, cloud security group | Unknown exposure risk | High |
| Backup schedule, retention, and last successful restore test | Scripts exist, operational evidence absent | Cron/systemd timers, ops notes, backup storage | Disaster recovery confidence is low | Critical |
| Monitoring and alert ownership | No dashboards or alert routes found | Monitoring tools, team process | Incidents may go undetected or unowned | High |
| Nginx Proxy Manager configuration export and owner | Repo does not contain exported config | NPM admin console | Reverse proxy becomes a hidden single point of failure | High |
| Whether active GitHub Actions workflows exist remotely outside current workspace layout | Local repo layout suggests workflow drift | GitHub repository Actions tab | False confidence in CI protection | Medium |
| Native mobile release status for Android/iOS | Mobile source exists, release process is undocumented | Store consoles, release notes, mobile maintainer | Roadmap and support commitments may be misstated | Medium |
| Whether Soketi is actually provisioned in production | Only code references and env placeholders found | Production env, Docker stack, VPS process list | Realtime assumptions may be wrong | Medium |
| Owner assignments for backend, web, mobile, infra, and secrets | No explicit ownership file found | Team operating model, founder assignment | High bus-factor and escalation ambiguity persist | Critical |

## 12. Recommended Cleanup Actions

### Urgent security / ops fixes

1. Remove tracked plaintext env files from version control, rotate JWT and database credentials, and re-establish secure secret handling.
2. Formalize production access ownership: infra owner, release owner, secrets custodian, and incident escalation contact.
3. Verify and document VPS facts, DNS provider, SSL renewal, firewall rules, deploy paths, and backup status directly from the production environment.
4. Repair CI/CD so every protected branch runs the current backend/web quality gates from the correct workspace layout.
5. Add scheduled PostgreSQL backups with retention, off-host storage, and a documented restore drill.

### SSOT documentation fixes

1. Treat this SSOT as canonical and mark older audit/due-diligence documents as historical references only.
2. Create a small companion runbook index inside `backend/docs` that points back to this SSOT rather than duplicating it.
3. Maintain a dated verification log for production facts that are currently operator-reported.

### Infrastructure cleanup

1. Export or recreate Nginx Proxy Manager configuration as code or at minimum as an audited inventory artifact.
2. Decide whether realtime is in production scope; either provision/document Soketi fully or remove dormant integration complexity.
3. Separate inline scheduled jobs from the API process into a dedicated worker or scheduler service before traffic grows.
4. Define persistent storage strategy for uploads and database backups.

### Naming cleanup

1. Standardize the canonical surface names used throughout docs and code:
   - `website` for marketing site
   - `web-app` for portal/admin
   - `backend` for API/services
   - `mobile-app` for Flutter client
2. Standardize role naming on `platform_admin` across backend, web, and mobile.
3. Rename generic website package/application metadata to DocDuty-specific labels.

### Deployment cleanup

1. Move all active deployment automation to source-controlled locations aligned with the actual repo root.
2. Document one release flow per surface: backend, web app, website, and mobile.
3. Introduce immutable release tags or versions so rollback is deterministic.

### Ownership cleanup

1. Assign technical owner, product owner, infra owner, release owner, and secrets custodian roles.
2. Record approved operators for production SSH, Nginx Proxy Manager, domain control, and GitHub admin access.
3. Create a lightweight escalation matrix for incidents and failed releases.

### Access hardening improvements

1. Replace any shared SSH access pattern with named per-user keys and documented fingerprints.
2. Store infrastructure and CI secrets in a dedicated secret manager or at minimum GitHub/VPS secret injection, not tracked files.
3. Review least-privilege boundaries for database runtime, migrations, and admin tooling.

## 13. Canonical Quick Reference

### Critical repos / folders

| Surface | Path | Notes |
| --- | --- | --- |
| Backend | `C:\Users\Admin\Desktop\DocDuty\backend` | API, DB migrations, tests, ops assets |
| Web app | `C:\Users\Admin\Desktop\DocDuty\web-app` | Doctor/facility/admin portal |
| Website | `C:\Users\Admin\Desktop\DocDuty\website` | Marketing site |
| Mobile app | `C:\Users\Admin\Desktop\DocDuty\mobile-app` | Flutter app |
| Canonical SSOT | `C:\Users\Admin\Desktop\DocDuty\DocDuty_Single_Source_of_Truth.md` | Primary operating document |

### Critical services

| Service | Local / runtime identifier | Purpose |
| --- | --- | --- |
| PostgreSQL | `docduty-postgres` | Primary database |
| API | `docduty-api` | Backend application and inline jobs |
| Portal | `docduty-portal` | Doctor/facility/admin web surface |
| Marketing | `docduty-marketing` | Marketing site plus Flutter web bundle |

### Canonical local endpoints

| Surface | Local URL | Notes |
| --- | --- | --- |
| Portal web app | `http://127.0.0.1:3000` | Local login/register should stay on local host, not production domains |
| Backend API | `http://127.0.0.1:3001/api` | CORS/local routing verified for both `localhost` and `127.0.0.1` |
| Marketing website | `http://127.0.0.1:3002` | Marketing login/register CTAs route into the local portal web app |
| Mobile web build | `http://127.0.0.1:3003` | Flutter web runtime verified after local web compatibility fixes |

### Production entry points

| Domain | Purpose | Current target understanding |
| --- | --- | --- |
| `docduty.com.pk` | Marketing website | Nginx Proxy Manager -> `docduty-marketing` |
| `portal.docduty.com.pk` | Doctor and facility portal | Nginx Proxy Manager -> `docduty-portal` |
| `admin.docduty.com.pk` | Admin portal entry | Same portal build with host-based admin routing |
| `api.docduty.com.pk` | Public API | Nginx Proxy Manager -> `docduty-api` |

### Deployment process summary

- Local backend quality gates: from `backend`, run `npm run lint`, `npm run build`, `npm run test:unit`, `npm run test:integration`, `npm run test:e2e`.
- Local services: use `backend/ops/docker-compose.yml`.
- Production deployment is inferred to be Docker Compose based on the VPS with Nginx Proxy Manager fronting the containers.
- Exact production deploy command sequence still requires verification and should be documented after direct VPS review.

### Log / process summary

| Area | Current log/process path |
| --- | --- |
| Dockerized services | `docker compose logs <service>` on the VPS or local Docker host |
| API runtime | Container logs for `docduty-api` |
| Portal static serving | Container logs for `docduty-portal` |
| Marketing static serving | Container logs for `docduty-marketing` |
| Health checks | `/api/health`, `/api/readiness`, `/api/metrics` |

### Monitoring placeholders

- Uptime dashboard: Not configured or not documented
- Error tracking dashboard: Not configured or not documented
- APM traces: Not configured or not documented
- Backup monitoring: Not configured or not documented

### Ownership summary

- Technical owner: Unassigned
- Infra owner: Unassigned
- Release owner: Unassigned
- Secrets custodian: Unassigned
- Escalation path: Undocumented

### Top 5 operational cautions

1. Do not rely on tracked `.env` files for any persistent or production credential handling.
2. Do not assume CI is protecting the main branch until workflow placement and execution are re-verified.
3. Do not treat the mobile app as fully production-ready until its role and endpoint contracts are aligned with the backend.
4. Do not assume backups, SSL renewal, or firewall posture are healthy until directly verified from the production environment.
5. Do not duplicate operational facts across ad hoc docs; update this SSOT and mark older notes as historical.
