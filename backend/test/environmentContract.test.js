import test from 'node:test';
import assert from 'node:assert/strict';
import { getEnvironmentContract } from '../config/environmentContract.js';

test('environment contract accepts safe demo configuration', () => {
  const result = getEnvironmentContract({ APP_MODE: 'demo', DATA_MODE: 'illustrative', AUTH_REQUIRED: 'false', ALLOW_EXTERNAL_ACTIONS: 'false' });
  assert.equal(result.ready, true);
  assert.equal(result.checks.find((item) => item.id === 'external_actions').pass, true);
});

test('environment contract rejects incomplete production configuration', () => {
  const result = getEnvironmentContract({ APP_MODE: 'production', DATA_MODE: 'illustrative', AUTH_REQUIRED: 'false', ALLOW_EXTERNAL_ACTIONS: 'false' });
  assert.equal(result.ready, false);
  assert.equal(result.checks.find((item) => item.id === 'auth').pass, false);
  assert.equal(result.checks.find((item) => item.id === 'data').pass, false);
});

test('environment contract accepts production controls without exposing secrets', () => {
  const result = getEnvironmentContract({ APP_MODE: 'production', DATA_MODE: 'licensed', AUTH_REQUIRED: 'true', AUTH_SECRET: 'x'.repeat(48), CORS_ORIGIN: 'https://app.example', ALLOW_EXTERNAL_ACTIONS: 'false', DATA_FILE: 'postgres' });
  assert.equal(result.ready, true);
  assert.equal(JSON.stringify(result).includes('xxxx'), false);
  assert.equal(result.checks.find((item) => item.id === 'auth').evidence, 'AUTH_REQUIRED + secret >= 32');
});
