# Frontend ↔ Backend API Audit Report

> **Scope**: All frontend pages (doctor portal + facility portal) vs backend API routes  
> **Context**: `api.get()` now returns raw JSON data directly (no `{data, error}` wrapper)  
> **Key**: ✅ = OK | ❌ = BROKEN | ⚠️ = DATA LOSS (silent fallback hides missing field)

---

## Summary

| Portal | Total Pages | ✅ OK | ❌ BROKEN | ⚠️ DATA LOSS |
|--------|-------------|-------|-----------|--------------|
| Doctor | 10 | 3 | 6 | 1 |
| Facility | 15 | 6 | 8 | 1 |
| Auth | 1 | 1 | 0 | 0 |
| **Total** | **26** | **10** | **14** | **2** |

---

## Backend Response Shape Reference

| Endpoint | Response Shape |
|----------|---------------|
| `GET /shifts` | `{ shifts, total, page, limit }` |
| `GET /shifts/feed` | `{ shifts }` |
| `GET /shifts/:id` | **flat** shift object — `.skills`, `.offers`, `.booking` attached directly |
| `POST /shifts` | `{ id, title, type, totalPricePkr, ... }` |
| `GET /bookings` | `{ bookings, total, page, limit }` |
| `GET /bookings/:id` | **flat** booking object — `.attendanceEvents` attached (camelCase) |
| `POST /bookings/accept` | `{ bookingId, shiftId, status, message }` |
| `POST /attendance/check-in` | expects body `{ bookingId, qrCode, latitude, longitude }` |
| `POST /attendance/check-out` | expects body `{ bookingId, qrCode, latitude, longitude }` |
| `GET /attendance/:bookingId` | `{ events }` |
| `GET /disputes` | `{ disputes, total, page, limit }` |
| `GET /disputes/:id` | **flat** dispute — `.evidence`, `.attendanceEvents` attached |
| `GET /messages/conversations` | `{ conversations }` — fields: `booking_id, shift_title, doctor_name, last_message, last_message_at, message_count` |
| `GET /wallets/balance` | `{ id, balancePkr, heldPkr, availablePkr, totalEarnedPkr, totalSpentPkr }` **(camelCase)** |
| `GET /wallets/transactions` | `{ transactions }` — txn fields include `amount_pkr` (snake_case from DB) |
| `POST /wallets/payout` | expects body `{ amountPkr }` |
| `GET /ratings` | `{ ratings, total, page, limit }` |
| `GET /users/profile` | `{ id, phone, email, role, ..., profile: {...} }` (spread user + nested `.profile`) |
| `GET /reference/skills` | `{ skills }` |
| `GET /facilities/locations` | **DOES NOT EXIST** — matches `GET /facilities/:id` with id='locations' → 404 |

---

## Doctor Portal Pages

### 1. `src/pages/doctor/Home.tsx` — ✅ OK

| Call | Backend Returns | Frontend Accesses | Match |
|------|----------------|-------------------|-------|
| `GET /shifts/feed?limit=50` | `{ shifts }` | `data.shifts \|\| []` | ✅ |

---

### 2. `src/pages/doctor/Bookings.tsx` — ✅ OK

| Call | Backend Returns | Frontend Accesses | Match |
|------|----------------|-------------------|-------|
| `GET /bookings?limit=100` | `{ bookings }` | `data.bookings \|\| []` | ✅ |

---

### 3. `src/pages/doctor/BookingDetails.tsx` — ❌ BROKEN

| Call | Backend Returns | Frontend Accesses | Match |
|------|----------------|-------------------|-------|
| `GET /bookings/:id` | flat booking | `data.booking \|\| data` | ✅ via fallback |

**Bug**: Attendance events field name mismatch.

```
Frontend:  b.attendance_events       (snake_case)
Backend:   booking.attendanceEvents   (camelCase — set programmatically in routes/bookings.ts)
```

- `b.attendance_events` is always `undefined` → `|| []` → timeline never populates
- Check-in/check-out steps always show `'--'`

**Fix**: `b.attendance_events` → `b.attendanceEvents`

---

### 4. `src/pages/doctor/ShiftDetails.tsx` — ❌ BROKEN

