import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validatePhone, validateUUID, sanitizeString } from '../../server/middleware/validation.js';

describe('validation helpers', () => {
  it('validates Pakistan phone numbers', () => {
    assert.equal(validatePhone('03001234567'), true);
    assert.equal(validatePhone('+923001234567'), true);
    assert.equal(validatePhone('923001234567'), false);
    assert.equal(validatePhone('12345'), false);
  });

  it('validates UUID format', () => {
    assert.equal(validateUUID('123e4567-e89b-12d3-a456-426614174000'), true);
    assert.equal(validateUUID('invalid-uuid'), false);
  });

  it('sanitizes angled brackets', () => {
    assert.equal(sanitizeString(' <hello> '), 'hello');
  });
});
