# DocDuty Workspace-to-Mobile Reuse Assessment

## 1. Executive Summary

DocDuty is a real multi-role healthcare staffing and operations platform, not just a marketing site. The non-mobile workspace shows a Pakistan-focused doctor duty replacement and locum marketplace with three operational surfaces: doctor, facility admin, and platform admin. Its implemented business model includes shift posting, dispatch and booking, geofence plus QR attendance proof, escrow-style settlement, payout requests, disputes, ratings, notifications, messaging, and admin policy control.

The `DocDuty Mobile App` folder is not the source of truth for the product. After separately analyzing it only after the main workspace, it is best classified as a Flutter appointment-style UI kit or demo starter. It has broad visual coverage, but it is not integrated with DocDuty's domain or backend. It uses GetX routing, a small Provider-based theme toggle, static arrays, placeholder navigation, and no real networking or repository layer. It looks usable as a visual asset base, but not as an application foundation.

The Flutter UI kit is reusable, but only in a controlled way. It should be reused as a design-system accelerator, screen-shell source, and component library for shared mobile UI patterns. It should not be adopted as-is for business logic, role modeling, or product workflows. The best professional path is phased reuse aligned to all-role mobile scope: preserve and extract the strongest visual assets, then rebuild the application layer around DocDuty's real auth, data contracts, workflows, and role separation.

Final determination: yes, the Flutter UI kit can save meaningful time, but only if the team treats it as a reusable presentation layer and deliberately maps it onto the actual platform. Blind adoption would create domain confusion and technical debt. Full redesign from scratch is unnecessary because the kit contains enough reusable visual and interaction patterns to justify adaptation.

## 2. Analysis Scope and Method

This assessment was performed in two stages on purpose.

Stage 1 analyzed the full workspace while intentionally excluding `DocDuty Mobile App`. That phase focused on the business, architecture, service boundaries, schema, route surfaces, workflows, and implementation maturity of the main DocDuty platform. This order was necessary because the mobile folder is not authoritative for product logic, and treating it first would have produced the wrong business interpretation.

Stage 2 analyzed `DocDuty Mobile App` as a separate asset after the core platform was understood. That phase classified the Flutter project by its real behavior rather than its folder names: dependencies, route structure, views, controllers, state usage, asset patterns, and placeholders.

Primary non-mobile sources used for product truth:

- `DocDuty_Single_Source_of_Truth.md`
- `PRODUCTION_READINESS_REPORT.md`
- `server/database/schema.ts`
- `server/index.ts`
- `server/routes/*.ts`
- `server/utils/settlement.ts`
- `server/utils/backgroundJobs.ts`
- `src/App.tsx`
- `src/lib/api.ts`
- `src/lib/realtime.ts`
- `data/route_inventory.md`
- `data/interaction_inventory.md`

Primary mobile sources used for asset classification:

- `DocDuty Mobile App/pubspec.yaml`
- `DocDuty Mobile App/lib/main.dart`
- `DocDuty Mobile App/lib/app/routes/app_pages.dart`
- representative controllers and views under `lib/app/modules`
- theme and widget structure under `lib/app/theme` and `widgets`
- test surface under `DocDuty Mobile App/test`

Method used:

- establish product truth from backend schema, routes, docs, and role-based web application structure
- verify business logic using route behavior, settlement utilities, and background job automation
- verify technical maturity using production-readiness evidence, route inventories, and test artifacts
- classify the Flutter folder by actual implementation behavior, not by visual polish
- map reusable mobile assets only after product requirements and service entry points were known

## 3. Main Project Understanding (Excluding `Mobile App`)

### Product purpose

DocDuty is a doctor duty replacement and locum marketplace aimed at Pakistan. The problem it solves is short-notice clinical staffing coverage. Instead of informal WhatsApp-style replacement coordination, the platform provides verified matching, auditable attendance, controlled settlement, and platform-led dispute resolution.

### Who it serves