| Call | Backend Returns | Frontend Accesses | Match |
|------|----------------|-------------------|-------|
| `GET /shifts/:id` | flat shift | `data.shift \|\| data` | ✅ via fallback |

**Bug 1**: Skills field mismatch.

```
Frontend:  s.required_skills  →  (s.required_skills || []).map(sk => sk.name || sk)
Backend:   shift.skills = [{id, name}, ...]   (programmatically attached array)
```

`s.required_skills` is undefined → defaults to `[]` → skills list is always empty.

**Fix**: `s.required_skills` → `s.skills`

**Bug 2**: Counter-offer flag field name.

```
Frontend:  s.allow_counter
Backend:   shift.counter_offer_allowed  (SQLite 0/1)
```

`s.allow_counter` is undefined → `!== false` evaluates to `true` → counter always allowed.

**Fix**: `s.allow_counter` → `s.counter_offer_allowed`

⚠️ **Data loss**: `s.facility_name`, `s.facility_rating` not in backend shift response. Falls to hardcoded 'Facility' / '4.5'.

---

### 5. `src/pages/doctor/Attendance.tsx` — ❌ BROKEN (4 bugs)

| Call | Backend Returns | Frontend Accesses | Match |
|------|----------------|-------------------|-------|
| `GET /bookings?status=...&limit=10` | `{ bookings }` | `data.bookings \|\| []` | ✅ |
| `GET /bookings/:id` | flat booking | `bookingDetail?.booking?.attendance_events` | ❌ |
| `POST /attendance/check-in` | expects `{ bookingId, qrCode }` | sends `{ booking_id, qr_token }` | ❌ |
| `POST /attendance/check-out` | expects `{ bookingId, qrCode }` | sends `{ booking_id, qr_token }` | ❌ |
| `POST /attendance/presence-ping` | **DOES NOT EXIST** | called by frontend | ❌ |

**Bug 1**: Attendance events access uses double-wrong path.

```
Frontend:   bookingDetail?.booking?.attendance_events
Should be:  bookingDetail?.attendanceEvents
```

Backend returns a flat object (not `{ booking: ... }`) and uses camelCase `attendanceEvents`. Frontend chains through non-existent `.booking` wrapper AND uses wrong case.

**Bug 2**: Check-in/check-out body key mismatches.

```
Frontend sends:     { booking_id, qr_token, latitude, longitude }
Backend expects:    { bookingId, qrCode, latitude, longitude }
```

`bookingId` is undefined on the backend → 400 "bookingId is required".

**Bug 3**: `POST /attendance/presence-ping` does not exist in backend → 404.

Backend attendance routes: `check-in`, `check-out`, `/:bookingId` (GET), `admin-override` — no `presence-ping`.

**Fixes**:
1. `bookingDetail?.booking?.attendance_events` → `bookingDetail?.attendanceEvents`
2. Body keys: `booking_id` → `bookingId`, `qr_token` → `qrCode`
3. Add `POST /attendance/presence-ping` endpoint or remove frontend call

---

### 6. `src/pages/doctor/Disputes.tsx` — ✅ OK

| Call | Backend Returns | Frontend Accesses | Match |
|------|----------------|-------------------|-------|
| `GET /disputes?limit=50` | `{ disputes }` | `data.disputes \|\| []` | ✅ |
| `GET /bookings?limit=50` | `{ bookings }` | `data.bookings \|\| []` | ✅ |

---

### 7. `src/pages/doctor/Messages.tsx` — ❌ BROKEN

| Call | Backend Returns | Frontend Accesses | Match |
|------|----------------|-------------------|-------|
| `GET /messages/conversations` | `{ conversations }` | `data.conversations \|\| []` | ✅ |

**Bug**: Conversation field name mismatches.

```
Frontend:  c.other_party_name || c.facility_name    →  Backend: c.doctor_name (only)
Frontend:  c.context || c.booking_title              →  Backend: c.shift_title
Frontend:  c.unread_count                            →  Backend: c.message_count
Frontend:  c.id || c.booking_id                      →  Backend: c.booking_id (no .id)
```

- Doctor's view needs facility/poster name, but backend only returns `doctor_name`
- `other_party_name` and `facility_name` both undefined → fallback 'Facility'
- `context`, `booking_title` undefined → fallback 'Booking' (should use `c.shift_title`)
- `unread_count` undefined → always 0 (backend has `message_count`)

