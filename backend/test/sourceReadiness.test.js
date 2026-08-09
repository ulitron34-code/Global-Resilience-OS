import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateProductiveSource } from '../domain/sourceReadiness.js';

const license = {
  contractRef: 'contract-001',
  territory: ['global'],
  allowedFields: ['externalId'],
  retentionDays: 365,
  redistribution: 'internal_only',
  attribution: 'Provider',
  renewalContact: 'legal@example.com',
};

test('source readiness rejects illustrative production feeds', () => {
  const result = evaluateProductiveSource(
    { id: 'provider-demo', status: 'connected', licenseStatus: 'active', license },
    { id: 'provider-demo', coverage: 'illustrative_events' },
  );
  assert.equal(result.ready, false);
  assert.equal(result.checks.nonIllustrative, false);
  assert.ok(result.reasons.includes('nonIllustrative'));
});

test('source readiness accepts a connected productive feed', () => {
  const result = evaluateProductiveSource(
    { id: 'provider-live', status: 'connected', licenseStatus: 'active', license },
    { id: 'provider-live', coverage: 'authorized_events' },
  );
  assert.equal(result.ready, true);
  assert.deepEqual(result.reasons, []);
});
