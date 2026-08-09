import test from 'node:test';
import assert from 'node:assert/strict';
import { benchmarkCalibration } from '../domain/calibrationBenchmark.js';
import { buildBacktestReport } from '../domain/backtesting.js';

test('excluye fixtures completas basadas en fuentes demo de calibracion y backtesting', () => {
  const demo = {
    id: 'demo-fixture', evidenceStatus: 'complete', sourceId: 'ais-demo', provenance: 'verified-event',
    observedImpactUsd: 100, predictedImpactUsd: 90
  };
  const authorized = { ...demo, id: 'authorized-fixture', sourceId: 'historical-authorized' };
  assert.equal(benchmarkCalibration({ fixtures: [demo, authorized] }).fixtureCount, 1);
  assert.equal(buildBacktestReport([demo, authorized]).sample.eligible, 1);
});