**Fixes**:
1. Backend: add poster name to conversations query, OR frontend: use `c.doctor_name`
2. Use `c.shift_title` instead of `c.context || c.booking_title`
3. `c.unread_count` → `c.message_count`

---

### 8. `src/pages/doctor/Profile.tsx` — ❌ BROKEN

| Call | Backend Returns | Frontend Accesses | Match |
|------|----------------|-------------------|-------|
| `GET /users/profile` | `{ id, phone, email, ..., profile: { full_name, ... } }` | `p.full_name`, `p.city`, etc. | ❌ |
| `GET /reference/skills` | `{ skills }` | `skillsData.skills \|\| []` | ✅ |

**Bug**: Profile fields accessed at wrong nesting level.

Backend returns: `{ id, phone, email, role, ..., profile: { full_name, specialty_name, pmdc_license, city_name, skills, ... } }`

Frontend does `p = profileData.user || profileData` (falls back to `profileData`), then:

```
p.full_name      →  undefined  (should be p.profile.full_name)
p.phone          →  ✅ (top-level)
p.email          →  ✅ (top-level)
p.city           →  undefined  (should be p.profile.city_name)
p.specialty      →  undefined  (should be p.profile.specialty_name)
p.pmdc_number    →  undefined  (should be p.profile.pmdc_license)
p.skills         →  undefined  (should be p.profile.skills)
```

Profile form shows empty for name, city, specialty, PMDC license.

**Fix**: `p.full_name` → `p.profile?.full_name`, `p.city` → `p.profile?.city_name`, etc.

---

### 9. `src/pages/doctor/Settings.tsx` — ✅ OK

No API calls. Local state + AuthContext `logout()` only.

---

### 10. `src/pages/doctor/Wallet.tsx` — ❌ BROKEN (3 bugs)

| Call | Backend Returns | Frontend Accesses | Match |
|------|----------------|-------------------|-------|
| `GET /wallets/balance` | `{ balancePkr, heldPkr, availablePkr, totalEarnedPkr }` | `balData.available`, `balData.escrow` | ❌ |
| `GET /wallets/transactions` | `{ transactions }` (fields: `amount_pkr`) | `t.amount` | ❌ |
| `POST /wallets/payout` | expects `{ amountPkr }` | sends `{ amount }` | ❌ |

**Bug 1**: Balance field name mismatches — backend uses camelCase, frontend uses different names entirely.

```
Frontend:  balData.available     →  Backend: balData.availablePkr
Frontend:  balData.balance       →  Backend: balData.balancePkr
Frontend:  balData.escrow        →  Backend: balData.heldPkr
Frontend:  balData.pending       →  Backend: (no such field)
Frontend:  balData.total_earned  →  Backend: balData.totalEarnedPkr
Frontend:  balData.lifetime      →  Backend: (no such field)
```

All three balance cards show **Rs. 0**.

**Bug 2**: Transaction amount field mismatch.

```
Frontend:  t.amount       →  Backend: t.amount_pkr
```

All transactions show **Rs. 0**.

**Bug 3**: Payout body key mismatch.

```
Frontend sends:   { amount: 5000 }
Backend expects:  { amountPkr: 5000 }
```

`amountPkr` is undefined → backend sends 400 "Valid amount required".

**Fixes**:
1. `balData.available` → `balData.availablePkr`, `balData.escrow` → `balData.heldPkr`, `balData.total_earned` → `balData.totalEarnedPkr`
2. `t.amount` → `t.amount_pkr`
3. `{ amount }` → `{ amountPkr }`

---

## Facility Portal Pages

### 11. `src/pages/Dashboard.tsx` — ✅ OK

| Call | Backend Returns | Frontend Accesses | Match |
|------|----------------|-------------------|-------|
| `GET /shifts?status=open&limit=100` | `{ shifts }` | `shiftsRes?.shifts \|\| shiftsRes \|\| []` | ✅ |
| `GET /bookings?limit=100` | `{ bookings }` | `bookingsRes?.bookings \|\| bookingsRes \|\| []` | ✅ |
| `GET /disputes?limit=100` | `{ disputes }` | `disputesRes?.disputes \|\| disputesRes \|\| []` | ✅ |

---

