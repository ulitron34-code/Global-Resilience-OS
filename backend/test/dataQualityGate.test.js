import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateDataQuality, validateDataRecord } from '../domain/dataQualityGate.js';

const license = {
  contractRef: 'contract-001',
  territory: ['global'],
  allowedFields: ['externalId'],
  retentionDays: 365,
  redistribution: 'internal_only',
  attribution: 'Provider',
  renewalContact: 'legal@example.com',
};

test('data quality blocks an illustrative source even when its id looks productive', () => {
  const result = evaluateDataQuality({
    catalog: [{ id: 'provider-001', name: 'Provider', coverage: 'global_events', licenseStatus: 'active', refreshSlaHours: 24, license }],
    sources: [{ id: 'provider-001', sourceId: 'provider-001', status: 'demo', lastEventAt: new Date().toISOString() }],
  });
  const check = result.checks[0];
  assert.equal(check.status, 'abstain');
  assert.equal(check.sourceConnectionPass, false);
  assert.equal(check.coveragePass, false);
});

test('data quality accepts a connected productive source with fresh contractual data', () => {
  const result = evaluateDataQuality({
    catalog: [{ id: 'provider-002', name: 'Provider', coverage: 'global_events', licenseStatus: 'active', refreshSlaHours: 24, license }],
    sources: [{ id: 'provider-002', status: 'connected', latencySeconds: 5, lastEventAt: new Date().toISOString() }],
  });
  assert.equal(result.ready, true);
  assert.equal(result.checks[0].status, 'pass');
});

test('record validation abstains for an illustrative source despite active license metadata', () => {
  const result = validateDataRecord({ sourceId: 'provider-003', observedAt: new Date().toISOString(), confidence: 0.9, provenance: { licenseRef: 'contract-003' } }, { id: 'provider-003', status: 'demo', licenseStatus: 'active', refreshSlaHours: 24 });
  assert.equal(result.valid, false);
  assert.equal(result.checks.sourceClassification, false);
  assert.equal(result.decision, 'abstain');
});

test('quality gate can scope a material check to the plan sources', () => {
  const productive = { id: 'provider-live', name: 'Proveedor live', coverage: 'authorized_events', licenseStatus: 'active', refreshSlaHours: 24, license };
  const result = evaluateDataQuality({
    catalog: [
      { id: 'ais-demo', name: 'AIS demo', coverage: 'demo_events', licenseStatus: 'verification_required', license: {} },
      productive,
    ],
    sources: [{ ...productive, status: 'connected', lastEventAt: new Date().toISOString() }],
    requiredSourceIds: ['provider-live'],
  });
  assert.equal(result.scope, 'required_sources');
  assert.equal(result.ready, true);
  assert.deepEqual(result.requiredSourceIds, ['provider-live']);
});
