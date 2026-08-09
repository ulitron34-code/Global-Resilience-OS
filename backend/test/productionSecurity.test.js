import test from 'node:test';
import assert from 'node:assert/strict';
import { listUsers, login } from '../auth/auth.js';

test('production mode blocks demo login and demo user listing', () => {
  const previous = process.env.APP_MODE;
  process.env.APP_MODE = 'production';
  try {
    assert.equal(login('admin@resilience.local', 'demo123'), null);
    assert.deepEqual(listUsers(), []);
  } finally {
    if (previous === undefined) delete process.env.APP_MODE;
    else process.env.APP_MODE = previous;
  }
});