- `doctor`: finds extra shifts, can post replacement coverage where allowed, accepts offers, completes attendance, manages wallet and disputes
- `facility_admin`: manages facility locations, posts vacancy or replacement shifts, handles bookings, attendance oversight, payments, ratings, and disputes
- `platform_admin`: verifies users, manages facilities and QR rotation, resolves disputes, manages fees and policies, handles payout oversight, and audits system actions

### System intent

The system is designed to make shift replacement operationally reliable and commercially safe. The product is not just a listing board. It is a controlled workflow engine with proof-of-attendance, money movement, reliability scoring, and admin controls.

### Major modules

- authentication and identity: registration, login, OTP, JWT access and refresh, role-aware routing
- profiles and verification: doctor KYC and PMDC/license data, facility account data, admin approval workflow
- facilities and locations: multi-location facilities, geofence coordinates, QR rotation secrets
- shift marketplace: shift posting, filtering, matching, dispatch, offers, counter-offers, booking
- attendance verification: geofence validation, rotating QR validation, event logs, admin overrides
- payments and wallet: escrow hold, platform fee, payouts, ledger transactions, cancellation refunds
- disputes and ratings: evidence-backed disputes, resolution types, mutual ratings, reliability effects
- messaging and notifications: booking-bound chat, in-app notifications, optional realtime
- admin operations: verification queue, user actions, facility/location management, policy configuration, payouts, audit logs, analytics
- public marketing layer: landing, pricing, trust, FAQ, contact, legal, getting started

### Technical ecosystem

The main product is a full-stack TypeScript system:

- React 19 + TypeScript + Vite 6 + Tailwind v4 frontend
- Express 4 + TypeScript backend
- PostgreSQL via `pg` with pooled connections
- JWT access and refresh token auth
- Soketi/Pusher-compatible realtime with polling fallback
- CI, route audits, accessibility smoke, load tests, backup and restore scripts

### Architecture overview

The front end is a single web app with role-based route trees for public, facility, doctor, and admin surfaces. The backend is a modular Express API with route modules mounted by domain area. The database schema is rich enough to support real operations, not just mock data. Shared behavior such as settlement and background automation sits in backend utilities.

### Maturity signals

The main workspace indicates a fairly mature MVP:

- the SSOT explicitly marks MVP as implemented
- the readiness report gives a `GO` decision
- route and interaction inventories cover the public, doctor, facility, and admin portals
- background jobs automate no-show detection, shift expiry, and overdue completion
- health, readiness, metrics, backup, restore, and CI quality gates are present

### What the mobile app must eventually connect to

A real DocDuty mobile app must connect to actual platform workflows, not just UI lists. At minimum it needs:

- auth and session management
- user profile and preferences
- shift feed and shift detail flows
- booking lifecycle flows
- attendance check-in and check-out with location and QR support
- wallet, ledger, and payout request views
- disputes, ratings, messages, notifications
- facility operations for posting and managing shifts
- admin oversight modules if all-role mobile support is required

## 4. Business Logic Breakdown

### Core business model

DocDuty monetizes by taking a configurable platform fee from a shift's total amount. The authoritative backend and SSOT model show a total price, a platform fee, and a doctor payout where:

- `platform_fee_pkr <= total_price_pkr`
- `payout_pkr = total_price_pkr - platform_fee_pkr`

The commercial flow is effectively escrow-style:

1. a doctor or facility posts a shift
2. eligible doctors receive dispatched offers
3. a doctor accepts or counter-offers where allowed
4. booking confirmation holds the poster's funds
5. attendance proof moves the booking through execution
6. completion triggers settlement, payout, fee capture, ratings, and reliability updates

### User roles and operational intent

#### Doctor

- wants fast access to nearby, qualified shifts with reliable payout
- needs visibility into pay, shift requirements, and facility context
- must prove attendance through geo and QR events
- needs wallet history, payout requests, dispute tools, chat, and profile management

#### Facility admin

