import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCooperativeIncidentPreview } from '../domain/cooperativeNetwork.js';
import { verifyPackageIntegrity } from '../domain/packageIntegrity.js';

test('cooperative preview records consent evidence without sharing before review', () => {
  const preview = buildCooperativeIncidentPreview({
    alerts: [
      { severity: 'high', impactUsd: 100000, vertical: 'maritime', sourceIds: ['source-a'], payload: { observedAt: '2026-08-08T10:00:00Z' } },
      { severity: 'medium', impactUsd: 50000, vertical: 'maritime', sourceIds: ['source-b'], payload: { observedAt: '2026-08-08T11:00:00Z' } },
      { severity: 'low', impactUsd: 10000, vertical: 'energy', sourceIds: ['source-c'], payload: { observedAt: '2026-08-08T12:00:00Z' } },
    ],
    minCohort: 3,
    consent: true,
    consentActor: 'analyst@example.com',
    consentAt: '2026-08-08T13:00:00Z',
  });
  assert.equal(preview.status, 'ready_for_human_review');
  assert.equal(preview.sharedSignals.length, 3);
  assert.deepEqual(preview.consentEvidence, { purpose: 'cooperative_incident_preview', actor: 'analyst@example.com', recordedAt: '2026-08-08T13:00:00Z', scope: 'dry_run_only' });
  assert.equal(verifyPackageIntegrity(preview), true);
  assert.equal(Object.hasOwn(preview.sharedSignals[0], 'id'), false);
  assert.equal(Object.hasOwn(preview.sharedSignals[0], 'location'), false);
});
