import test from 'node:test';
import assert from 'node:assert/strict';
import { isIllustrativeSource, isProductiveConnectedSource } from '../domain/sourceClassification.js';
import { buildOperationalScorecard } from '../domain/operationalScorecard.js';

test('clasifica como ilustrativa una fuente demo aunque el id parezca productivo', () => {
  assert.equal(isIllustrativeSource({ id: 'provider-001', status: 'demo' }), true);
  assert.equal(isIllustrativeSource({ id: 'provider-001', coverage: 'illustrative_global' }), true);
  assert.equal(isIllustrativeSource({ sourceId: 'provider-001', coverage: 'illustrative_routes' }), true);
  assert.equal(isProductiveConnectedSource({ id: 'provider-001', status: 'demo' }), false);
  assert.equal(isProductiveConnectedSource({ id: 'provider-001', status: 'connected', name: 'Licensed feed' }), true);
});

test('scorecard no cuenta una fuente marcada demo como productiva', () => {
  const scorecard = buildOperationalScorecard({
    sources: [
      { id: 'provider-001', status: 'demo' },
      { id: 'licensed-001', status: 'connected' },
    ],
  });
  assert.equal(scorecard.product.sources.freshOrHealthy, 1);
  assert.equal(scorecard.product.sources.readinessRate, 0.5);
});