- needs fast, verifiable staffing coverage
- manages facilities and locations, including geofence and QR setup
- posts shifts, monitors bookings, reviews attendance, handles payment and dispute cases
- needs messaging and historical performance visibility

#### Platform admin

- acts as the trust and policy layer of the marketplace
- verifies users, controls penalties and fees, resolves disputes, manages payouts
- rotates facility QR secrets, suspends or bans bad actors, reviews audit trails

### Main workflows

#### Shift creation and matching

`POST /api/shifts` accepts doctor and facility-admin-created shifts. It normalizes payload aliases, calculates fee and payout from live policy config, stores skill requirements, audits the action, and dispatches offers to eligible doctors. Matching logic uses:

- doctor role and active status
- availability status
- specialty match
- city match unless visibility is national
- no conflicting confirmed or in-progress bookings
- skill coverage
- ordering by reliability score and rating

#### Booking and attendance

A booking is not considered complete when it is accepted. It must move through attendance:

- check-in validates time window, geofence, rotating QR, and mock-location signals
- late check-in can reduce reliability
- check-out repeats geo and QR checks and marks the shift complete
- attendance events become dispute evidence and can support admin overrides

#### Settlement, refunds, and no-show handling

Settlement is not naive transfer logic. Shared backend utilities and jobs show policy-based operations:

- escrow release on completion
- platform fee ledger entry
- doctor payout credit
- cancellation refund percentages by time window
- doctor compensation on certain cancellations
- no-show penalty fees
- automatic poster refund on no-show
- automated reliability score changes

#### Disputes and trust controls

Disputes are attached to bookings and carry evidence bundles. Authorized parties can raise disputes; admins resolve them using defined resolution types such as full payout, partial refund, penalty, or dismissal. The system is designed to reduce ambiguity by combining attendance events, geo/QR data, chat history, and policy config.

#### Ratings and reliability

The marketplace relies on repeated trust signals:

- completed bookings can produce mutual ratings
- doctor reliability changes based on punctuality, no-show, and cancellations
- matching prioritizes reliability and rating

### Key business rules

- only role-authorized users can access protected role surfaces
- doctors and facilities need verification workflows before full trust
- matching respects specialty, skills, city scope, availability, and schedule conflicts
- attendance check-in and check-out are window-based and evidence-backed
- no-show and lateness carry policy-driven consequences
- chat is booking-bound and rejects obvious PHI-like message patterns
- admin actions create audit logs

### Data ownership and movement

The main data relationships are operational, not decorative:

- `users` own identities and role status
- `doctor_profiles` and `facility_accounts` extend user identity by role
- `facility_locations` provide attendance coordinates and QR secrets
- `shifts` define open work opportunities
- `offers` and `bookings` move a shift from discovery to commitment
- `attendance_events` prove execution
- `wallets`, `ledger_transactions`, and `payouts` capture money movement
- `disputes`, `dispute_evidence`, `ratings`, `messages`, and `notifications` handle trust, resolution, and communication

## 5. Technical Architecture Breakdown

### Frameworks and technologies

- frontend: React 19, TypeScript, Vite 6, Tailwind CSS v4
- backend: Express 4, TypeScript, `tsx`
- database: PostgreSQL with `pg`
- auth: JWT access and refresh tokens
- realtime: Pusher-compatible websockets via Soketi, with polling fallback
- ops: GitHub Actions, route inventories, accessibility checks, load tests, backup and restore scripts

### App and service relationships

The web product is one client application with four logical surfaces:

- public marketing and trust pages
- facility portal
- doctor portal
- platform-admin portal

The backend exposes a modular REST API. `server/index.ts` mounts route modules for:

- `auth`
- `users`
- `facilities`
- `shifts`
- `bookings`
- `attendance`
- `wallets`
- `disputes`
- `ratings`
- `notifications`
- `messages`
- `admin`
- `reference`
- `contact`
- uploads through the users route surface

