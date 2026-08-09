import test from 'node:test';
import assert from 'node:assert/strict';
import { getModelProfileReadiness, listModelProfiles } from '../domain/modelProfiles.js';

test('model profiles expose regional and vertical assumptions with production abstention', () => {
  const profile = listModelProfiles({ region: 'latin-america', vertical: 'semiconductores' });
  assert.equal(profile.region.id, 'latin-america');
  assert.equal(profile.vertical.id, 'semiconductores');
  assert.equal(profile.model.decision, 'abstain_for_production');
  assert.ok(profile.dataNeeds.includes('BOM afectado'));
});

test('unknown profile selection remains explicit and does not claim specialization', () => {
  const profile = listModelProfiles({ region: 'unknown-region', vertical: 'unknown-vertical' });
  assert.equal(profile.region.id, 'global');
  assert.equal(profile.vertical.id, 'unknown-vertical');
  assert.equal(getModelProfileReadiness().productionReady, false);
});