### 12. `src/pages/Shifts.tsx` — ✅ OK

| Call | Backend Returns | Frontend Accesses | Match |
|------|----------------|-------------------|-------|
| `GET /shifts` | `{ shifts }` | `data?.shifts \|\| data \|\| []` | ✅ |

---

### 13. `src/pages/PostShift.tsx` — ✅ OK

| Call | Backend Returns | Frontend Accesses | Match |
|------|----------------|-------------------|-------|
| `GET /reference/skills` | `{ skills }` | `data?.skills \|\| data` | ✅ |
| `POST /shifts` | `{ id, ... }` | `data.id \|\| data.shift?.id` | ✅ |

---

### 14. `src/pages/Bookings.tsx` — ✅ OK

| Call | Backend Returns | Frontend Accesses | Match |
|------|----------------|-------------------|-------|
| `GET /bookings?limit=100` | `{ bookings }` | `data.bookings \|\| []` | ✅ |

---

### 15. `src/pages/BookingDetails.tsx` (facility) — ❌ BROKEN

| Call | Backend Returns | Frontend Accesses | Match |
|------|----------------|-------------------|-------|
| `GET /bookings/:id` | flat booking with `.attendanceEvents` | direct access | ✅ (top-level) |

**Bug**: Attendance event type field mismatch in timeline.

```
Frontend:  e.type === 'check_in'     →  DB column: event_type
Frontend:  e.type === 'check_out'    →  DB column: event_type
```

`e.type` is undefined on `attendance_events` rows — column is `event_type`. Timeline check-in/check-out always shows `'--'`.

**Fix**: `e.type` → `e.event_type`

---

### 16. `src/pages/ShiftDetails.tsx` (facility) — ❌ BROKEN

| Call | Backend Returns | Frontend Accesses | Match |
|------|----------------|-------------------|-------|
| `GET /shifts/:id` | flat shift | direct property access | ✅ mostly |

**Bug**: Skills parsing fails.

```
Frontend:  JSON.parse(data.required_skills)
Backend:   shift.skills = [{ id, name }, ...]
```

`data.required_skills` is the raw DB `requirements` text column (or null). `JSON.parse(null)` throws → caught silently → skills always empty. The actual skills are in `data.skills`.

**Fix**: Use `data.skills?.map(s => s.name) || []` instead of `JSON.parse(data.required_skills)`

⚠️ `data.facility_name` not in backend query → falls back to 'Facility'.

---

### 17. `src/pages/Attendance.tsx` (facility) — ✅ OK

| Call | Backend Returns | Frontend Accesses | Match |
|------|----------------|-------------------|-------|
| `GET /bookings?limit=100` | `{ bookings }` | `data.bookings \|\| []` | ✅ |

---

### 18. `src/pages/AttendanceDetails.tsx` — ❌ BROKEN (2 bugs)

| Call | Backend Returns | Frontend Accesses | Match |
|------|----------------|-------------------|-------|
| `GET /bookings/:id` | flat booking with `.attendanceEvents` | direct access | partial |

**Bug 1**: Event type field name.

```
Frontend:  e.type === 'check_in'        →  DB column: event_type
Frontend:  e.type === 'presence_ping'   →  DB column: event_type
```

`.find()` never matches → check-in time, check-out time, pings all empty.

**Bug 2**: Geo/QR verification field names.

```
Frontend:  e.geo_verified   →  DB column: geo_valid
Frontend:  e.qr_verified    →  DB column: qr_valid
```

Always shows 'Not Verified' even for verified events.

**Fixes**:
1. `e.type` → `e.event_type`
2. `e.geo_verified` → `e.geo_valid`, `e.qr_verified` → `e.qr_valid`

---

### 19. `src/pages/Disputes.tsx` (facility) — ✅ OK

| Call | Backend Returns | Frontend Accesses | Match |
|------|----------------|-------------------|-------|
| `GET /disputes?limit=100` | `{ disputes }` | `data.disputes \|\| []` | ✅ |

---

### 20. `src/pages/DisputeDetails.tsx` — ❌ BROKEN (2 bugs)

| Call | Backend Returns | Frontend Accesses | Match |
|------|----------------|-------------------|-------|
| `GET /disputes/:id` | flat dispute | direct access | partial |