### Backend and client interaction patterns

On web, `src/lib/api.ts` centralizes JSON requests, bearer token handling, refresh retries, and file uploads. `AuthContext` loads the authenticated user and uses role-based redirection. `src/lib/realtime.ts` shows that realtime is optional and already designed to degrade gracefully to polling.

This matters for mobile: the backend already exposes a consumable contract pattern for token-based clients. A future mobile app does not need a new backend paradigm. It needs a mobile client layer that mirrors the current API client behavior.

### Models and data structures

The schema defines a broad operational data model, including:

- reference tables: provinces, cities, specialties, roles, skills
- identity tables: users, doctor profiles, doctor skills, facility accounts, facility locations
- operational tables: shifts, shift skills, offers, bookings, attendance events
- financial tables: wallets, ledger transactions, payouts
- trust and comms tables: disputes, dispute evidence, ratings, notifications, messages, audit logs
- support tables: otp codes, refresh tokens, policy config, contact submissions, user preferences

This is a substantial mobile integration surface. The mobile app must be able to consume and present real status transitions across these entities.

### Mobile-relevant API/service contract surface

| Area | Current backend role in platform | Mobile relevance |
| --- | --- | --- |
| Auth | login, registration, OTP, refresh, me | mandatory for all roles |
| Users / profile / preferences | profile data, avatar upload, settings | mandatory for all roles |
| Facilities | facility account and locations | required for facility and admin |
| Shifts | create, list, view, manage shift opportunities | mandatory for doctor and facility |
| Bookings | booking lifecycle | mandatory for doctor and facility |
| Attendance | geo plus QR check-in/out and history | mandatory for doctor; oversight for facility/admin |
| Wallets / payouts | balance, transactions, payout requests | mandatory for doctor and finance-related views |
| Disputes | raise, list, resolve workflows | mandatory for doctor/facility, oversight for admin |
| Ratings | post-shift trust feedback | useful for doctor/facility |
| Messages | booking-bound chat | mandatory shared module |
| Notifications | in-app events and unread state | mandatory shared module |
| Reference | cities, specialties, roles, skills | required for onboarding and filters |
| Admin | verification, policies, facilities, payouts, audit, analytics | required for admin mobile scope |

### Service boundaries and reusable backend logic

Important backend logic already exists and should not be reimplemented in the mobile layer:

- fee and payout calculation in shift creation
- settlement and cancellation refund logic
- no-show detection and auto-completion jobs
- role-based access control
- QR rotation and attendance validation
- admin audit and policy enforcement

The mobile app should call and reflect these backend decisions, not duplicate them locally.

### Areas of technical debt or inconsistency

- the public pricing copy is not fully aligned with the backend settlement model. The SSOT and settlement logic clearly model a fee deducted from the total shift amount, while public marketing copy suggests doctors keep 100 percent and facilities pay an extra fee.
- the public website is materially shallower than the implemented portal product, so marketing pages alone are not a reliable product map
- realtime is optional and externally provisioned; mobile should assume polling-first unless realtime infrastructure is explicitly enabled
- earlier readiness fixes point to the value of shared typed contracts, but a shared frontend and mobile contract package does not yet exist

## 6. `Mobile App` Folder Assessment

### What it actually is

`DocDuty Mobile App` is best classified as a Flutter UI kit or visual starter project for a consumer-style doctor appointment app. It is not a production-ready DocDuty mobile client, and it is not a partial mobile implementation of the real platform.

Evidence:

- package name is `doctor_appointment`
- description is still `A new Flutter project`
- README is the default Flutter starter README
- view naming and route structure center on appointments, doctors, hospitals, patient details, and consultation flows
- sign-in directly routes to the main navigation without real authentication
- multiple screens use hardcoded sample names, locations, or placeholder text
- no networking package, repository layer, or backend service client is present

### Structure and organization

The folder contains:

