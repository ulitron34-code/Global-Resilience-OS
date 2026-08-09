import test from 'node:test';
import assert from 'node:assert/strict';
import { attachDecisionEvidence } from '../domain/decisionEvidence.js';

const plan = { generatedAt: '2026-08-09T00:00:00.000Z', assumptions: [] };

test('decision evidence marks demo-linked sources as illustrative and ineligible', () => {
  const result = attachDecisionEvidence(plan, { sourceIds: ['ais-demo', 'provider-001'] });
  assert.deepEqual(result.evidence.illustrativeSourceIds, ['ais-demo']);
  assert.equal(result.evidence.provenanceStatus, 'linked_illustrative');
  assert.equal(result.evidence.productionEligible, false);
  assert.equal(result.evidence.productionDecision, 'abstain_illustrative_source');
});

test('decision evidence marks a productive linked source as quality-gate eligible', () => {
  const result = attachDecisionEvidence(plan, { sourceId: 'licensed-provider-001' });
  assert.deepEqual(result.evidence.illustrativeSourceIds, []);
  assert.equal(result.evidence.provenanceStatus, 'linked');
  assert.equal(result.evidence.productionEligible, true);
  assert.equal(result.evidence.productionDecision, 'eligible_for_quality_gate');
});
