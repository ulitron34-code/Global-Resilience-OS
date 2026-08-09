import test from 'node:test';
import assert from 'node:assert/strict';
import { buildValueCase } from '../domain/valueCase.js';

test('value case keeps first-year economics explicit and requires evidence', () => {
  const result = buildValueCase({ annualEvents: 4, lossPerEventUsd: 100000, mitigationRate: 0.5, platformAnnualCostUsd: 50000, implementationCostUsd: 25000, evidenceRefs: ['loss-ledger', 'sponsor-note'] });
  assert.equal(result.status, 'ready_for_human_review');
  assert.equal(result.outputs.grossAnnualExposureUsd, 400000);
  assert.equal(result.outputs.protectedValueUsd, 200000);
  assert.equal(result.outputs.firstYearNetValueUsd, 125000);
  assert.equal(result.gates.willingnessToPayValidated, false);
});

test('value case abstains when it only has assumptions', () => {
  const result = buildValueCase({ annualEvents: 2, lossPerEventUsd: 1000, mitigationRate: 0.5, platformAnnualCostUsd: 10, implementationCostUsd: 10 });
  assert.equal(result.status, 'not_ready');
  assert.equal(result.evidenceClass, 'assumed');
  assert.ok(result.nextEvidence.includes('validación del sponsor'));
});
