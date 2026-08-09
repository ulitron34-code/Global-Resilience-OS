import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPilotMetrics, buildPilotReadiness } from '../domain/pilotKit.js';

const technicalInputs = {
  runtime: { ready: true },
  catalog: { ready: true },
  sourceHealth: { sources: [{ id: 'licensed-source', health: 'healthy' }] },
  modelGovernance: [{ decision: 'abstain_for_production' }],
  actionLibrary: { ready: true },
  tenancy: { organizationId: 'org-test' },
};

test('pilot readiness remains blocked without customer and historical evidence', () => {
  const result = buildPilotReadiness(technicalInputs);
  assert.equal(result.technicalReady, true);
  assert.equal(result.customerReady, false);
  assert.deepEqual(result.evidenceCounts, { interviews: 0, customerReviews: 0, verifiedHistoricalEvents: 0 });
});

test('pilot readiness can open the customer gate only with explicit evidence', () => {
  const result = buildPilotReadiness({
    ...technicalInputs,
    pilotFeedback: [{ stage: 'pilot_review', evidence: 'Cliente confirmó el criterio de éxito.' }],
    historicalFixtures: [
      { id: 'evt-1', sourceId: 'licensed-ais', provenance: 'contract-1', evidenceStatus: 'complete' },
      { id: 'evt-2', sourceId: 'licensed-cables', provenance: 'contract-2', evidenceStatus: 'complete' },
      { id: 'evt-3', sourceId: 'licensed-ports', provenance: 'contract-3', evidenceStatus: 'complete' },
    ],
  });
  assert.equal(result.customerReady, true);
  assert.equal(result.status, 'customer_ready_for_gate_review');
  assert.equal(result.evidenceCounts.verifiedHistoricalEvents, 3);
});

test('demo fixtures never count as authorized historical evidence', () => {
  const result = buildPilotReadiness({
    ...technicalInputs,
    pilotFeedback: [{ stage: 'pilot_review', evidence: 'Review documentada.' }],
    historicalFixtures: [
      { id: 'evt-1', sourceId: 'ais-demo', provenance: 'demo', evidenceStatus: 'complete' },
      { id: 'evt-2', sourceId: 'cables-demo', provenance: 'demo', evidenceStatus: 'complete' },
      { id: 'evt-3', sourceId: 'ports-demo', provenance: 'demo', evidenceStatus: 'complete' },
    ],
  });
  assert.equal(result.customerReady, false);
  assert.equal(result.evidenceCounts.verifiedHistoricalEvents, 0);
});

test('pilot readiness excludes incomplete historical fixtures', () => {
  const result = buildPilotReadiness({
    ...technicalInputs,
    pilotFeedback: [{ stage: 'pilot_review', evidence: 'Review documentada.' }],
    historicalFixtures: [
      { id: 'evt-incomplete', sourceId: 'licensed-ais', provenance: 'contract-1', evidenceStatus: 'incomplete' },
      { id: 'evt-complete', sourceId: 'licensed-ais', provenance: 'contract-1', evidenceStatus: 'complete' },
    ],
  });
  assert.equal(result.evidenceCounts.verifiedHistoricalEvents, 1);
  assert.equal(result.customerReady, false);
});

test('demo sources never count as productive pilot coverage', () => {
  const result = buildPilotMetrics({ sourceHealth: { sources: [{ id: 'ais-demo', health: 'demo' }, { id: 'licensed-source', health: 'healthy' }] } });
  assert.equal(result.metrics.sourceCoverage, 0.5);
  assert.equal(result.metrics.illustrativeSourceCount, 1);
  assert.match(result.definitions.sourceCoverage, /demo no cuenta/);
  assert.ok(result.missingEvidence.includes('fuentes productivas licenciadas'));
});
