import test from 'node:test';
import assert from 'node:assert/strict';
import { enrichAnonymousSectorBenchmark } from '../domain/benchmarkReadiness.js';

test('benchmark readiness abstains without observed outcomes and forbids market claims', () => {
  const result = enrichAnonymousSectorBenchmark({ totals: { completedOutcomes: 0 }, sectors: [] });
  assert.equal(result.readiness.status, 'abstain_no_observed_outcomes');
  assert.equal(result.evidencePolicy.marketClaimAllowed, false);
});

test('benchmark readiness labels published cohorts as local descriptive only', () => {
  const result = enrichAnonymousSectorBenchmark({ totals: { completedOutcomes: 4 }, sectors: [{ vertical: 'maritime', cohortSize: 4, meanAbsoluteForecastErrorPct: 12, completedOutcomes: 4 }, { vertical: 'withheld', cohortSize: 0, status: 'abstain_insufficient_cohort' }] });
  assert.equal(result.readiness.status, 'local_descriptive_only');
  assert.equal(result.sectors[0].evidenceClass, 'observed_local_outcome');
  assert.equal(result.sectors[0].marketClaimAllowed, false);
  assert.equal(result.sectors[1].evidenceClass, 'withheld');
});