**Bug 1**: `respondent_name` doesn't exist in backend response.

`GET /disputes/:id` returns `raised_by_phone` and `raised_against_phone` — no name joins. The **list** endpoint has `raised_against_name` but the **detail** endpoint does not.

```
Frontend:  data.respondent_name    →  undefined → 'Unknown Doctor'
```

**Bug 2**: `geo_verified` / `qr_verified` are not top-level dispute properties.

These exist on individual items in `data.attendanceEvents[]`, not on the dispute itself.

```
Frontend:  data.geo_verified    →  undefined → 'Not Verified'
Frontend:  data.qr_verified     →  undefined → 'Not Verified'
```

**Fixes**:
1. Backend: add doctor name join to `GET /disputes/:id`, OR frontend: use `data.raised_against_phone`
2. Frontend: extract from `data.attendanceEvents[0]?.geo_valid` instead of `data.geo_verified`

---

### 21. `src/pages/Messages.tsx` (facility) — ❌ BROKEN

| Call | Backend Returns | Frontend Accesses | Match |
|------|----------------|-------------------|-------|
| `GET /messages/conversations` | `{ conversations }` | `data.conversations \|\| []` | ✅ |

**Bug**: Field name mismatches in conversation mapping.

```
Frontend:  c.other_user_name    →  Backend: c.doctor_name
Frontend:  c.unread_count       →  Backend: c.message_count
```

- Doctor name shows 'Unknown' for all conversations
- Unread badge always 0

**Fixes**: `c.other_user_name` → `c.doctor_name`, `c.unread_count` → `c.message_count`

---

### 22. `src/pages/Payments.tsx` — ❌ BROKEN

| Call | Backend Returns | Frontend Accesses | Match |
|------|----------------|-------------------|-------|
| `GET /wallets/transactions` | `{ transactions }` | `walletData.transactions \|\| []` | ✅ |
| `GET /wallets/balance` | `{ balancePkr, heldPkr, ... }` (camelCase) | `walletBalance.balance_pkr`, `walletBalance.held_pkr` | ❌ |

**Bug**: Balance field naming — backend returns camelCase, frontend expects snake_case.

```
Frontend:  walletBalance.balance_pkr    →  Backend: walletBalance.balancePkr
Frontend:  walletBalance.held_pkr       →  Backend: walletBalance.heldPkr
```

Summary cards show Rs. 0 for escrow.

**Fix**: `walletBalance.balance_pkr` → `walletBalance.balancePkr`, `walletBalance.held_pkr` → `walletBalance.heldPkr`

---

### 23. `src/pages/Ratings.tsx` — ✅ OK

| Call | Backend Returns | Frontend Accesses | Match |
|------|----------------|-------------------|-------|
| `GET /bookings?status=completed` | `{ bookings }` | `bookingsData.bookings \|\| []` | ✅ |
| `GET /ratings?limit=100` | `{ ratings }` | `ratingsData.ratings \|\| []` | ✅ |

Extra fields sent in `POST /ratings` (`ratedUserId`, `tags`) — harmless, ignored by backend.

---

### 24. `src/pages/Settings.tsx` (facility) — ❌ BROKEN (2 bugs)

| Call | Backend Returns | Frontend Accesses | Match |
|------|----------------|-------------------|-------|
| `GET /users/profile` | `{ ..., profile: { name, registration_number } }` | `data.profile?.facility_name` | ❌ |
| `GET /facilities/locations` | **ROUTE DOES NOT EXIST** | — | ❌ |

**Bug 1**: Facility profile field name mismatch.

The `facility_accounts` table stores the facility name as `name`, not `facility_name`.

```
Frontend:  data.profile?.facility_name   →  undefined  (should be data.profile?.name)
```

Facility name input shows empty.

**Bug 2**: `GET /facilities/locations` is not a defined route.

Facilities router has: `GET /`, `GET /:id`, `POST /locations`, `PUT /locations/:id`.  
Request matches `GET /:id` with `id = 'locations'` → queries for facility with UUID 'locations' → 404.

**Fixes**:
1. `data.profile?.facility_name` → `data.profile?.name`
2. Add a `GET /facilities/locations` route to backend, OR use `GET /users/profile` which already includes `.profile.locations` for facility_admin users

---