- standard Flutter platform folders: Android, iOS, web, desktop
- `assets/images` and one `Gilroy` font family
- `lib/main.dart` with `GetMaterialApp`
- `lib/app/routes` for route registration
- `lib/app/modules/views` for screens
- `lib/app/modules/controllers` for view controllers
- `lib/app/theme/theme.dart` for a light/dark theme notifier
- `widgets` for shared UI pieces

The visual scope is wide. There are many screens covering onboarding, auth, home, bookings, chat, location, profile, settings, privacy, help, reviews, payment, and detail pages.

### Navigation and state patterns

Navigation is handled with GetX routes and bindings. State is split between:

- GetX controllers for screen-level data and navigation
- Provider for a simple global `ColorNotifier` theme toggle

This is not a robust application architecture. It is a mixed presentation-state pattern with no data layer underneath it.

### Quality and maturity

Strengths:

- a large number of prebuilt mobile screens
- consistent visual language, spacing, and card patterns
- reusable auth, list, detail, settings, and chat-style shells
- existing asset library and basic dark/light theming

Weaknesses:

- controllers mostly hold static arrays and text fields
- no API client, no secure storage, no repository layer, no models for real backend payloads
- dummy domain content such as `New York, USA`, `Dr. Jane Cooper`, and hospital discovery flows
- placeholder screens such as `VideoCallScreenView is working`
- the default Flutter widget test is still present and unrelated to the app

### Production readiness level

Production readiness is low.

This codebase is visually ahead of its actual functionality. It can accelerate UI production, but it cannot be treated as a ready mobile product. The majority of business logic, service integration, role modeling, and trustworthy state handling still need to be built.

## 7. Flutter UI Kit Reusability Matrix

### Directly reusable

- generic visual primitives such as buttons, text fields, cards, chips, icon containers, separators, and spacing conventions
- theme direction, typography choice, and the overall design language if rebranded to DocDuty
- legal/help/settings style shells where content can be swapped without major structural changes
- generic notification list layouts and chat-thread visual patterns
- onboarding, splash, and welcome screen structure as shell-level assets

### Reusable with modification

- sign-in, account creation, OTP, password reset, and profile-completion screens
- search, filter, list, and detail patterns that can be remapped from doctor and hospital browsing to shift and facility browsing
- bookings list and booking detail shells, if refactored around DocDuty booking statuses and evidence actions
- location-permission and map-oriented screens, if rebuilt around attendance and facility presence rather than consumer discovery
- profile and settings forms, if rewritten for doctor verification, facility account data, or admin account preferences
- chat list and conversation screens, if connected to booking-bound DocDuty messaging

### Visual-only reusable

- doctor and hospital card compositions as temporary placeholders for shift cards or facility cards
- payment success cards and confirmation states as generic status-feedback patterns
- favorites toggles, review blocks, and home hero sections as composition references rather than feature matches
- bottom-navigation styling, top bars, search bars, and empty-state layout patterns

### Missing for real implementation

- real shift feed with urgency, pay breakdown, specialty, skills, and booking state
- shift detail with accept, reject, or counter-offer behavior
- attendance check-in and check-out using live GPS, geofence rules, rotating QR, and warning states
- wallet balance, ledger, payout requests, and payout history screens aligned to DocDuty's financial model
- dispute creation, evidence submission, dispute list, and resolution history screens
- facility shift posting, facility shift management, facility attendance review, and facility payments surfaces
- admin verification queue, user actions, facility management, policy editor, payout oversight, audit logs, and analytics screens
- role-aware onboarding and navigation for doctor, facility, and platform-admin users

### Not aligned with actual product needs

- patient-details flows
- appointment booking flow as currently designed
- package selection flow
- consumer payment methods and add-card flow in its current form
- nearby hospitals discovery and hospital directory behavior
- consumer favorites for doctors and hospitals
- consultation and video-call flows
- hospital and doctor reviews in their current appointment-marketplace framing

## 8. Product-to-Mobile Mapping

