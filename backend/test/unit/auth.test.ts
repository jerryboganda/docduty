import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../server/middleware/auth.js';

describe('auth token helpers', () => {
  const payload = { userId: 'u1', role: 'doctor' as const, phone: '03001234567' };

  it('generates an access token', () => {
    const token = generateAccessToken(payload);
    assert.equal(typeof token, 'string');
    assert.equal(token.split('.').length, 3);
  });

  it('round-trips refresh token payload', () => {
    const refresh = generateRefreshToken(payload);
    const decoded = verifyRefreshToken(refresh);
    assert.equal(decoded.userId, payload.userId);
    assert.equal(decoded.role, payload.role);
    assert.equal(decoded.phone, payload.phone);
  });
});