### 25. `src/pages/Login.tsx` — ✅ OK

Uses AuthContext (`login`, `register`). AuthContext correctly accesses `data.accessToken`, `data.refreshToken`, `data.user.*` from login, and `data.id`, `data.phone`, `data.role` from `/auth/me`.

---

## Missing Backend Routes

| Route | Called By | Status |
|-------|----------|--------|
| `POST /attendance/presence-ping` | `doctor/Attendance.tsx` | **Not implemented** |
| `GET /facilities/locations` | `Settings.tsx` (facility) | **Not implemented** (matches `/:id` with id='locations' → 404) |

---

## Priority Fix List

### P0 — Completely broken functionality (returns 400/404)

| # | File | Bug | Impact |
|---|------|-----|--------|
| 1 | `doctor/Attendance.tsx` | Body keys `booking_id`→`bookingId`, `qr_token`→`qrCode` | Check-in/check-out returns 400 |
| 2 | `doctor/Attendance.tsx` | `POST /attendance/presence-ping` does not exist | Returns 404 |
| 3 | `doctor/Wallet.tsx` | Payout sends `{ amount }` instead of `{ amountPkr }` | Returns 400 |
| 4 | `Settings.tsx` (facility) | `GET /facilities/locations` route doesn't exist | Returns 404 |

### P1 — All data shows zero/empty (wrong field names)

| # | File | Bug | Impact |
|---|------|-----|--------|
| 5 | `doctor/Wallet.tsx` | Balance: `available`→`availablePkr`, `escrow`→`heldPkr`, etc. | All balances Rs. 0 |
| 6 | `doctor/Wallet.tsx` | Transactions: `t.amount`→`t.amount_pkr` | All amounts Rs. 0 |
| 7 | `doctor/Profile.tsx` | Fields at wrong level: `p.full_name`→`p.profile?.full_name` | Form all empty |
| 8 | `Payments.tsx` (facility) | `balance_pkr`→`balancePkr`, `held_pkr`→`heldPkr` | Summary Rs. 0 |
| 9 | `Settings.tsx` (facility) | `facility_name`→`name` on profile | Name empty |

### P2 — Feature data not displayed (field mismatches)

| # | File | Bug | Impact |
|---|------|-----|--------|
| 10 | `doctor/BookingDetails.tsx` | `attendance_events`→`attendanceEvents` | Timeline empty |
| 11 | `doctor/ShiftDetails.tsx` | `required_skills`→`skills` | Skills never shown |
| 12 | `doctor/Attendance.tsx` | `bookingDetail?.booking?.attendance_events`→`bookingDetail?.attendanceEvents` | State detection fails |
| 13 | `BookingDetails.tsx` (facility) | `e.type`→`e.event_type` | Timeline check-in/out always '--' |
| 14 | `ShiftDetails.tsx` (facility) | `required_skills`→`skills` | Skills never shown |
| 15 | `AttendanceDetails.tsx` | `e.type`→`e.event_type` | Times always '--' |
| 16 | `AttendanceDetails.tsx` | `geo_verified`→`geo_valid`, `qr_verified`→`qr_valid` | Always 'Not Verified' |
| 17 | `DisputeDetails.tsx` | `respondent_name` not in response | Always 'Unknown Doctor' |
| 18 | `DisputeDetails.tsx` | `geo_verified`/`qr_verified` not top-level | Always 'Not Verified' |
| 19 | `Messages.tsx` (facility) | `other_user_name`→`doctor_name` | Always 'Unknown' |
| 20 | `Messages.tsx` (facility) | `unread_count`→`message_count` | Badge always 0 |
| 21 | `Messages.tsx` (doctor) | `other_party_name`/`facility_name` missing | Always 'Facility' |
| 22 | `Messages.tsx` (doctor) | `unread_count`→`message_count` | Badge always 0 |

### P3 — Behavioral / minor

| # | File | Bug | Impact |
|---|------|-----|--------|
| 23 | `doctor/ShiftDetails.tsx` | `allow_counter`→`counter_offer_allowed` | Counter always enabled |
| 24 | `doctor/Messages.tsx` | `context`/`booking_title`→`shift_title` | Shows 'Booking' not title |
| 25 | Multiple pages | `facility_name` not in shift detail response | Shows 'Facility' |
