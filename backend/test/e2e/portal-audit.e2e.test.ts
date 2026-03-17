import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { loadTestApp, shutdownTestApp } from '../helpers/testApp.ts';
import { getDb } from '../../server/database/schema.js';

let app: any;
let http: ReturnType<typeof request>;

type LoginCreds = { phone: string; password: string };
type Session = { token: string; userId: string };
type ShiftBookingContext = {
  doctor: Session;
  bookingId: string;
  shiftId: string;
  locationId: string;
  latitude: number;
  longitude: number;
};

type ShiftOptions = {
  startOffsetMinutes?: number;
  durationMinutes?: number;
};

const sessionCache = new Map<string, Session>();

const creds = {
  doctor1: { phone: '03111111111', password: 'test123' } satisfies LoginCreds,
  doctor2: { phone: '03222222222', password: 'test123' } satisfies LoginCreds,
  facility1: { phone: '03001234567', password: 'test123' } satisfies LoginCreds,
  facility2: { phone: '03009876543', password: 'test123' } satisfies LoginCreds,
  admin: { phone: '03000000000', password: 'test123' } satisfies LoginCreds,
};

async function login(c: LoginCreds): Promise<Session> {
  const cached = sessionCache.get(c.phone);
  if (cached) {
    return cached;
  }

  const res = await http.post('/api/auth/login').send(c);
  assert.equal(res.status, 200, `login failed for ${c.phone}`);
  const session = { token: res.body.accessToken, userId: res.body.user.id };
  sessionCache.set(c.phone, session);
  return session;
}

async function clearActiveDoctorBookings(doctors: Session[]): Promise<void> {
  if (doctors.length === 0) return;

  const db = getDb();
  const doctorIds = doctors.map((doctor) => doctor.userId);
  const placeholders = doctorIds.map(() => '?').join(', ');

  await db.prepare(`
    UPDATE bookings
    SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
    WHERE doctor_id IN (${placeholders})
      AND status IN ('confirmed', 'in_progress', 'disputed')
  `).run(...doctorIds);
}

async function createShiftAndAccept(
  doctors: Session[],
  facility: Session,
  options: ShiftOptions = {},
): Promise<ShiftBookingContext> {
  await clearActiveDoctorBookings(doctors);

  const locations = await http
    .get('/api/facilities/locations')
    .set('Authorization', `Bearer ${facility.token}`);
  assert.equal(locations.status, 200);
  assert.equal(Array.isArray(locations.body.locations), true);

  const location = locations.body.locations[0] as any;
  assert.equal(typeof location?.id, 'string');

  const locationId = location.id as string;
  const latitude = Number(location.latitude ?? 33.6844);
  const longitude = Number(location.longitude ?? 73.0479);

  const now = Date.now();
  const startOffsetMinutes = options.startOffsetMinutes ?? 10;
  const durationMinutes = options.durationMinutes ?? 5;
  const shiftStart = now + startOffsetMinutes * 60 * 1000;
  const shiftEnd = shiftStart + durationMinutes * 60 * 1000;
  const startTime = new Date(shiftStart).toISOString();
  const endTime = new Date(shiftEnd).toISOString();

  const postShift = await http
    .post('/api/shifts')
    .set('Authorization', `Bearer ${facility.token}`)
    .send({
      facilityLocationId: locationId,
      type: 'replacement',
      title: `E2E Workflow Shift ${now}`,
      startTime,
      endTime,
      totalPricePkr: 9000,
    });
  assert.equal(postShift.status, 201);

  const shiftId = postShift.body.id as string;
  assert.equal(typeof shiftId, 'string');

  let acceptedDoctor: Session | null = null;
  let bookingId = '';

  for (const doctor of doctors) {
    const accept = await http
      .post('/api/bookings/accept')
      .set('Authorization', `Bearer ${doctor.token}`)
      .send({ shiftId });

    if (accept.status === 201 && typeof accept.body.bookingId === 'string') {
      acceptedDoctor = doctor;
      bookingId = accept.body.bookingId;
      break;
    }

    const errorText = String(accept.body?.error || '').toLowerCase();
    const isConflict = accept.status === 409 || errorText.includes('conflicting booking');
    if (!isConflict) {
      assert.equal(accept.status, 201, `accept failed unexpectedly: ${accept.body?.error || 'unknown error'}`);
    }
  }

  assert.notEqual(acceptedDoctor, null, 'No available doctor could accept shift due conflicts');

  return {
    doctor: acceptedDoctor as Session,
    bookingId,
    shiftId,
    locationId,
    latitude,
    longitude,
  };
}