| Project module / feature | Matching mobile screen or component | Fit level | Required changes | Implementation notes |
| --- | --- | --- | --- | --- |
| Auth and account recovery | `sign_in_view`, `create_account_view`, `otp_screen_view`, `new_password_screen_view` | Medium | replace email-first wording with DocDuty auth flow, add JWT session handling, role-aware post-login routing | good shell reuse, no functional reuse |
| Doctor onboarding and profile verification | `profile_info_add_screen_view`, `profile_screen_view`, `your_profile_view` | Medium | add PMDC, CNIC, specialty, skills, city, availability, avatar upload, verification status | layout reuse is good; form model must be rebuilt |
| Shift feed and search | `home_view`, `search_screen_view`, `filter_screen_view`, `category_view` | Medium | replace doctors and hospitals with shifts and facilities, use real filters and availability states | strongest doctor-facing reuse area |
| Shift detail and accept/counter-offer | `doctor_details_view`, parts of `review_summary_view` | Low to medium | redesign around shift details, fee breakdown, requirements, accept or counter actions | existing detail composition is reusable, domain is not |
| Doctor bookings | `bookings_screen_view`, `my_appointment_view`, `cancle_booking_view` | Medium | remap tabs to booking lifecycle states, add attendance, dispute, and payout entry points | structure reusable, labels and logic are not |
| Attendance proof | `loca_allow_permi_screen_view`, `add_manu_loca_screen_view`, `get_direction_view`, `location_done_view` | Low to medium | add live location, QR scanning, geofence warnings, time-window states, device-signal handling | current screens help with permissions and map framing only |
| Wallet and payouts | visual pieces from `payment_view`, `payment_methods_view`, `add_card_view` | Low | rebuild around wallet balance, ledger, payout request, payout history | mostly component-level reuse |
| Messaging | `chat_screen_view`, `message_screen_view` | Medium to high | connect to booking conversations, unread counts, message posting, polling or realtime updates | one of the most reusable shared modules |
| Notifications | `notification_screen_view` | High | bind to real notification feed, unread state, deep links | low-effort adaptation |
| Disputes | no strong direct screen match; can reuse list, form, and card patterns from bookings/help flows | Low | create dedicated dispute screens and evidence states | new workflow needed |
| Facility dashboard and shift posting | partial reuse from list, form, and home cards | Low | build dedicated facility IA for post shift, shift management, bookings, attendance, payments | screen-level reuse is limited |
| Facility messaging and notifications | same chat and notification assets | Medium | make role-aware and booking-aware | shared module reuse is valid |
| Facility attendance and payments oversight | partial reuse from location and payment patterns | Low | create dedicated operational screens for evidence review and payment state | mostly component-level reuse |
| Admin dashboard | generic cards and settings shells | Low | build dense operations-focused dashboard and queues | new information architecture required |
| Admin verifications, disputes, policies, audit, analytics | almost no direct screen match | Very low | new mobile or tablet-first screens required | all-role mobile support increases scope significantly |
| Help, legal, privacy, contact | `help_center_view`, `privacy_policy_view`, settings/legal shells | High | replace content and entry points | safe reuse area |

## 9. Integration Strategy

### Architecture alignment

The mobile app should align to DocDuty's real backend and role model, not the appointment UI kit's domain. The recommended structure is:

- keep the Flutter project shell and strongest visual assets
- rebrand and rename the app from `doctor_appointment` to DocDuty
- preserve GetX routing initially to minimize screen-shell churn
- remove fake business state from ad hoc controllers
- introduce a proper feature-layered mobile architecture under the existing UI

Recommended mobile structure:

- `core`: config, environment, API client, auth session, secure token storage, error handling, network models
- `shared`: reusable widgets, theme, layout primitives, common lists/cards, utilities
- `features/auth`
- `features/doctor`
- `features/facility`
- `features/admin`
- `features/messages`
- `features/notifications`
- `features/reference`

### Refactoring approach

Use phased reuse, not direct conversion.

