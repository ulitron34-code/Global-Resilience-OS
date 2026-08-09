import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDefaultPilotMeasurementPlan, evaluatePilotMeasurementPlan, normalizePilotMeasurementPlan } from '../domain/pilotMeasurement.js';

test('pilot measurement plan remains not ready without observed evidence', () => {
  const plan = buildDefaultPilotMeasurementPlan('org-a');
  const evaluated = evaluatePilotMeasurementPlan(plan);
  assert.equal(evaluated.status, 'not_ready');
  assert.equal(evaluated.gate.missingEvidence.length, 4);
});

test('pilot measurement plan produces go only when required metrics meet targets with evidence', () => {
  const plan = normalizePilotMeasurementPlan({ metrics: [
    { id: 'time_to_explain_minutes', baseline: 120, target: 60, actual: 45, evidenceRef: 'OBS-1', evidenceClass: 'observed' },
    { id: 'time_to_decision_minutes', baseline: 90, target: 45, actual: 40, evidenceRef: 'OBS-2', evidenceClass: 'observed' },
    { id: 'evidence_completeness_pct', baseline: 40, target: 90, actual: 95, evidenceRef: 'OBS-3', evidenceClass: 'observed' },
    { id: 'action_documentation_pct', baseline: 20, target: 80, actual: 82, evidenceRef: 'OBS-4', evidenceClass: 'observed' },
  ] }, 'org-a', 'analyst@example.com');
  const evaluated = evaluatePilotMeasurementPlan(plan);
  assert.equal(evaluated.status, 'go');
  assert.equal(evaluated.gate.passed, 4);
  assert.equal(evaluated.metrics.every((metric) => metric.status === 'pass'), true);
});

test('pilot measurement plan rejects duplicate or unknown metrics', () => {
  assert.throws(() => normalizePilotMeasurementPlan({ metrics: [{ id: 'unknown' }] }), /no soportada/);
  assert.throws(() => normalizePilotMeasurementPlan({ metrics: [{ id: 'hours_recovered' }, { id: 'hours_recovered' }] }), /duplicada/);
});