before(async () => {
  app = await loadTestApp();
  http = request(app);
});

after(async () => {
  await shutdownTestApp();
});

describe('E2E portal audit (API journeys)', () => {
  it('doctor, facility, admin core endpoints are reachable', async () => {
    const doctor = await login(creds.doctor1);
    const facility = await login(creds.facility1);
    const admin = await login(creds.admin);

    const doctorFeed = await http
      .get('/api/shifts/feed')
      .set('Authorization', `Bearer ${doctor.token}`);
    assert.equal(doctorFeed.status, 200);

    const doctorWallet = await http
      .get('/api/wallets/balance')
      .set('Authorization', `Bearer ${doctor.token}`);
    assert.equal(doctorWallet.status, 200);

    const facilityDash = await http
      .get('/api/bookings')
      .set('Authorization', `Bearer ${facility.token}`);
    assert.equal(facilityDash.status, 200);

    const facilityLocations = await http
      .get('/api/facilities/locations')
      .set('Authorization', `Bearer ${facility.token}`);
    assert.equal(facilityLocations.status, 200);

    const adminDash = await http
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${admin.token}`);
    assert.equal(adminDash.status, 200);

    const adminUsers = await http
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${admin.token}`);
    assert.equal(adminUsers.status, 200);

    const adminFacilities = await http
      .get('/api/admin/facilities')
      .set('Authorization', `Bearer ${admin.token}`);
    assert.equal(adminFacilities.status, 200);
  });

  it('enforces RBAC and object-level boundaries', async () => {
    const doctor = await login(creds.doctor1);
    const doctorOther = await login(creds.doctor2);
    const facility = await login(creds.facility1);
    const facilityOther = await login(creds.facility2);

    const adminDeny = await http
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${doctor.token}`);
    assert.equal(adminDeny.status, 403);

    const facilityLocationsDeny = await http
      .get('/api/facilities/locations')
      .set('Authorization', `Bearer ${doctor.token}`);
    assert.equal(facilityLocationsDeny.status, 403);

    // Create a shift as facility1 then accept by doctor1 to get a fresh booking.
    const locations = await http
      .get('/api/facilities/locations')
      .set('Authorization', `Bearer ${facility.token}`);
    assert.equal(locations.status, 200);
    assert.equal(Array.isArray(locations.body.locations), true);
    const locationId = locations.body.locations[0]?.id as string;
    assert.equal(typeof locationId, 'string');

    const now = Date.now();
    const uniqueOffsetHours = 24 * 30 + (now % (24 * 14));
    const shiftStart = now + uniqueOffsetHours * 60 * 60 * 1000;
    const startTime = new Date(shiftStart).toISOString();
    const endTime = new Date(shiftStart + 8 * 60 * 60 * 1000).toISOString();

    const postShift = await http
      .post('/api/shifts')
      .set('Authorization', `Bearer ${facility.token}`)
      .send({
        facilityLocationId: locationId,
        type: 'replacement',
        title: `E2E Shift ${now}`,
        startTime,
        endTime,
        totalPricePkr: 9000,
      });
    assert.equal(postShift.status, 201);

    const flow = await createShiftAndAccept([doctor, doctorOther], facility, {
      startOffsetMinutes: 24 * 60,
      durationMinutes: 30,
    });
    const outsiderDoctor = flow.doctor.userId === doctor.userId ? doctorOther : doctor;

    // Another doctor must not access this booking.
    const bookingDeny = await http
      .get(`/api/bookings/${flow.bookingId}`)
      .set('Authorization', `Bearer ${outsiderDoctor.token}`);
    assert.equal(bookingDeny.status, 403);

    // Other facility must not rotate QR for facility1 location.
    const rotateDeny = await http
      .post(`/api/facilities/locations/${locationId}/rotate-qr`)
      .set('Authorization', `Bearer ${facilityOther.token}`);
    assert.equal(rotateDeny.status, 403);
  });

  it('completes attendance lifecycle with geofence and QR validation', async () => {
    const doctor = await login(creds.doctor1);
    const doctorOther = await login(creds.doctor2);
    const facility = await login(creds.facility1);

    const flow = await createShiftAndAccept([doctor, doctorOther], facility, {
      startOffsetMinutes: 1,
      durationMinutes: 5,
    });

    const qrRes = await http
      .get(`/api/facilities/locations/${flow.locationId}/qr-code`)
      .set('Authorization', `Bearer ${facility.token}`);
    assert.equal(qrRes.status, 200);
    assert.equal(typeof qrRes.body.qrCode, 'string');

    const checkIn = await http
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${flow.doctor.token}`)
      .send({
        bookingId: flow.bookingId,
        latitude: flow.latitude,
        longitude: flow.longitude,
        qrCode: qrRes.body.qrCode,
      });
    assert.equal(checkIn.status, 200, `check-in failed: ${checkIn.body?.error || 'unknown error'}`);
    assert.equal(checkIn.body.geoValid, true);
    assert.equal(checkIn.body.qrValid, true);

    const checkOut = await http
      .post('/api/attendance/check-out')
      .set('Authorization', `Bearer ${flow.doctor.token}`)
      .send({
        bookingId: flow.bookingId,
        latitude: flow.latitude,
        longitude: flow.longitude,
        qrCode: qrRes.body.qrCode,
      });
    assert.equal(checkOut.status, 200);

    const attendance = await http
      .get(`/api/attendance/${flow.bookingId}`)
      .set('Authorization', `Bearer ${flow.doctor.token}`);
    assert.equal(attendance.status, 200);
    assert.equal(Array.isArray(attendance.body.events), true);

    const eventTypes = (attendance.body.events as any[]).map((event) => event.event_type);
    assert.equal(eventTypes.includes('check_in'), true);
    assert.equal(eventTypes.includes('check_out'), true);

    const bookingDetail = await http
      .get(`/api/bookings/${flow.bookingId}`)
      .set('Authorization', `Bearer ${facility.token}`);
    assert.equal(bookingDetail.status, 200);
    assert.equal(bookingDetail.body.status, 'completed');
  });

  it('supports doctor payout request and payout history after admin deposit', async () => {
    const doctor = await login(creds.doctor1);
    const admin = await login(creds.admin);

    const deposit = await http
      .post('/api/wallets/deposit')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ targetUserId: doctor.userId, amountPkr: 5000, reference: 'e2e-payout-seed' });
    assert.equal(deposit.status, 200);

    const balance = await http
      .get('/api/wallets/balance')
      .set('Authorization', `Bearer ${doctor.token}`);
    assert.equal(balance.status, 200);
    assert.equal(typeof balance.body.availablePkr, 'number');
    assert.equal(balance.body.availablePkr >= 1000, true);

    const payout = await http
      .post('/api/wallets/payout')
      .set('Authorization', `Bearer ${doctor.token}`)
      .send({ amountPkr: 1000, paymentMethod: 'bank_transfer' });
    assert.equal(payout.status, 200);
    assert.equal(payout.body.status, 'pending');

    const payouts = await http
      .get('/api/wallets/payouts')
      .set('Authorization', `Bearer ${doctor.token}`);
    assert.equal(payouts.status, 200);
    assert.equal(Array.isArray(payouts.body.payouts), true);
    assert.equal(payouts.body.payouts.some((entry: any) => entry.id === payout.body.payoutId), true);
  });

  it('supports dispute review and resolution across facility and admin roles', async () => {
    const doctor = await login(creds.doctor1);
    const doctorOther = await login(creds.doctor2);
    const facility = await login(creds.facility1);
    const admin = await login(creds.admin);

    const flow = await createShiftAndAccept([doctor, doctorOther], facility, {
      startOffsetMinutes: 24 * 60,
      durationMinutes: 30,
    });

    const dispute = await http
      .post('/api/disputes')
      .set('Authorization', `Bearer ${facility.token}`)
      .send({
        bookingId: flow.bookingId,
        type: 'other',
        description: 'E2E dispute workflow validation',
      });
    assert.equal(dispute.status, 201);
    assert.equal(typeof dispute.body.disputeId, 'string');

    const review = await http
      .put(`/api/disputes/${dispute.body.disputeId}/review`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({});
    assert.equal(review.status, 200);

    const resolve = await http
      .put(`/api/disputes/${dispute.body.disputeId}/resolve`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        resolutionType: 'dismissed',
        resolutionNotes: 'No action required after review',
      });
    assert.equal(resolve.status, 200);

    const detailForDoctor = await http
      .get(`/api/disputes/${dispute.body.disputeId}`)
      .set('Authorization', `Bearer ${flow.doctor.token}`);
    assert.equal(detailForDoctor.status, 200);
    assert.equal(detailForDoctor.body.status, 'dismissed');

    const bookingDetail = await http
      .get(`/api/bookings/${flow.bookingId}`)
      .set('Authorization', `Bearer ${facility.token}`);
    assert.equal(bookingDetail.status, 200);
    assert.equal(bookingDetail.body.status, 'resolved');
  });
});
