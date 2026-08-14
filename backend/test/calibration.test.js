import test from 'node:test';
import assert from 'node:assert/strict';
import { getCalibrationOverview, recordCalibrationFixtures } from '../domain/store.js';

test('conserva fixtures incompletas pero las excluye de métricas de calibración', () => {
  const suffix = Date.now();
  const modelId = 'alert-correlation';
  const result = recordCalibrationFixtures({
    modelId,
    fixtures: [{
      id: `incomplete-${suffix}`,
      eventDate: '2024-02-01',
      observedImpactUsd: 200,
      predictedImpactUsd: 250,
      sourceId: 'historical-authorized',
      provenance: 'partial-record'
    }]
  });
  const fixture = result.overview.fixtures.find((item) => item.id === `incomplete-${suffix}`);
  assert.equal(fixture.evidenceStatus, 'incomplete');
  assert.ok(fixture.missingEvidence.includes('assetId'));
  assert.equal(result.overview.completeFixtureCount, 0);
  assert.equal(result.overview.incompleteFixtureCount, 1);
  assert.equal(result.overview.metrics.maeUsd, null);
});

test('marca fixture completa cuando conserva la cadena histórica mínima', () => {
  const suffix = Date.now();
  const modelId = 'alert-correlation';
  const result = recordCalibrationFixtures({
    modelId,
    fixtures: [{
      id: `complete-${suffix}`,
      eventDate: '2024-03-01',
      observedImpactUsd: 200,
      predictedImpactUsd: 220,
      sourceId: 'historical-authorized',
      provenance: 'verified-event',
      assetId: 'cable-hist-002',
      durationHours: 48,
      alternateRoutes: ['route-alt-1'],
      recoveryOutcome: 'Recovered'
    }]
  });
  const fixture = result.overview.fixtures.find((item) => item.id === `complete-${suffix}`);
  assert.equal(fixture.evidenceStatus, 'complete');
  assert.deepEqual(fixture.missingEvidence, []);
  assert.equal(result.overview.completeFixtureCount, 1);
  assert.equal(result.overview.metrics.maeUsd, 20);
  assert.equal(getCalibrationOverview(modelId).completeFixtureCount >= 1, true);
});

test('calibracion expone fixtures ilustrativas excluidas', () => {
  const suffix = Date.now();
  const result = recordCalibrationFixtures({
    modelId: 'impact-cascade',
    fixtures: [{
      id: `demo-complete-${suffix}`,
      eventDate: '2024-04-01',
      observedImpactUsd: 100,
      predictedImpactUsd: 110,
      sourceId: 'ais-demo',
      provenance: 'demo-event',
      assetId: 'demo-asset',
      durationHours: 12,
      alternateRoutes: ['demo-route'],
      recoveryOutcome: 'Illustrative'
    }]
  });
  assert.ok(result.overview.completeFixtureCount >= 0);
  assert.ok(result.overview.excludedIllustrativeFixtureCount >= 1);
  assert.equal(result.overview.fixtures.find((item) => item.id === `demo-complete-${suffix}`).evidenceStatus, 'complete');
});
