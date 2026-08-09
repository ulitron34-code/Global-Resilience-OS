import test from 'node:test';
import assert from 'node:assert/strict';
import { buildHistoricalBenchmarkPlan } from '../domain/benchmarkPlan.js';

const fixture = (id) => ({
  id,
  eventDate: '2025-01-01T00:00:00.000Z',
  observedImpactUsd: 100,
  predictedImpactUsd: 90,
  sourceId: 'licensed-source',
  provenance: 'authorized-record',
  assetId: 'asset-1',
  durationHours: 24,
  alternateRoutes: ['route-alt'],
  recoveryOutcome: 'recovered',
  evidenceStatus: 'complete',
});

test('benchmark plan keeps the 10-event target explicit without fabricating fixtures', () => {
  const plan = buildHistoricalBenchmarkPlan([]);
  assert.equal(plan.targetEventCount, 10);
  assert.equal(plan.minimumBacktestEventCount, 3);
  assert.equal(plan.remainingTargetSlots, 10);
  assert.equal(plan.status, 'insufficient_sample');
  assert.equal(plan.gates.productionClaim, 'abstain_until_licensed_review');
  assert.deepEqual(plan.filledEvents, []);
});

test('benchmark plan exposes only eligible historical events and reports remaining slots', () => {
  const plan = buildHistoricalBenchmarkPlan([fixture('hist-1'), { ...fixture('demo-1'), sourceId: 'demo-source' }]);
  assert.equal(plan.inputFixtureCount, 2);
  assert.equal(plan.eligibleEventCount, 1);
  assert.equal(plan.remainingTargetSlots, 9);
  assert.deepEqual(plan.filledEvents.map((item) => item.id), ['hist-1']);
  assert.equal(plan.gates.initialBacktest, 'abstain_insufficient_sample');
});