Phase 1 should extract reusable visual assets:

- buttons, fields, cards, app bars, list rows, tab shells, empty states, settings sections
- design tokens, typography, spacing, and common styles
- generic route shells such as auth, chat, notifications, settings, help, and profile forms

Phase 2 should replace fake domain models:

- remove hardcoded doctor, hospital, patient, and appointment arrays
- replace sample names, locations, and price text
- normalize naming to shifts, bookings, facilities, attendance, wallet, disputes, and admin

Phase 3 should insert the real application layer:

- REST client with interceptors and refresh-token handling equivalent to the web client
- secure token storage
- repositories and service adapters per feature
- strongly typed request and response models mapped to current backend contracts
- role-aware navigation and guards

### Backend and API connection plan

The mobile app should consume the existing REST API surface rather than require a new backend. Implementation priorities:

- mirror web auth behavior with login, refresh, logout, and `me` bootstrap
- load reference data for roles, specialties, cities, and skills early in app startup and onboarding
- bind doctor flows to shifts, bookings, attendance, wallets, disputes, messages, ratings, and notifications
- bind facility flows to facility locations, shifts, bookings, attendance, payments, disputes, messages, and ratings
- bind admin flows to dashboard, verifications, users, facilities, disputes, policies, payments, audit, and analytics

For realtime behavior, match the backend's existing philosophy:

- ship polling-first for notifications and messages
- add Pusher-compatible mobile realtime later only if infrastructure is provisioned and tested

### State management strategy

Do not keep the current mixed `GetX + Provider` pattern for business features.

Recommended approach:

- keep GetX for routing and screen binding during the adaptation phase
- consolidate presentation and feature state into disciplined, feature-scoped controllers backed by repositories and services
- keep a single simple app-level theme state if needed, but do not use Provider as a second feature-state system
- keep business rules and request orchestration out of widgets and out of static controllers

This preserves reuse while removing the current architecture ambiguity.

### Navigation alignment

The current bottom-navigation and appointment-style route map must be replaced with role-aware DocDuty flows.

Recommended role-aware navigation model:

- doctor: home or shift feed, bookings, attendance, wallet, messages, profile
- facility: dashboard, shifts, bookings, attendance, payments, messages, settings
- admin: dashboard, verifications, disputes, users or facilities, payments, settings

Shared routes should include auth, notifications, help, legal, and profile editing where appropriate.

### Widget and module organization

Use the UI kit to extract a DocDuty mobile design system:

- atoms: buttons, inputs, badges, chips, icons, loaders, dividers
- molecules: cards, filter rows, summary strips, list tiles, chat bubbles, info panels
- organisms: auth forms, shift cards, booking cards, attendance status blocks, payout history lists, dispute timelines

This allows facility and admin surfaces to reuse lower-level design components even where screen-level reuse is weak.

### Development order for all-role mobile support

1. rebrand the Flutter project and remove domain-mismatched sample content
2. build the shared mobile core: config, API client, secure storage, auth bootstrap, error handling, typed models
3. implement shared cross-role modules: auth, profile basics, notifications, messages, settings, help, legal
4. implement doctor modules: shift feed, shift detail, bookings, attendance, wallet, disputes, ratings
5. implement facility modules in parallel from the shared design system: dashboard, post shift, shift management, bookings, attendance oversight, payments, disputes, messages
6. implement admin modules from component-level reuse: dashboard, verification queue, disputes, users, facilities, policies, payouts, audit, analytics
7. add advanced capabilities: uploads, QR scanning, geolocation permissions, offline and retry handling, optional realtime
8. harden with role-based QA, API contract tests, mobile UI regression checks, and pilot feedback

## 10. Risks, Gaps, and Constraints

### Technical risks

- the Flutter codebase has no production data layer, so logic integration effort is substantial
- the current mobile app mixes GetX and Provider, which will become brittle if left in place
- mobile-specific platform dependencies for geolocation, QR scanning, secure storage, and permission flows are not yet integrated
- the mobile folder is a separate standalone project with its own repository history, which may complicate ownership, packaging, or merge strategy

