import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPlaybookReadiness } from '../domain/playbookReadiness.js';

const verticals = ['digital-infrastructure', 'maritime-corridors', 'critical-commodities'];

test('playbook readiness requires explicit vertical coverage', () => {
  const result = buildPlaybookReadiness(Array.from({ length: 5 }, (_, index) => ({ id: `generic-${index}`, verticals })));
  assert.equal(result.status, 'ready_for_local_pilot');
  assert.ok(result.verticals.every((item) => item.pass && item.playbookCount === 5));
});

test('playbook readiness rejects unclassified playbooks', () => {
  const result = buildPlaybookReadiness(Array.from({ length: 5 }, (_, index) => ({ id: `unclassified-${index}` })));
  assert.equal(result.status, 'missing_vertical_coverage');
  assert.ok(result.verticals.every((item) => item.playbookCount === 0 && !item.pass));
});
