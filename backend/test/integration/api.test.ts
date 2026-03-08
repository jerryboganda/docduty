import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { loadTestApp, shutdownTestApp } from '../helpers/testApp.ts';

let app: any;

before(async () => {
  app = await loadTestApp();
});

after(async () => {
  await shutdownTestApp();
});

describe('API integration smoke', () => {
  it('serves health endpoint', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
  });

  it('supports seeded user login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ phone: '03111111111', password: 'test123' });

    assert.equal(res.status, 200);
    assert.equal(typeof res.body.accessToken, 'string');
    assert.equal(res.body.user.role, 'doctor');
  });

  it('enforces RBAC on admin endpoint for doctor', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ phone: '03111111111', password: 'test123' });

    const token = login.body.accessToken;
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 403);
  });

  it('supports facility settings endpoints', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ phone: '03001234567', password: 'test123' });

    const token = login.body.accessToken;
    const prefs = await request(app)
      .get('/api/users/preferences')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(prefs.status, 200);

    const locations = await request(app)
      .get('/api/facilities/locations')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(locations.status, 200);
    assert.equal(Array.isArray(locations.body.locations), true);
  });

  it('accepts public contact submissions', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({
        name: 'Integration Test User',
        email: 'integration@example.com',
        subject: 'Website contact',
        message: 'Please call me back.',
      });

    assert.equal(res.status, 201);
    assert.equal(typeof res.body.id, 'string');
  });
});
