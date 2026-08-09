import test from 'node:test';
import assert from 'node:assert/strict';
import { createActionPlan, getActionPlanTimingMetrics, resetActionPlans, updateActionPlan } from '../domain/actionPlanStore.js';
import { buildOperationalScorecard } from '../domain/operationalScorecard.js';
import { validateEventEnvelope } from '../domain/eventContract.js';

const eventFixture = { externalId: 'timing-event', sourceId: 'licensed-source', eventType: 'port_delay', title: 'Port delay', severity: 'high', impactUsd: 100, observedAt: '2026-08-08T10:00:00Z', provenance: { licenseRef: 'contract-timing' } };

test('event contract preserves an explicit detection timestamp', () => {
  const event = validateEventEnvelope({ ...eventFixture, detectedAt: '2026-08-08T10:05:00-05:00' });
  assert.equal(event.detectedAt, '2026-08-08T15:05:00.000Z');
});

test('event contract rejects an invalid optional detection timestamp', () => {
  assert.throws(() => validateEventEnvelope({ ...eventFixture, detectedAt: 'not-a-date' }), /detectedAt/);
});

test('action plan lifecycle records approval and assignment timing', () => {
  resetActionPlans();
  const plan = createActionPlan({ playbookId: 'port-congestion', caseId: 'CASE-TIMING', confidence: 0.8 }, 'timing-user', 'org-timing');
  assert.equal(plan.statusHistory.length, 1);
  assert.equal(plan.decisionAt, undefined);

  const assigned = updateActionPlan(plan.id, { owner: 'operator@example.com' }, 'timing-user', 'org-timing');
  assert.ok(assigned.assignedAt);
  const approved = updateActionPlan(plan.id, { humanApproval: 'approved', status: 'approved' }, 'timing-user', 'org-timing');
  assert.equal(approved.status, 'approved');
  assert.ok(approved.decisionAt);
  assert.deepEqual(approved.statusHistory.map((item) => item.status), ['draft_for_human_approval', 'approved']);

  const metrics = getActionPlanTimingMetrics('org-timing');
  assert.equal(metrics.plansObserved, 1);
  assert.equal(metrics.decisionsObserved, 1);
  assert.equal(metrics.assignmentsObserved, 1);
  assert.equal(typeof metrics.timeToDecisionMinutes, 'number');
  assert.equal(typeof metrics.timeToAssignmentMinutes, 'number');
  assert.equal(metrics.timeToExplanationMinutes, null);
  resetActionPlans();
});

test('operational scorecard exposes measured local decision time without inventing detection time', () => {
  const scorecard = buildOperationalScorecard({
    actionPlans: [{ createdAt: '2026-08-08T10:00:00.000Z', decisionAt: '2026-08-08T10:30:00.000Z' }],
  });
  assert.equal(scorecard.timing.timeToDecisionMinutes, 30);
  assert.equal(scorecard.timing.decisionsObserved, 1);
  assert.equal(scorecard.timing.timeToDetectionMinutes, null);
  assert.equal(scorecard.timing.timeToExplanationMinutes, null);
});

test('operational scorecard measures detection and explanation only with explicit timestamps', () => {
  const scorecard = buildOperationalScorecard({
    alerts: [{ severity: 'high', payload: { observedAt: '2026-08-08T10:00:00.000Z', detectedAt: '2026-08-08T10:05:00.000Z' } }],
    actionPlans: [{ createdAt: '2026-08-08T10:00:00.000Z', detectedAt: '2026-08-08T10:05:00.000Z', explainedAt: '2026-08-08T10:15:00.000Z', decisionAt: '2026-08-08T10:30:00.000Z' }],
  });
  assert.equal(scorecard.timing.timeToDetectionMinutes, 5);
  assert.equal(scorecard.timing.timeToExplanationMinutes, 10);
  assert.equal(scorecard.timing.timeToDecisionMinutes, 30);
  assert.equal(scorecard.timing.detectionsObserved, 1);
  assert.equal(scorecard.timing.explanationsObserved, 1);
});

test('action plans preserve optional detection and explanation timestamps', () => {
  resetActionPlans();
  const plan = createActionPlan({ playbookId: 'port-congestion', detectedAt: '2026-08-08T10:05:00Z', explainedAt: '2026-08-08T10:15:00Z' }, 'timing-user', 'org-timing-evidence');
  assert.equal(plan.detectedAt, '2026-08-08T10:05:00.000Z');
  assert.equal(plan.explainedAt, '2026-08-08T10:15:00.000Z');
  const metrics = getActionPlanTimingMetrics('org-timing-evidence');
  assert.equal(metrics.timeToExplanationMinutes, 10);
  assert.equal(metrics.explanationsObserved, 1);
  resetActionPlans();
});

test('operational scorecard excludes demo and pending sources from readiness', () => {
  const scorecard = buildOperationalScorecard({
    sources: [
      { id: 'ais-demo', status: 'connected' },
      { id: 'licensed-source', status: 'connected' },
      { id: 'intake-source', status: 'pending_external' },
      { id: 'failed-source', status: 'error' },
    ],
  });
  assert.equal(scorecard.product.sources.total, 4);
  assert.equal(scorecard.product.sources.freshOrHealthy, 1);
  assert.equal(scorecard.product.sources.pendingExternal, 1);
  assert.equal(scorecard.product.sources.readinessRate, 0.25);
});

test('operational scorecard excludes illustrative and incomplete calibration fixtures', () => {
  const scorecard = buildOperationalScorecard({
    calibrationFixtures: [
      { id: 'demo-fixture', sourceId: 'ais-demo', provenance: 'demo', evidenceStatus: 'complete', observedImpactUsd: 100, predictedImpactUsd: 1 },
      { id: 'incomplete-fixture', sourceId: 'licensed-source', provenance: 'contract', evidenceStatus: 'incomplete', observedImpactUsd: 100, predictedImpactUsd: 1 },
      { id: 'authorized-fixture', sourceId: 'licensed-source', provenance: 'contract', evidenceStatus: 'complete', observedImpactUsd: 100, predictedImpactUsd: 90 },
    ],
  });
  assert.equal(scorecard.models.calibrationFixtures, 3);
  assert.equal(scorecard.models.eligibleCalibrationFixtures, 1);
  assert.equal(scorecard.models.excludedIllustrativeCalibrationFixtures, 1);
  assert.equal(scorecard.models.meanAbsoluteErrorUsd, 10);
  assert.equal(scorecard.models.abstentionReady, false);
});
