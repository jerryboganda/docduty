import assert from 'node:assert/strict';

async function run() {
  const base = process.env.E2E_BASE_URL || 'http://localhost:3001';

  const healthRes = await fetch(`${base}/api/health`);
  assert.equal(healthRes.status, 200, 'health endpoint should be reachable');

  const doctorLogin = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ phone: '03111111111', password: 'test123' }),
  });
  assert.equal(doctorLogin.status, 200, 'doctor login should succeed');
  const doctorBody = await doctorLogin.json();

  const adminGuard = await fetch(`${base}/api/admin/dashboard`, {
    headers: { authorization: `Bearer ${doctorBody.accessToken}` },
  });
  assert.equal(adminGuard.status, 403, 'doctor must be blocked from admin dashboard');

  console.log('E2E smoke passed');
}

run().catch((err) => {
  console.error('E2E smoke failed:', err.message);
  process.exit(1);
});