### Architectural risks

- the UI kit is consumer appointment oriented, while DocDuty is an operational staffing platform
- admin and facility experiences require dense, task-heavy workflows that the current kit barely represents
- if the team treats the UI kit as feature-complete because it looks polished, delivery risk will increase sharply

### Missing screens and feature gaps

- no real attendance proof flow
- no wallet or payout implementation
- no dispute module
- no facility operations surface
- no real admin console surface
- no role-aware onboarding or app shell
- no production notification or realtime strategy

### Mismatch risks

- naming, copy, and imagery currently point to doctor appointments, hospitals, patients, and consultations
- the public site contains some pricing/trust language that does not fully match the backend settlement logic
- direct one-to-one screen mapping is not possible for several DocDuty modules

### Maintainability concerns

- hardcoded arrays and route-only controllers encourage duplicated screen-state logic
- no typed shared contract package exists between backend and clients
- the current Flutter test surface does not validate real workflows

### Scaling concerns

- all-role parallel mobile scope is feasible, but it raises product-design and implementation volume
- facility and admin mobile experiences may need tablet-first considerations to avoid over-compressing operational workflows onto small screens

### Assumptions and unknowns

- the repo does not include a native mobile push stack such as FCM or APNs integration
- the repo does not show a production mobile-specific file-upload and document-capture UX
- some admin surfaces may ultimately remain web-first for efficiency even if a mobile admin app exists

## 11. Final Recommendation

Yes, the Flutter UI kit should be used, but only in a constrained and professional way.

It should be used as:

- a visual design baseline
- a reusable widget and screen-shell library
- an accelerator for shared mobile UX patterns
- the fastest way to avoid designing the mobile UI from scratch

It should not be used as:

- the product source of truth
- the application architecture
- the business-domain model
- evidence that the mobile product is already partially implemented

The recommended approach is phased reuse with deliberate architecture replacement underneath the visuals. This is better than rebuilding the mobile UI and UX from scratch because the kit already contains useful layout patterns, visual consistency, and reusable shared screens. It is also better than blindly adopting the kit because the current code does not model DocDuty's real workflows, roles, or backend behavior.

Professional recommendation:

- reuse the visual layer aggressively
- reuse the screen layer selectively
- rebuild the data and workflow layer deliberately
- treat doctor flows as the strongest screen-level reuse area
- treat facility and admin flows as mostly component-level reuse, not one-to-one screen reuse

## 12. Actionable Next Steps

1. create a dedicated DocDuty mobile working branch or repo plan that imports the Flutter kit as a reusable asset base rather than as a finished product
2. rename package identifiers, app title, assets, copy, and route semantics from `doctor_appointment` to DocDuty terminology
3. extract a reusable mobile design system from the kit: buttons, forms, cards, tabs, chat layouts, list cells, settings sections, empty states, and status components
4. add mobile core infrastructure: environment config, API client, refresh-token handling, secure storage, error model, loading and retry conventions, and typed DTOs for existing backend contracts
5. replace hardcoded controllers and sample arrays with feature repositories connected to `auth`, `reference`, `users`, and `notifications` first
6. implement shared cross-role flows: sign-in, OTP, account recovery, profile basics, notifications, messages, settings, help, and legal
7. implement doctor modules against the real backend: shift feed, shift detail, bookings, attendance, wallet, disputes, and ratings
8. implement facility modules using extracted shared components: dashboard, post shift, shift management, bookings, attendance review, payments, disputes, and messages
9. implement admin modules where mobile usage is justified: verification queue, disputes, users, facilities, payout oversight, and policy or audit summaries
10. add mobile-specific capabilities and hardening: geolocation permissions, QR scanning, upload flows, polling-based notifications, optional realtime later, test automation, and pilot validation with real users from each role group
