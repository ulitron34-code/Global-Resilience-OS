import { existsSync, readFileSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const file = (relative) => new URL(relative, root);
const checks = [];
function check(id, condition, evidence) { checks.push({ id, status: condition ? 'pass' : 'fail', evidence }); }

const requiredFiles = [
  'backend/server.js', 'backend/domain/actionPlanStore.js', 'backend/domain/dataQualityGate.js',
  'backend/domain/actionLibrary.js', 'backend/domain/decisionEvidence.js', 'backend/domain/evidenceClassification.js', 'frontend/src/App.jsx', 'docs/EVIDENCE_CLASSIFICATION.md', 'backend/domain/notificationPolicy.js',
  'docs/openapi.local.json', 'docs/THREAT_MODEL.md', 'docs/INTEGRATION_HANDOFF.md', 'scripts/local-smoke-test.js',
  'backend/domain/pilotKit.js', 'docs/PILOT_READINESS.md',
  'backend/domain/incidentOps.js', 'docs/INCIDENT_RESPONSE.md',
  'backend/domain/securityPosture.js', 'docs/SECURITY_POSTURE.md',
  'backend/domain/batchIngestion.js', 'docs/BATCH_INGESTION.md',
  'backend/domain/backtesting.js', 'docs/BACKTESTING.md',
  'backend/domain/sensitivityAnalysis.js', 'docs/SENSITIVITY_ANALYSIS.md',
  'backend/domain/uncertainty.js', 'docs/UNCERTAINTY_PANEL.md',
  'scripts/local-performance-check.js', 'docs/PERFORMANCE_CHECK.md',
  'scripts/local-portable-audit.js', 'docs/PORTABLE_AUDIT.md',
  'docs/DEPENDENCY_AUDIT.md', 'docs/FINAL_HANDOFF_STATUS.md',
  'backend/domain/operationalScorecard.js', 'docs/OPERATIONAL_SCORECARD.md',
  'backend/config/environmentContract.js', 'backend/test/environmentContract.test.js', 'docs/ENVIRONMENT_CONTRACT.md',
  'scripts/local-release-evidence.js', 'scripts/run-frontend-build.ps1', 'docs/LOCAL_RELEASE_EVIDENCE.md',
  'scripts/local-reproducibility-check.js', 'docs/REPRODUCIBILITY_CHECK.md',
  'scripts/local-supabase-schema-check.js', 'docs/SUPABASE_SCHEMA_AUDIT.md',
  'backend/domain/enterpriseReadiness.js', 'docs/ENTERPRISE_READINESS.md',
  'scripts/local-plan-audit.js', 'docs/LOCAL_PLAN_AUDIT.md', 'docs/UI_CONTRACT_AUDIT.md', 'scripts/local-ui-contract-audit.js', 'scripts/local-external-handoff-audit.js', 'docs/EXTERNAL_HANDOFF_AUDIT.md', 'docs/CURRENT_STATUS.md',
  'scripts/local-openapi-route-audit.js', 'docs/OPENAPI_ROUTE_AUDIT.md',
];
for (const relative of requiredFiles) check(`file:${relative}`, existsSync(file(relative)), 'required local artifact');

let openapiValid = false;
try { JSON.parse(readFileSync(file('docs/openapi.local.json'), 'utf8')); openapiValid = true; } catch { openapiValid = false; }
check('openapi-json', openapiValid, 'docs/openapi.local.json parses');
const server = readFileSync(file('backend/server.js'), 'utf8');
const runtime = readFileSync(file('backend/config/runtimeConfig.js'), 'utf8');
const actionStore = readFileSync(file('backend/domain/actionPlanStore.js'), 'utf8');
const connectors = readFileSync(file('backend/domain/connectors.js'), 'utf8');
const gitignore = readFileSync(file('.gitignore'), 'utf8');
check('external-actions-disabled', runtime.includes('externalActionsDisabledByDefault') && runtime.includes('ALLOW_EXTERNAL_ACTIONS'), 'runtime external action guard present');
check('connectors-dry-run', connectors.includes('dry_run_only'), 'connectors default to dry-run');
check('state-excluded', gitignore.includes('backend/storage/state.json') && gitignore.includes('backend/storage/action-plans.json'), 'local state excluded from portable copy');
check('data-abstention', existsSync(file('backend/domain/dataQualityGate.js')), 'material data quality gate present');
check('human-approval', server.includes("/api/action-plans/:id/outcome") && actionStore.includes("item.status !== 'in_execution'"), 'action lifecycle requires execution and outcome');
const planAudit = readFileSync(file('scripts/local-plan-audit.js'), 'utf8');
check('plan-audit', planAudit.includes('localPlanArtifacts') && planAudit.includes('external-actions'), 'master plan audit script is present and contains safety gates');
const openapiRouteAudit = readFileSync(file('scripts/local-openapi-route-audit.js'), 'utf8');
check('openapi-route-audit', openapiRouteAudit.includes('documentedCount') && openapiRouteAudit.includes('duplicateRoutes'), 'OpenAPI route parity audit is present');
const handoffAudit = readFileSync(file('scripts/local-external-handoff-audit.js'), 'utf8');
check('external-handoff-audit', handoffAudit.includes('externalBlockers') && handoffAudit.includes('SUPABASE_SERVICE_ROLE_KEY'), 'external handoff package keeps blockers explicit and secrets managed');

const failed = checks.filter((item) => item.status === 'fail');
console.log(JSON.stringify({ gate: failed.length ? 'FAIL' : 'PASS', checkedAt: new Date().toISOString(), checks }, null, 2));
if (failed.length) process.exitCode = 1;
