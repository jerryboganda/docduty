import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { loadTestApp, shutdownTestApp } from '../helpers/testApp.ts';

let app: any;
let http: ReturnType<typeof request>;

type LoginCreds = { phone: string; password: string };
type Session = { token: string; userId: string };

const creds = {
  doctor1: { phone: '03111111111', password: 'test123' } satisfies LoginCreds,
  doctor2: { phone: '03222222222', password: 'test123' } satisfies LoginCreds,
  facility1: { phone: '03001234567', password: 'test123' } satisfies LoginCreds,
  facility2: { phone: '03009876543', password: 'test123' } satisfies LoginCreds,
  admin: { phone: '03000000000', password: 'test123' } satisfies LoginCreds,
};

async function login(c: LoginCreds): Promise<Session> {
  const res = await http.post('/api/auth/login').send(c);
  assert.equal(res.status, 200, `login failed for ${c.phone}`);
  return { token: res.body.accessToken, userId: res.body.user.id };
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

    const shiftId = postShift.body.id as string;
    assert.equal(typeof shiftId, 'string');

    const accept = await http
      .post('/api/bookings/accept')
      .set('Authorization', `Bearer ${doctor.token}`)
      .send({ shiftId });
    assert.equal(accept.status, 201);

    const bookingId = accept.body.bookingId as string;
    assert.equal(typeof bookingId, 'string');

    // Another doctor must not access this booking.
    const bookingDeny = await http
      .get(`/api/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${doctorOther.token}`);
    assert.equal(bookingDeny.status, 403);

    // Other facility must not rotate QR for facility1 location.
    const rotateDeny = await http
      .post(`/api/facilities/locations/${locationId}/rotate-qr`)
      .set('Authorization', `Bearer ${facilityOther.token}`);
    assert.equal(rotateDeny.status, 403);
  });
});
