import { existsSync, readFileSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const file = (relative) => new URL(relative, root);
const checks = [];

function check(id, phase, required, evidence) {
  checks.push({ id, phase, status: required ? 'pass' : 'fail', evidence });
}

const phases = {
  'phase-0': ['docs/PRODUCT_REQUIREMENTS.md', 'docs/DATA_REQUIREMENTS.md', 'docs/PILOT_READINESS.md'],
  'phase-1': ['backend/server.js', 'backend/test', 'backend/.env.example', 'frontend/.env.example', 'docs/THREAT_MODEL.md', 'docs/RELEASE_CHECKLIST.md', 'scripts/local-smoke-test.js', 'scripts/local-installation-check.js', 'package.json'],
  'phase-2': ['backend/domain/eventContract.js', 'backend/domain/dataCatalog.js', 'backend/domain/batchIngestion.js', 'backend/domain/connectors.js', 'docs/DATA_CONTRACTS.md', 'docs/CONNECTOR_CONTRACTS.md', 'docs/SOURCE_HEALTH_SWEEP.md'],
  'phase-3': ['backend/domain/impactGraph.js', 'backend/domain/entityResolution.js', 'backend/domain/evidenceClassification.js', 'backend/domain/calibrationBenchmark.js', 'backend/domain/backtesting.js', 'backend/domain/sensitivityAnalysis.js', 'backend/domain/uncertainty.js', 'docs/TEMPORAL_IMPACT_GRAPH.md', 'docs/BACKTESTING.md'],
  'phase-4': ['backend/domain/playbooks.js', 'backend/domain/actionPlanStore.js', 'backend/domain/decisionEvidence.js', 'backend/domain/actionLibrary.js', 'docs/DECISION_PACKAGE.md', 'docs/ACTION_LIBRARY.md', 'docs/OUTCOME_FEEDBACK_LOOP.md'],
  'phase-5': ['backend/domain/securityPosture.js', 'backend/config/environmentContract.js', 'backend/domain/enterpriseReadiness.js', 'scripts/local-supabase-schema-check.js', 'docs/SECURITY_POSTURE.md', 'docs/SUPABASE_SCHEMA_AUDIT.md'],
  'phase-6': ['backend/domain/pilotKit.js', 'docs/PILOT_READINESS.md', 'docs/OPERATIONAL_SCORECARD.md'],
  'phase-7': ['docs/ROADMAP.md', 'docs/REGULATORY_EVIDENCE.md', 'docs/LOCAL_CAPABILITY_MATRIX.md'],
};

for (const [phase, paths] of Object.entries(phases)) {
  for (const relative of paths) {
    const present = existsSync(file(relative));
    check(`${phase}:file:${relative}`, phase, present, present ? 'artifact present' : 'required local artifact missing');
  }
}

const runtime = readFileSync(file('backend/config/runtimeConfig.js'), 'utf8');
const server = readFileSync(file('backend/server.js'), 'utf8');
const connectors = readFileSync(file('backend/domain/connectors.js'), 'utf8');
const readiness = readFileSync(file('backend/domain/enterpriseReadiness.js'), 'utf8');
const gitignore = readFileSync(file('.gitignore'), 'utf8');
check('safety:external-actions', 'safety', runtime.includes('externalActionsDisabledByDefault') && runtime.includes('ALLOW_EXTERNAL_ACTIONS'), 'external actions guarded by runtime configuration');
check('safety:dry-run-connectors', 'safety', connectors.includes('dry_run_only'), 'connectors default to dry_run_only');
check('safety:enterprise-separation', 'safety', readiness.includes('externalChecks') && readiness.includes('proceed_to_external_gates'), 'local and external readiness are separated');
check('safety:api-readiness', 'safety', server.includes('/api/readiness/enterprise'), 'enterprise readiness endpoint is exposed');
check('safety:portable-state', 'safety', gitignore.includes('backend/storage/state.json') && gitignore.includes('backend/storage/action-plans.json'), 'mutable local state excluded from portable copy');

const failed = checks.filter((item) => item.status === 'fail');
const byPhase = Object.fromEntries(Object.keys(phases).map((phase) => {
  const phaseChecks = checks.filter((item) => item.phase === phase);
  return [phase, { status: phaseChecks.every((item) => item.status === 'pass') ? 'pass' : 'fail', passed: phaseChecks.filter((item) => item.status === 'pass').length, total: phaseChecks.length }];
}));
console.log(JSON.stringify({ schemaVersion: '1.0.0-local-plan-audit', checkedAt: new Date().toISOString(), gate: failed.length ? 'FAIL' : 'PASS', localPlanArtifacts: byPhase, safety: checks.filter((item) => item.phase === 'safety'), failed }, null, 2));
if (failed.length) process.exitCode = 1;
