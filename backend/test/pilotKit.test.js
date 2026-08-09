import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPilotMetrics, buildPilotNextActions, buildPilotReadiness, normalizePilotFeedback } from '../domain/pilotKit.js';

const technicalInputs = {
  runtime: { ready: true },
  catalog: { ready: true },
  sourceHealth: { sources: [{ id: 'licensed-source', health: 'healthy' }] },
  modelGovernance: [{ decision: 'abstain_for_production' }],
  actionLibrary: { ready: true },
  tenancy: { organizationId: 'org-test' },
  measurementPlan: { metrics: [
    { id: 'time_to_explain_minutes', baseline: 120, target: 60 },
    { id: 'time_to_decision_minutes', baseline: 90, target: 45 },
    { id: 'evidence_completeness_pct', baseline: 40, target: 90 },
    { id: 'action_documentation_pct', baseline: 20, target: 80 },
  ] },
};

const interviewEvidence = [1, 2, 3, 4, 5].map((index) => ({ stage: 'interview', role: `Role ${index}`, summary: `Decision critica documentada ${index}`, urgencyScore: index <= 2 ? 5 : 3 }));

test('pilot readiness remains blocked without customer and historical evidence', () => {
  const result = buildPilotReadiness(technicalInputs);
  assert.equal(result.technicalReady, true);
  assert.equal(result.customerReady, false);
  assert.deepEqual(result.evidenceCounts, { interviews: 0, urgentInterviews: 0, dataAccessEvidence: 0, customerReviews: 0, economicEvidence: 0, successCriteria: 0, verifiedHistoricalEvents: 0 });
});

test('pilot readiness requires structured value and success evidence', () => {
  const feedback = [...interviewEvidence,
    { stage: 'pilot_review', evidence: 'Cliente reviso el criterio.', evidenceType: 'general' },
    { stage: 'pilot_review', evidence: 'Rango de costo evitado documentado.', evidenceType: 'economic_value' },
    { stage: 'pilot_review', evidence: 'Baseline y umbral definidos.', evidenceType: 'success_criteria' },
    { stage: 'interview', evidence: 'Fuentes autorizables y responsable identificados.', evidenceType: 'data_access' },
  ];
  const historicalFixtures = [
    { id: 'evt-1', sourceId: 'licensed-ais', provenance: 'contract-1', evidenceStatus: 'complete' },
    { id: 'evt-2', sourceId: 'licensed-cables', provenance: 'contract-2', evidenceStatus: 'complete' },
    { id: 'evt-3', sourceId: 'licensed-ports', provenance: 'contract-3', evidenceStatus: 'complete' },
  ];
  const result = buildPilotReadiness({ ...technicalInputs, pilotFeedback: feedback, historicalFixtures });
  assert.equal(result.customerReady, true);
  assert.equal(result.status, 'customer_ready_for_gate_review');
  assert.equal(result.evidenceCounts.economicEvidence, 1);
  assert.equal(result.evidenceCounts.successCriteria, 1);
  assert.equal(result.evidenceCounts.dataAccessEvidence, 1);
});

test('pilot readiness requires five structured interviews before customer gate', () => {
  const result = buildPilotReadiness({
    ...technicalInputs,
    pilotFeedback: [...interviewEvidence.slice(0, 4), { stage: 'pilot_review', evidence: 'Review documentada.', evidenceType: 'general' }],
    historicalFixtures: [
      { id: 'evt-1', sourceId: 'licensed-ais', provenance: 'contract-1', evidenceStatus: 'complete' },
      { id: 'evt-2', sourceId: 'licensed-cables', provenance: 'contract-2', evidenceStatus: 'complete' },
      { id: 'evt-3', sourceId: 'licensed-ports', provenance: 'contract-3', evidenceStatus: 'complete' },
    ],
  });
  assert.equal(result.checks.find((check) => check.id === 'interview_threshold').pass, false);
  assert.equal(result.customerReady, false);
});

test('pilot readiness requires urgent problems and data access evidence', () => {
  const result = buildPilotReadiness({
    ...technicalInputs,
    pilotFeedback: [...interviewEvidence.map((item) => ({ ...item, urgencyScore: 3 })), { stage: 'pilot_review', evidence: 'Review documentada.', evidenceType: 'general' }],
    historicalFixtures: [
      { id: 'evt-1', sourceId: 'licensed-ais', provenance: 'contract-1', evidenceStatus: 'complete' },
      { id: 'evt-2', sourceId: 'licensed-cables', provenance: 'contract-2', evidenceStatus: 'complete' },
      { id: 'evt-3', sourceId: 'licensed-ports', provenance: 'contract-3', evidenceStatus: 'complete' },
    ],
  });
  assert.equal(result.checks.find((check) => check.id === 'urgent_problems').pass, false);
  assert.equal(result.checks.find((check) => check.id === 'data_access').pass, false);
  assert.equal(result.customerReady, false);
});

