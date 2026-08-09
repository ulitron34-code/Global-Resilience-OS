import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBatchInput } from '../domain/batchIngestion.js';

const license = { contractRef: 'contract-001', territory: ['global'], allowedFields: ['externalId'], retentionDays: 365, redistribution: 'internal_only', attribution: 'Provider', renewalContact: 'legal@example.com' };
const event = { externalId: 'batch-001', sourceId: 'provider-live', eventType: 'ais_gap', title: 'Authorized signal', severity: 'medium', impactUsd: 100, provenance: { licenseRef: 'contract-001' } };

test('production batch rejects an illustrative source even with active metadata', () => {
  const result = validateBatchInput({ mode: 'dry_run', events: [{ ...event, sourceId: 'provider-demo' }] }, [{ id: 'provider-demo', status: 'connected', licenseStatus: 'active' }], { production: true, catalog: [{ id: 'provider-demo', coverage: 'illustrative_events', licenseStatus: 'active', license }] });
  assert.equal(result.readyToCommit, false);
  assert.match(result.items[0].error, /no apta para producción/);
});

test('production batch accepts a connected productive source with complete license metadata', () => {
  const result = validateBatchInput({ mode: 'dry_run', events: [event] }, [{ id: 'provider-live', status: 'connected', licenseStatus: 'active' }], { production: true, catalog: [{ id: 'provider-live', coverage: 'authorized_events', licenseStatus: 'active', license }] });
  assert.equal(result.readyToCommit, true);
  assert.equal(result.items[0].status, 'valid');
});