test('pilot readiness remains blocked when value evidence is missing', () => {
  const result = buildPilotReadiness({
    ...technicalInputs,
    pilotFeedback: [...interviewEvidence, { stage: 'pilot_review', evidence: 'Review documentada.', evidenceType: 'general' }],
    historicalFixtures: [
      { id: 'evt-1', sourceId: 'licensed-ais', provenance: 'contract-1', evidenceStatus: 'complete' },
      { id: 'evt-2', sourceId: 'licensed-cables', provenance: 'contract-2', evidenceStatus: 'complete' },
      { id: 'evt-3', sourceId: 'licensed-ports', provenance: 'contract-3', evidenceStatus: 'complete' },
    ],
  });
  assert.equal(result.customerReady, false);
});

test('demo fixtures never count as authorized historical evidence', () => {
  const result = buildPilotReadiness({
    ...technicalInputs,
    pilotFeedback: [{ stage: 'pilot_review', evidence: 'Review documentada.', evidenceType: 'general' }],
    historicalFixtures: [
      { id: 'evt-1', sourceId: 'ais-demo', provenance: 'demo', evidenceStatus: 'complete' },
      { id: 'evt-2', sourceId: 'cables-demo', provenance: 'demo', evidenceStatus: 'complete' },
      { id: 'evt-3', sourceId: 'ports-demo', provenance: 'demo', evidenceStatus: 'complete' },
    ],
  });
  assert.equal(result.customerReady, false);
  assert.equal(result.evidenceCounts.verifiedHistoricalEvents, 0);
});

test('pilot readiness excludes incomplete historical fixtures', () => {
  const result = buildPilotReadiness({
    ...technicalInputs,
    pilotFeedback: [{ stage: 'pilot_review', evidence: 'Review documentada.', evidenceType: 'general' }],
    historicalFixtures: [
      { id: 'evt-incomplete', sourceId: 'licensed-ais', provenance: 'contract-1', evidenceStatus: 'incomplete' },
      { id: 'evt-complete', sourceId: 'licensed-ais', provenance: 'contract-1', evidenceStatus: 'complete' },
    ],
  });
  assert.equal(result.evidenceCounts.verifiedHistoricalEvents, 1);
  assert.equal(result.customerReady, false);
});

test('normalizes and validates structured pilot evidence type', () => {
  assert.equal(normalizePilotFeedback({ stage: 'pilot_review', role: 'CFO', summary: 'Costo validado', evidence: 'Contrato', evidenceType: 'economic_value' }).evidenceType, 'economic_value');
  assert.throws(() => normalizePilotFeedback({ stage: 'pilot_review', role: 'CFO', summary: 'Costo validado', evidenceType: 'invented' }), /evidenceType/);
});

test('demo sources never count as productive pilot coverage', () => {
  const result = buildPilotMetrics({ sourceHealth: { sources: [{ id: 'ais-demo', health: 'demo' }, { id: 'licensed-source', health: 'healthy' }] } });
  assert.equal(result.metrics.sourceCoverage, 1);
  assert.equal(result.metrics.productiveSourceCount, 1);
  assert.equal(result.metrics.illustrativeSourceCount, 1);
  assert.match(result.definitions.sourceCoverage, /se excluyen/);
  assert.ok(result.missingEvidence.includes('fuentes productivas licenciadas'));
});

test('pilot readiness does not pass source gate with demo-only feeds', () => {
  const result = buildPilotReadiness({
    ...technicalInputs,
    sourceHealth: { sources: [{ id: 'provider-demo', status: 'demo', health: 'demo' }] },
  });
  assert.equal(result.checks.find((check) => check.id === 'source_health').pass, false);
  assert.equal(result.technicalReady, false);
});

test('pilot next actions are derived from failed gates', () => {
  const actions = buildPilotNextActions({ checks: [{ id: 'source_health', label: 'Fuentes', pass: false }, { id: 'economic_value', label: 'Valor', pass: true }] });
  assert.deepEqual(actions, [
    'Registrar al menos una fuente productiva autorizada y observar su health en staging.',
  ]);
});

test('pilot next actions provide a go/no-go sequence when all gates pass', () => {
  const actions = buildPilotNextActions({ checks: [{ id: 'runtime', label: 'Runtime', pass: true }] });
  assert.equal(actions.length, 3);
  assert.match(actions[0], /go\/no-go/);
});

test('pilot readiness exposes an explicit measurement-plan gate', () => {
  const result = buildPilotReadiness({ ...technicalInputs, measurementPlan: { metrics: [] } });
  const gate = result.checks.find((check) => check.id === 'measurement_plan');
  assert.equal(gate.pass, false);
  assert.match(gate.evidence, /0\/4/);
});
