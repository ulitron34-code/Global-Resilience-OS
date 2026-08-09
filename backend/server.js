import express from 'express';
import cors from 'cors';
import { pathToFileURL } from 'node:url';
import { VERTICALS } from './data/verticals.js';
import { CABLES, CHOKEPOINTS } from './data/cables.js';
import { computeImpact } from './engine/impactEngine.js';
import { validateSimulationInput } from './validation.js';
import { buildImpactGraph, getImpactPaths } from './domain/impactGraph.js';
import { buildActionPlan, getPlaybook, listPlaybooks } from './domain/playbooks.js';
import { DEFAULT_ORGANIZATION_ID, createActionPlan, getActionPlan, getActionPlanOutcomeMetrics, getActionPlanTimingMetrics, getAnonymousSectorBenchmark, listActionPlans, recordActionPlanOutcome, resetActionPlans, updateActionPlan } from './domain/actionPlanStore.js';
import { resolveEntity } from './domain/entityResolution.js';
import { listDataCatalog, getDataCatalogReadiness, validateSourceIntake } from './domain/dataCatalog.js';
import { getRuntimeReadiness } from './config/runtimeConfig.js';
import { checkSupabaseConnection, getSupabaseReadiness } from './config/supabase.js';
import { getEnvironmentContract } from './config/environmentContract.js';
import { benchmarkCalibration } from './domain/calibrationBenchmark.js';
import { validateEventEnvelope } from './domain/eventContract.js';
import { getConnector, getConnectorContractReadiness, listConnectors, validateConnectorPayload } from './domain/connectors.js';
import { buildRegulatoryEvidenceMap, getRegulatoryFramework, listRegulatoryFrameworks } from './domain/regulatoryMap.js';
import { buildRecoveryProfile } from './domain/recoveryModel.js';
import { getAction, getActionLibraryReadiness, listActions, recommendActions } from './domain/actionLibrary.js';
import { buildNotificationPolicy, getNotificationPolicyReadiness } from './domain/notificationPolicy.js';
import { evaluateDataQuality, validateDataRecord } from './domain/dataQualityGate.js';
import { getSchema, getSchemaRegistryReadiness, listSchemas } from './domain/schemaRegistry.js';
import { buildModelGovernance } from './domain/modelGovernance.js';
import { buildAssistiveSuggestion } from './domain/assistiveAgent.js';
import { buildPilotMetrics, buildPilotReadiness, getPilotInterviewGuide, normalizePilotFeedback } from './domain/pilotKit.js';
import { pilotPackageToMarkdown } from './domain/pilotPackage.js';
import { decisionPackageToMarkdown } from './domain/decisionPackageMarkdown.js';
import { getIncidentRunbook } from './domain/incidentOps.js';
import { buildSecurityPosture } from './domain/securityPosture.js';
import { validateBatchInput } from './domain/batchIngestion.js';
import { buildBacktestReport } from './domain/backtesting.js';
import { buildSensitivityAnalysis } from './domain/sensitivityAnalysis.js';
import { buildUncertaintyReport } from './domain/uncertainty.js';
import { buildOperationalScorecard } from './domain/operationalScorecard.js';
import { buildEnterpriseReadiness } from './domain/enterpriseReadiness.js';
import { attachDecisionEvidence } from './domain/decisionEvidence.js';
import { buildCooperativeIncidentPreview } from './domain/cooperativeNetwork.js';
import { authIfConfigured, listRoles, listUsers, login, requireAuth, revokeToken, roleIfConfigured } from './auth/auth.js';
import {
  createCaseFromAlert,
  createScenario,
  compareScenarios,
  getCase,
  getDecisionPackage,
  listDecisionShares,
  createDecisionShare,
  revokeDecisionShare,
  getDecisionPackageByShareToken,
  getLatestBrief,
  getOverviewMetrics,
  getReadiness,
  getLocalSnapshot,
  resetLocalDemo,
  restoreLocalSnapshot,
  getComplianceReadiness,
  getDataQualityReport,
  getProvenanceOverview,
  getRetentionOverview,
  getAuditIntegrity,
  getSlaOverview,
  getSourceHealthOverview,
  runSlaSweep,
  runSourceHealthSweep,
  getAlert,
  updateAlert,
  getSource,
  listAlerts,
  countAlerts,
  listAudit,
  countAudit,
  listCases,
  countCases,
  listScenarios,
  listSources,
  listModels,
  getModelValidationReport,
  getCalibrationOverview,
  recordCalibrationFixtures,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  addComment,
  createWebhook,
  listComments,
  listWebhookDeliveries,
  retryWebhookDelivery,
  processLocalWebhookDeliveries,
  processWebhookDeliveries,
  listWebhooks,
  rotateWebhookSecret,
  listJobRuns,
  runDemoIngestionJob,
  ingestEvent,
  recordDeadLetter,
  listDeadLetters,
  retryDeadLetter,
  updateCase,
  listPilotFeedback,
  recordPilotFeedback,
  listSourceIntakeReviews,
  createSourceIntakeReview,
  updateSourceIntakeReview,
  listIncidents,
  createIncident,
  updateIncident,
  getRemoteStoreStatus,
  getControlPlaneProjection,
  flushPersistence,
} from './domain/store.js';

export const app = express();
const PORT = process.env.PORT || 4000;
const API_VERSION = 'v1';
const SERVICE_VERSION = '0.9.0';
const requestCounts = new Map();
const operationalMetrics = { startedAt: new Date().toISOString(), requests: 0, errors: 0, byRoute: new Map() };
const loginAttempts = new Map();
const shareRequestCounts = new Map();
const SHARE_RATE_WINDOW_MS = 60_000;
const SHARE_RATE_LIMIT = 60;
const GLOBAL_RATE_LIMIT = Number(process.env.GLOBAL_RATE_LIMIT || (process.env.NODE_ENV === 'test' ? 1000 : 120));

function purgeRateLimitMaps(now = Date.now()) {
  if (requestCounts.size > 5000) {
    for (const [key, entry] of requestCounts) {
      if (now - entry.startedAt > 60_000) requestCounts.delete(key);
    }
  }
  if (loginAttempts.size > 5000) {
    for (const [key, entry] of loginAttempts) {
      const lastAttemptAt = entry.lastAttemptAt || now;
      if (now - lastAttemptAt > 60_000 && (!entry.blockedUntil || entry.blockedUntil <= now)) loginAttempts.delete(key);
    }
  }
}

function getOperationalRuntimeReadiness() {
  const base = getRuntimeReadiness();
  const persistence = getRemoteStoreStatus();
  const remoteRequired = ['staging', 'production'].includes(base.config?.mode) && process.env.PERSISTENCE_MODE === 'supabase';
  const remoteReady = !remoteRequired || (persistence.enabled && persistence.state === 'ready' && Boolean(persistence.organizationId));
  const checks = { ...base.checks, remotePersistence: remoteReady };
  return {
    ...base,
    ready: Object.values(checks).every(Boolean),
    checks,
    persistence: { enabled: persistence.enabled, state: persistence.state, organizationId: persistence.organizationId, lastError: persistence.lastError },
  };
}

const configuredOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean) : null;
app.use(cors({ origin: (origin, callback) => {
  if (!origin || !configuredOrigins || configuredOrigins.includes(origin)) return callback(null, true);
  return callback(new Error('Origen CORS no permitido'));
} }));
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('x-frame-options', 'DENY');
  res.setHeader('referrer-policy', 'no-referrer');
  res.setHeader('permissions-policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('x-dns-prefetch-control', 'off');
  res.setHeader('cross-origin-resource-policy', 'same-origin');
  res.setHeader('cross-origin-opener-policy', 'same-origin');
  res.setHeader('content-security-policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
  next();
});

app.use((req, res, next) => {
  const incomingId = req.get('x-request-id');
  const requestId = incomingId && /^[A-Za-z0-9._:-]{1,100}$/.test(incomingId) ? incomingId : `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  res.setHeader('x-api-version', API_VERSION);
  next();
});

app.use((req, res, next) => {
  const startedAt = performance.now();
  res.on('finish', () => {
    const durationMs = Math.round((performance.now() - startedAt) * 100) / 100;
    const route = `${req.method} ${req.route?.path || req.path}`;
    const item = operationalMetrics.byRoute.get(route) || { route, count: 0, errors: 0, totalMs: 0, lastMs: 0 };
    item.count += 1;
    item.totalMs += durationMs;
    item.lastMs = durationMs;
    if (res.statusCode >= 400) { item.errors += 1; operationalMetrics.errors += 1; }
    operationalMetrics.byRoute.set(route, item);
    operationalMetrics.requests += 1;
    if (operationalMetrics.byRoute.size > 100) operationalMetrics.byRoute.delete(operationalMetrics.byRoute.keys().next().value);
  });
  next();
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api/shares/')) return next();
  const key = req.ip || 'local';
  const now = Date.now();
  purgeRateLimitMaps(now);
  const current = requestCounts.get(key) || { startedAt: now, count: 0 };
  if (now - current.startedAt > 60_000) { current.startedAt = now; current.count = 0; }
  current.count += 1;
  requestCounts.set(key, current);
  const remaining = Math.max(0, GLOBAL_RATE_LIMIT - current.count);
  res.set('x-ratelimit-limit', String(GLOBAL_RATE_LIMIT));
  res.set('x-ratelimit-remaining', String(remaining));
  res.set('x-ratelimit-reset', String(Math.ceil((current.startedAt + 60_000) / 1000)));
  if (current.count > GLOBAL_RATE_LIMIT) res.set('retry-after', '60');
  if (current.count > GLOBAL_RATE_LIMIT) return res.status(429).json({ error: 'Límite de solicitudes excedido', retryAfterSeconds: 60 });
  next();
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string') return res.status(400).json({ error: 'email y password son requeridos' });
  const attemptKey = `${req.ip || 'local'}:${email.trim().toLowerCase()}`;
  const attempt = loginAttempts.get(attemptKey);
  if (attempt?.blockedUntil > Date.now()) {
    const retryAfterSeconds = Math.ceil((attempt.blockedUntil - Date.now()) / 1000);
    res.set('retry-after', String(retryAfterSeconds));
    return res.status(429).json({ error: 'Demasiados intentos de acceso', retryAfterSeconds });
  }
  const session = login(email, password);
  if (!session) {
    const nextAttempt = attempt || { failures: 0 };
    nextAttempt.failures += 1;
    nextAttempt.lastAttemptAt = Date.now();
    if (nextAttempt.failures >= 5) nextAttempt.blockedUntil = Date.now() + 60_000;
    loginAttempts.set(attemptKey, nextAttempt);
    return res.status(401).json({ error: 'Credenciales invalidas' });
  }
  loginAttempts.delete(attemptKey);
  if (!session) return res.status(401).json({ error: 'Credenciales inválidas' });
  res.json(session);
});

app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: req.user }));
app.post('/api/auth/logout', requireAuth, (req, res) => {
  const token = (req.get('authorization') || '').slice(7);
  revokeToken(token);
  res.status(204).send();
});
app.get('/api/auth/roles', (req, res) => res.json(listRoles()));
app.get('/api/auth/users', authIfConfigured, roleIfConfigured('admin'), (req, res) => res.json(listUsers()));

const PUBLIC_API_PATHS = new Set([
  '/health', '/version', '/health/readiness', '/auth/login', '/auth/roles',
  '/runtime/readiness', '/runtime/supabase', '/runtime/supabase/check',
  '/runtime/supabase/persistence', '/runtime/config-contract',
]);
app.use('/api', (req, res, next) => {
  if (req.method === 'OPTIONS' || process.env.AUTH_REQUIRED !== 'true') return next();
  if (PUBLIC_API_PATHS.has(req.path) || req.path.startsWith('/shares/')) return next();
  return requireAuth(req, res, next);
});

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Global Resilience OS - Demo API', mode: 'local-platform', uptimeSeconds: Math.round(process.uptime()), version: SERVICE_VERSION, apiVersion: API_VERSION });
});
app.get('/api/version', (req, res) => res.json({ apiVersion: API_VERSION, serviceVersion: SERVICE_VERSION, environment: process.env.NODE_ENV || 'development' }));
app.get('/api/health/readiness', (req, res) => {
  const readiness = getReadiness();
  res.status(readiness.ready ? 200 : 503).json(readiness);
});
app.get('/api/ops/snapshot', authIfConfigured, roleIfConfigured('admin'), (req, res) => {
  res.type('application/json').set('Content-Disposition', 'attachment; filename="resilience-local-snapshot.json"').send(JSON.stringify(getLocalSnapshot(), null, 2));
});
app.post('/api/ops/control-plane/projection', authIfConfigured, roleIfConfigured('admin'), (req, res) => {
  try {
    const organizationId = req.user?.organizationId || DEFAULT_ORGANIZATION_ID;
    const organizationUuid = req.body?.organizationUuid || req.query.organizationUuid;
    const projectionTimestamp = req.body?.projectionTimestamp || req.query.projectionTimestamp;
    res.json(getControlPlaneProjection(organizationUuid, organizationId, projectionTimestamp));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
app.post('/api/ops/restore', authIfConfigured, roleIfConfigured('admin'), (req, res) => {
  try {
    res.json(restoreLocalSnapshot(req.body || {}, req.user?.email || 'admin'));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
app.post('/api/ops/reset-demo', authIfConfigured, roleIfConfigured('admin'), (req, res) => {
  if (process.env.APP_MODE === 'production') return res.status(403).json({ error: 'El reinicio demo está bloqueado en producción' });
  const result = resetLocalDemo(req.user?.email || 'admin');
  const actionPlans = resetActionPlans();
  res.json({ ...result, counts: { ...result.counts, actionPlansRemoved: actionPlans.removed } });
});
app.get('/api/ops/metrics', authIfConfigured, roleIfConfigured('admin'), (req, res) => {
  const routes = [...operationalMetrics.byRoute.values()]
    .map((item) => ({ ...item, averageMs: item.count ? Math.round((item.totalMs / item.count) * 100) / 100 : 0 }))
    .sort((a, b) => b.count - a.count);
  res.json({ startedAt: operationalMetrics.startedAt, uptimeSeconds: Math.round(process.uptime()), requests: operationalMetrics.requests, errors: operationalMetrics.errors, memory: process.memoryUsage(), routes, generatedAt: new Date().toISOString() });
});
app.get('/api/compliance/readiness', (req, res) => res.json(getComplianceReadiness()));
app.get('/api/quality/report', (req, res) => res.json(getDataQualityReport()));
app.get('/api/governance/provenance', (req, res) => res.json(getProvenanceOverview()));
app.get('/api/governance/retention', (req, res) => res.json(getRetentionOverview()));
app.get('/api/runtime/readiness', (req, res) => { const readiness = getOperationalRuntimeReadiness(); res.status(readiness.ready ? 200 : 503).json(readiness); });
app.get('/api/runtime/supabase', (req, res) => res.json(getSupabaseReadiness()));
app.get('/api/runtime/supabase/check', async (req, res) => {
  const result = await checkSupabaseConnection();
  res.status(result.reachable ? 200 : 503).json(result);
});
app.get('/api/runtime/supabase/persistence', (req, res) => res.json(getRemoteStoreStatus()));
app.get('/api/runtime/config-contract', (req, res) => { const contract = getEnvironmentContract(); res.status(contract.ready ? 200 : 503).json(contract); });
app.get('/api/readiness/enterprise', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => {
  const modelGovernance = listModels().map((model) => { const calibration = getCalibrationOverview(model.id); return buildModelGovernance(model, getModelValidationReport(), calibration, benchmarkCalibration(calibration)); });
  const runtime = getOperationalRuntimeReadiness();
  const schemaVerified = process.env.LOCAL_SCHEMA_AUDIT_VERIFIED === 'true';
  const releaseVerified = process.env.LOCAL_RELEASE_GATE_VERIFIED === 'true';
  res.json(buildEnterpriseReadiness({ runtime, environmentContract: getEnvironmentContract(), security: buildSecurityPosture({ runtime, audit: getAuditIntegrity(), tenancy: { organizationId: DEFAULT_ORGANIZATION_ID }, snapshot: getLocalSnapshot() }), catalog: getDataCatalogReadiness(), modelGovernance, actionLibrary: getActionLibraryReadiness(), schemaAudit: schemaVerified, releaseGate: releaseVerified }));
});
app.get('/api/data-catalog', (req, res) => res.json(listDataCatalog()));
app.get('/api/data-catalog/readiness', (req, res) => res.json(getDataCatalogReadiness()));
app.post('/api/data-catalog/intake-preview', authIfConfigured, roleIfConfigured('admin', 'risk_analyst'), (req, res) => { try { res.json(validateSourceIntake(req.body || {})); } catch (error) { res.status(400).json({ error: error.message }); } });
app.get('/api/data-catalog/intake-reviews', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => res.json(listSourceIntakeReviews({ ...req.query, organizationId: req.user?.organizationId || DEFAULT_ORGANIZATION_ID })));
app.post('/api/data-catalog/intake-reviews', authIfConfigured, roleIfConfigured('admin', 'risk_analyst'), (req, res) => { try { res.status(201).json(createSourceIntakeReview(req.body || {}, req.user?.email || 'operator', req.user?.organizationId || DEFAULT_ORGANIZATION_ID)); } catch (error) { res.status(400).json({ error: error.message }); } });
app.patch('/api/data-catalog/intake-reviews/:id', authIfConfigured, roleIfConfigured('admin', 'risk_analyst'), (req, res) => { try { const item = updateSourceIntakeReview(req.params.id, req.body || {}, req.user?.email || 'operator', req.user?.organizationId || DEFAULT_ORGANIZATION_ID); if (!item) return res.status(404).json({ error: 'Revisión de fuente no encontrada' }); res.json(item); } catch (error) { res.status(400).json({ error: error.message }); } });
app.get('/api/data-quality/gate', (req, res) => res.json(evaluateDataQuality({ catalog: listDataCatalog(), sources: listSources() })));
app.post('/api/data-quality/validate', (req, res) => { const source = listSources().find((item) => item.id === req.body?.sourceId) || {}; res.json(validateDataRecord(req.body || {}, source)); });
app.get('/api/contracts', (req, res) => res.json(listSchemas()));
app.get('/api/contracts/readiness', (req, res) => res.json(getSchemaRegistryReadiness()));
app.get('/api/contracts/:id', (req, res) => { const result = getSchema(req.params.id); if (!result) return res.status(404).json({ error: 'Contrato no encontrado' }); res.json(result); });
app.get('/api/connectors', (req, res) => res.json(listConnectors()));
app.get('/api/connectors/readiness', (req, res) => res.json(getConnectorContractReadiness()));
app.get('/api/connectors/:id', (req, res) => { const result = getConnector(req.params.id); if (!result) return res.status(404).json({ error: 'Conector no encontrado' }); res.json(result); });
app.post('/api/connectors/:id/validate', (req, res) => { const result = validateConnectorPayload(req.params.id, req.body || {}); if (!result) return res.status(404).json({ error: 'Conector no encontrado' }); res.json(result); });
app.get('/api/regulatory/frameworks', (req, res) => res.json(listRegulatoryFrameworks()));
app.get('/api/regulatory/frameworks/:id', (req, res) => { const result = getRegulatoryFramework(req.params.id); if (!result) return res.status(404).json({ error: 'Marco regulatorio no encontrado' }); res.json(result); });
app.post('/api/regulatory/evidence-map', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => { try { res.json(buildRegulatoryEvidenceMap(req.body || {})); } catch (error) { res.status(400).json({ error: error.message }); } });
app.post('/api/recovery/profile', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => { try { res.json(buildRecoveryProfile(req.body || {})); } catch (error) { res.status(400).json({ error: error.message }); } });
app.get('/api/actions/library/readiness', (req, res) => res.json(getActionLibraryReadiness()));
app.get('/api/actions/library', (req, res) => res.json(listActions({ type: req.query.type, providerType: req.query.providerType })));
app.get('/api/actions/library/:id', (req, res) => { const result = getAction(req.params.id); if (!result) return res.status(404).json({ error: 'Accion no encontrada' }); res.json(result); });
app.post('/api/actions/recommendations', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => res.json(recommendActions(req.body || {})));
app.post('/api/ingest/validate', (req, res) => { try { res.json({ valid: true, event: validateEventEnvelope(req.body || {}) }); } catch (error) { res.status(400).json({ valid: false, error: error.message }); } });
app.get('/api/graph', (req, res) => { try { res.json({ ...buildImpactGraph({ cableId: req.query.cableId, verticalId: req.query.verticalId, asOf: req.query.asOf }), temporalFilter: { asOf: req.query.asOf || new Date().toISOString(), edgeValidityApplied: true } }); } catch (error) { res.status(400).json({ error: error.message }); } });
app.get('/api/graph/paths', (req, res) => {
  let result;
  try { result = getImpactPaths(req.query.cableId, req.query.verticalId, req.query.asOf); } catch (error) { return res.status(400).json({ error: error.message }); }
  if (!result) return res.status(404).json({ error: 'Cable o vertical no encontrado' });
  res.json({ ...result, evidenceClass: 'inferred' });
});
app.get('/api/playbooks', (req, res) => res.json(listPlaybooks()));
app.get('/api/playbooks/:id', (req, res) => {
  const result = getPlaybook(req.params.id);
  if (!result) return res.status(404).json({ error: 'Playbook no encontrado' });
  res.json(result);
});
app.post('/api/entities/resolve', (req, res) => {
  try { res.json(resolveEntity(req.body?.type, req.body?.query)); }
  catch (error) { res.status(400).json({ error: error.message }); }
});
app.post('/api/action-plans/preview', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => {
  try {
    const plan = attachDecisionEvidence(buildActionPlan(req.body || {}), req.body || {});
    const dataQualityGate = evaluateDataQuality({ catalog: listDataCatalog(), sources: listSources() });
    res.json({ ...plan, dataQualityGate, materialRecommendationAllowed: dataQualityGate.ready && !plan.decision.startsWith('abstain') });
  }
  catch (error) { res.status(400).json({ error: error.message }); }
});
app.get('/api/tenancy/context', authIfConfigured, (req, res) => res.json({
  organizationId: req.user?.organizationId || DEFAULT_ORGANIZATION_ID,
  isolation: 'local-action-plans',
  mode: process.env.APP_MODE || 'demo',
  authRequired: process.env.AUTH_REQUIRED === 'true',
  disclaimer: 'Contexto local; el aislamiento definitivo se aplica con RLS al conectar Supabase.'
}));
app.get('/api/action-plans', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => res.json(listActionPlans({ organizationId: req.user?.organizationId || DEFAULT_ORGANIZATION_ID, caseId: req.query.caseId, status: req.query.status, limit: req.query.limit })));
app.get('/api/action-plans/metrics', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => res.json(getActionPlanOutcomeMetrics(req.user?.organizationId || DEFAULT_ORGANIZATION_ID)));
app.get('/api/action-plans/timing', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => res.json(getActionPlanTimingMetrics(req.user?.organizationId || DEFAULT_ORGANIZATION_ID)));
app.get('/api/benchmarks/sectors', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => res.json(getAnonymousSectorBenchmark(Math.max(3, Math.min(20, Number(req.query.minCohort) || 3)))));
app.post('/api/network/cooperative/preview', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => res.json(buildCooperativeIncidentPreview({ alerts: listAlerts({ limit: 200, organizationId: req.user?.organizationId || DEFAULT_ORGANIZATION_ID }), minCohort: req.body?.minCohort, consent: req.body?.consent })));
app.post('/api/assistant/suggestion', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => {
  const validation = getModelValidationReport();
  const model = listModels().find((item) => item.id === 'impact-cascade');
  const calibration = getCalibrationOverview('impact-cascade');
  const modelGovernance = buildModelGovernance(model, validation, calibration, benchmarkCalibration(calibration));
  const dataQualityGate = evaluateDataQuality({ catalog: listDataCatalog(), sources: listSources() });
  res.json(buildAssistiveSuggestion(req.body || {}, { dataQualityGate, modelGovernance }));
});
app.get('/api/action-plans/:id', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => {
  const result = getActionPlan(req.params.id, req.user?.organizationId || DEFAULT_ORGANIZATION_ID);
  if (!result) return res.status(404).json({ error: 'Plan de acción no encontrado' });
  res.json(result);
});
app.post('/api/action-plans', authIfConfigured, roleIfConfigured('admin', 'risk_analyst'), (req, res) => {
  try { res.status(201).json(createActionPlan(req.body || {}, req.user?.email || 'operator', req.user?.organizationId || DEFAULT_ORGANIZATION_ID)); }
  catch (error) { res.status(400).json({ error: error.message }); }
});
app.patch('/api/action-plans/:id', authIfConfigured, roleIfConfigured('admin', 'risk_analyst'), (req, res) => {
  try {
    const result = updateActionPlan(req.params.id, req.body || {}, req.user?.email || 'operator', req.user?.organizationId || DEFAULT_ORGANIZATION_ID);
    if (!result) return res.status(404).json({ error: 'Plan de acción no encontrado' });
    res.json(result);
  } catch (error) { res.status(400).json({ error: error.message }); }
});
app.post('/api/action-plans/:id/outcome', authIfConfigured, roleIfConfigured('admin', 'risk_analyst'), (req, res) => {
  try {
    const result = recordActionPlanOutcome(req.params.id, req.body || {}, req.user?.email || 'operator', req.user?.organizationId || DEFAULT_ORGANIZATION_ID);
    if (!result) return res.status(404).json({ error: 'Plan de acción no encontrado' });
    res.json(result);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.get('/api/verticals', (req, res) => {
  res.json(VERTICALS);
});

app.get('/api/cables', (req, res) => {
  res.json(CABLES.map(({ vertical_weights: _verticalWeights, ...c }) => c));
});

app.get('/api/chokepoints', (req, res) => {
  res.json(CHOKEPOINTS);
});

app.get('/api/alerts', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => {
  const filters = { status: req.query.status, severity: req.query.severity, region: req.query.region, vertical: req.query.vertical, q: req.query.q, limit: req.query.limit, offset: req.query.offset, organizationId: req.user?.organizationId || DEFAULT_ORGANIZATION_ID };
  res.set('x-total-count', String(countAlerts(filters))).set('x-offset', String(Number(req.query.offset) || 0)).set('x-limit', String(Number(req.query.limit) || 200));
  res.json(listAlerts(filters));
});
app.get('/api/alerts/:id', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => {
  const item = getAlert(req.params.id, req.user?.organizationId || DEFAULT_ORGANIZATION_ID);
  if (!item) return res.status(404).json({ error: 'Alerta no encontrada' });
  res.json(item);
});
app.patch('/api/alerts/:id', authIfConfigured, roleIfConfigured('admin', 'risk_analyst'), (req, res) => {
  try {
    const item = updateAlert(req.params.id, req.body || {}, req.user?.email || req.get('x-actor') || 'operator', req.user?.organizationId || DEFAULT_ORGANIZATION_ID);
    if (!item) return res.status(404).json({ error: 'Alerta no encontrada' });
    res.json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
app.post('/api/ingest/events', authIfConfigured, roleIfConfigured('admin', 'risk_analyst'), (req, res) => {
  try {
    const result = ingestEvent(req.body || {}, req.user?.email || 'connector', req.user?.organizationId || DEFAULT_ORGANIZATION_ID);
    res.status(result.created ? 201 : 200).json(result);
  } catch (error) {
    recordDeadLetter(req.body || {}, error, req.user?.email || 'connector', req.user?.organizationId || DEFAULT_ORGANIZATION_ID);
    res.status(400).json({ error: error.message });
  }
});
app.get('/api/ingest/dead-letters', authIfConfigured, roleIfConfigured('admin', 'risk_analyst'), (req, res) => res.json(listDeadLetters(req.query.status, req.user?.organizationId || DEFAULT_ORGANIZATION_ID)));
app.post('/api/ingest/dead-letters/:id/retry', authIfConfigured, roleIfConfigured('admin', 'risk_analyst'), (req, res) => {
  const item = retryDeadLetter(req.params.id, req.body?.payload, req.user?.email || 'operator', req.user?.organizationId || DEFAULT_ORGANIZATION_ID);
  if (!item) return res.status(404).json({ error: 'Dead letter no encontrada' });
  res.status(item.status === 'resolved' ? 200 : 202).json(item);
});
app.post('/api/alerts/:id/convert-to-case', authIfConfigured, roleIfConfigured('admin', 'risk_analyst'), (req, res) => {
  const result = createCaseFromAlert(req.params.id, req.user?.email || 'system', req.user?.organizationId || DEFAULT_ORGANIZATION_ID);
  if (!result) return res.status(404).json({ error: 'Alerta no encontrada' });
  res.status(result.created ? 201 : 200).json(result);
});
app.get('/api/cases', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => {
  const filters = { vertical: req.query.vertical, status: req.query.status, priority: req.query.priority, owner: req.query.owner, sort: req.query.sort, q: req.query.q, limit: req.query.limit, offset: req.query.offset, organizationId: req.user?.organizationId || DEFAULT_ORGANIZATION_ID };
  res.set('x-total-count', String(countCases(filters))).set('x-offset', String(Number(req.query.offset) || 0)).set('x-limit', String(Number(req.query.limit) || 200));
  res.json(listCases(filters));
});
app.get('/api/cases/:id', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => {
  const item = getCase(req.params.id, req.user?.organizationId || DEFAULT_ORGANIZATION_ID);
  if (!item) return res.status(404).json({ error: 'Caso no encontrado' });
  res.json(item);
});
app.patch('/api/cases/:id', authIfConfigured, roleIfConfigured('admin', 'risk_analyst'), (req, res) => {
  try {
    const item = updateCase(req.params.id, req.body, req.get('x-actor') || 'operator', req.user?.organizationId || DEFAULT_ORGANIZATION_ID);
    if (!item) return res.status(404).json({ error: 'Caso no encontrado' });
    res.json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
app.get('/api/cases/:id/audit', (req, res) => {
  const filters = { q: req.query.q, limit: req.query.limit, offset: req.query.offset };
  const organizationId = req.user?.organizationId || DEFAULT_ORGANIZATION_ID;
  res.set('x-total-count', String(countAudit(req.params.id, filters, organizationId))).json(listAudit(req.params.id, filters, organizationId));
});
app.get('/api/cases/:id/decision-package', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => {
  const item = getDecisionPackage(req.params.id, req.user?.organizationId || DEFAULT_ORGANIZATION_ID);
  if (!item) return res.status(404).json({ error: 'Caso no encontrado' });
  const organizationId = req.user?.organizationId || DEFAULT_ORGANIZATION_ID;
  const enriched = { ...item, actionPlans: listActionPlans({ organizationId, caseId: req.params.id }), recoveryProfile: buildRecoveryProfile({ cableId: 'seamewe3', severity: 'total', horizons: [24, 168, 720] }), regulatoryEvidenceMap: buildRegulatoryEvidenceMap({ scope: req.params.id, evidence: [] }), packageCapabilities: ['case', 'alert', 'sources', 'models', 'scenarios', 'audit', 'comments', 'action_plans', 'recovery_counterfactual', 'regulatory_evidence'] };
  if (req.query.format === 'markdown' || req.query.format === 'md') {
    const caseItem = enriched.case || {};
    const alert = enriched.alert || {};
    const chain = enriched.evidenceChain || {};
    const lines = [`# Paquete de decisión — ${caseItem.id || req.params.id}`, '', `- **Título:** ${caseItem.title || 'Sin título'}`, `- **Estado:** ${caseItem.status || 'no disponible'}`, `- **Prioridad:** ${caseItem.priority || 'no disponible'}`, `- **Responsable:** ${caseItem.owner || 'sin asignar'}`, `- **Alerta asociada:** ${alert.id || 'no disponible'}`, '', '## Decisión y evidencia', '', `- Fuentes observadas: ${(chain.observedSourceIds || []).join(', ') || 'ninguna'}`, `- Modelos inferidos: ${(chain.inferredModelIds || []).join(', ') || 'ninguno'}`, `- Escenarios asumidos: ${chain.assumedScenarioCount ?? 0}`, `- Planes de acción: ${(enriched.actionPlans || []).length}`, '', '## Limitaciones', '', 'Este paquete es un artefacto local para revisión humana. No acredita cumplimiento, no valida causalidad de mercado y no ejecuta acciones externas.', '', `Generado: ${new Date().toISOString()}`];
    return res.type('text/markdown').set('Content-Disposition', `attachment; filename="decision-package-${req.params.id}.md"`).send(lines.join('\n'));
  }
  res.type('application/json').set('Content-Disposition', `attachment; filename="decision-package-${req.params.id}.json"`).send(JSON.stringify(enriched, null, 2));
});
app.get('/api/cases/:id/shares', authIfConfigured, roleIfConfigured('admin', 'risk_analyst'), (req, res) => res.json(listDecisionShares(req.params.id, req.user?.organizationId || DEFAULT_ORGANIZATION_ID)));
app.post('/api/cases/:id/shares', authIfConfigured, roleIfConfigured('admin', 'risk_analyst'), (req, res) => {
  try {
    const result = createDecisionShare(req.params.id, req.body || {}, req.user?.email || 'operator', req.user?.organizationId || DEFAULT_ORGANIZATION_ID);
    if (!result) return res.status(404).json({ error: 'Caso no encontrado' });
    res.status(201).json(result);
  } catch (error) { res.status(400).json({ error: error.message }); }
});
app.post('/api/cases/:caseId/shares/:shareId/revoke', authIfConfigured, roleIfConfigured('admin', 'risk_analyst'), (req, res) => {
  const result = revokeDecisionShare(req.params.caseId, req.params.shareId, req.user?.email || 'operator', req.user?.organizationId || DEFAULT_ORGANIZATION_ID);
  if (!result) return res.status(404).json({ error: 'Enlace de decisión no encontrado' });
  res.json(result);
});

function shareRateLimit(req, res, next) {
  const now = Date.now();
  const key = `${req.ip || 'local'}:${req.params.token}`;
  const current = shareRequestCounts.get(key) || { startedAt: now, count: 0 };
  if (now - current.startedAt > SHARE_RATE_WINDOW_MS) { current.startedAt = now; current.count = 0; }
  current.count += 1;
  shareRequestCounts.set(key, current);
  const remaining = Math.max(0, SHARE_RATE_LIMIT - current.count);
  res.set('x-ratelimit-limit', String(SHARE_RATE_LIMIT));
  res.set('x-ratelimit-remaining', String(remaining));
  res.set('x-ratelimit-reset', String(Math.ceil((current.startedAt + SHARE_RATE_WINDOW_MS) / 1000)));
  if (shareRequestCounts.size > 5000) {
    for (const [entryKey, entry] of shareRequestCounts) {
      if (now - entry.startedAt > SHARE_RATE_WINDOW_MS) shareRequestCounts.delete(entryKey);
    }
  }
  if (current.count > SHARE_RATE_LIMIT) {
    res.set('retry-after', '60');
    return res.status(429).json({ error: 'Límite de acceso al enlace excedido', retryAfterSeconds: 60 });
  }
  next();
}

app.get('/api/shares/:token', shareRateLimit, (req, res) => {
  const result = getDecisionPackageByShareToken(req.params.token);
  if (!result) return res.status(404).json({ error: 'Enlace inexistente, revocado o expirado' });
  if (['markdown', 'md'].includes(String(req.query.format || '').toLowerCase())) return res.type('text/markdown').set('Cache-Control', 'no-store').set('Content-Disposition', 'attachment; filename="shared-decision-package.md"').send(decisionPackageToMarkdown(result));
  res.set('Cache-Control', 'no-store').json(result);
});
app.get('/api/audit/export', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => {
  const filters = { q: req.query.q };
  if (req.query.entityId && !getCase(req.query.entityId, req.user?.organizationId || DEFAULT_ORGANIZATION_ID)) return res.status(404).json({ error: 'Entidad no encontrada' });
  const items = listAudit(req.query.entityId, filters, req.user?.organizationId || DEFAULT_ORGANIZATION_ID);
  if (req.query.format === 'csv') {
    const rows = [['ID', 'Entidad', 'Entidad ID', 'Acción', 'Actor', 'Mensaje', 'Creado'], ...items.map((item) => [item.id, item.entityType, item.entityId, item.action, item.actor, item.message, item.createdAt])];
    res.type('text/csv').set('Content-Disposition', 'attachment; filename="audit-export.csv"').send(rows.map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n'));
    return;
  }
  res.type('application/json').set('Content-Disposition', 'attachment; filename="audit-export.json"').send(JSON.stringify(items, null, 2));
});
app.get('/api/audit/integrity', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => res.json(getAuditIntegrity()));
app.get('/api/ops/sla', (req, res) => res.json(getSlaOverview({ vertical: req.query.vertical })));
app.get('/api/ops/source-health', (req, res) => res.json(getSourceHealthOverview()));
app.get('/api/cases/:id/comments', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => res.json(listComments(req.params.id, req.user?.organizationId || DEFAULT_ORGANIZATION_ID)));
app.post('/api/cases/:id/comments', authIfConfigured, roleIfConfigured('admin', 'risk_analyst'), (req, res) => {
  try {
    const item = addComment(req.params.id, req.body?.body, req.user?.email || 'operator', req.user?.organizationId || DEFAULT_ORGANIZATION_ID);
    if (!item) return res.status(404).json({ error: 'Caso no encontrado' });
    res.status(201).json(item);
  } catch (error) { res.status(400).json({ error: error.message }); }
});
app.get('/api/scenarios', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => res.json(listScenarios(req.user?.organizationId || DEFAULT_ORGANIZATION_ID)));
app.get('/api/scenarios/compare', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => {
  try {
    const ids = String(req.query.ids || '').split(',').map((id) => id.trim()).filter(Boolean);
    res.json(compareScenarios(ids, req.user?.organizationId || DEFAULT_ORGANIZATION_ID));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
app.post('/api/scenarios', authIfConfigured, roleIfConfigured('admin', 'risk_analyst'), (req, res) => {
  try {
    res.status(201).json(createScenario(req.body || {}, req.user?.email || 'operator', req.user?.organizationId || DEFAULT_ORGANIZATION_ID));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
app.get('/api/sources', (req, res) => res.json(listSources()));
app.get('/api/sources/:id', (req, res) => {
  const source = getSource(req.params.id);
  if (!source) return res.status(404).json({ error: 'Fuente no encontrada' });
  res.json(source);
});
app.get('/api/models', (req, res) => res.json(listModels()));
app.get('/api/models/validation', (req, res) => res.json(getModelValidationReport()));
app.get('/api/models/calibration', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => res.json(getCalibrationOverview(req.query.modelId, req.user?.organizationId || DEFAULT_ORGANIZATION_ID)));
app.get('/api/models/calibration/benchmark', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => res.json(benchmarkCalibration(getCalibrationOverview(req.query.modelId, req.user?.organizationId || DEFAULT_ORGANIZATION_ID))));
app.get('/api/models/governance', (req, res) => { const validation = getModelValidationReport(); res.json(listModels().map((model) => { const calibration = getCalibrationOverview(model.id); return buildModelGovernance(model, validation, calibration, benchmarkCalibration(calibration)); })); });
app.get('/api/models/governance/:id', (req, res) => { const model = listModels().find((item) => item.id === req.params.id); if (!model) return res.status(404).json({ error: 'Modelo no encontrado' }); const validation = getModelValidationReport(); const calibration = getCalibrationOverview(model.id); res.json(buildModelGovernance(model, validation, calibration, benchmarkCalibration(calibration))); });
app.get('/api/pilots/readiness', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => {
  const organizationId = req.user?.organizationId || DEFAULT_ORGANIZATION_ID;
  const modelGovernance = listModels().map((model) => { const calibration = getCalibrationOverview(model.id, organizationId); return buildModelGovernance(model, getModelValidationReport(), calibration, benchmarkCalibration(calibration)); });
  res.json(buildPilotReadiness({ runtime: getRuntimeReadiness(), catalog: getDataCatalogReadiness(), sourceHealth: getSourceHealthOverview(), modelGovernance, actionLibrary: getActionLibraryReadiness(), tenancy: { organizationId }, pilotFeedback: listPilotFeedback(organizationId), historicalFixtures: getCalibrationOverview(undefined, organizationId).fixtures || [] }));
});
app.get('/api/pilots/interview-guide', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => res.json(getPilotInterviewGuide()));
app.get('/api/pilots/metrics', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => { const organizationId = req.user?.organizationId || DEFAULT_ORGANIZATION_ID; return res.json(buildPilotMetrics({ cases: listCases({ limit: 200, organizationId }), actionPlans: listActionPlans({ limit: 200, organizationId }), sourceHealth: getSourceHealthOverview(), notifications: listNotifications(false, organizationId) })); });
app.use('/api/pilots/package', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res, next) => {
  if (!['markdown', 'md'].includes(String(req.query.format || '').toLowerCase())) return next();
  const organizationId = req.user?.organizationId || DEFAULT_ORGANIZATION_ID;
  const modelGovernance = listModels().map((model) => { const calibration = getCalibrationOverview(model.id, organizationId); return buildModelGovernance(model, getModelValidationReport(), calibration, benchmarkCalibration(calibration)); });
  const runtime = getRuntimeReadiness();
  const catalog = getDataCatalogReadiness();
  const sourceHealth = getSourceHealthOverview();
  const actionLibrary = getActionLibraryReadiness();
  const readiness = buildPilotReadiness({ runtime, catalog, sourceHealth, modelGovernance, actionLibrary, tenancy: { organizationId }, pilotFeedback: listPilotFeedback(organizationId), historicalFixtures: getCalibrationOverview(undefined, organizationId).fixtures || [] });
  const cases = listCases({ limit: 200, organizationId });
  const actionPlans = listActionPlans({ limit: 200, organizationId });
  const metrics = buildPilotMetrics({ cases, actionPlans, sourceHealth, notifications: listNotifications(false, organizationId) });
  const scorecard = buildOperationalScorecard({ alerts: listAlerts({ limit: 200, organizationId }), cases, actionPlans, sources: listSources(), deadLetters: listDeadLetters(undefined, organizationId), incidents: listIncidents({ organizationId }), calibrationFixtures: getCalibrationOverview(undefined, organizationId).fixtures || [] });
  const packet = { schemaVersion: '1.0.0-local', generatedAt: new Date().toISOString(), readiness, interviewGuide: getPilotInterviewGuide(), metrics, scorecard, feedback: listPilotFeedback(organizationId), nextActions: ['Realizar cinco entrevistas estructuradas', 'Autorizar fuentes y registrar licencias', 'Cargar 3-5 eventos históricos verificables', 'Definir baseline y criterio go/no-go'], disclaimer: 'Paquete local de preparación; no demuestra valor comercial ni sustituye validación con cliente.' };
  return res.type('text/markdown').set('Content-Disposition', 'attachment; filename="global-resilience-pilot-package.md"').send(pilotPackageToMarkdown(packet));
});
app.get('/api/pilots/package', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => {
  const organizationId = req.user?.organizationId || DEFAULT_ORGANIZATION_ID;
  const modelGovernance = listModels().map((model) => { const calibration = getCalibrationOverview(model.id, organizationId); return buildModelGovernance(model, getModelValidationReport(), calibration, benchmarkCalibration(calibration)); });
  const runtime = getRuntimeReadiness();
  const catalog = getDataCatalogReadiness();
  const sourceHealth = getSourceHealthOverview();
  const actionLibrary = getActionLibraryReadiness();
  const readiness = buildPilotReadiness({ runtime, catalog, sourceHealth, modelGovernance, actionLibrary, tenancy: { organizationId }, pilotFeedback: listPilotFeedback(organizationId), historicalFixtures: getCalibrationOverview(undefined, organizationId).fixtures || [] });
  const cases = listCases({ limit: 200, organizationId });
  const actionPlans = listActionPlans({ limit: 200, organizationId });
  const metrics = buildPilotMetrics({ cases, actionPlans, sourceHealth, notifications: listNotifications(false, organizationId) });
  const scorecard = buildOperationalScorecard({ alerts: listAlerts({ limit: 200, organizationId }), cases, actionPlans, sources: listSources(), deadLetters: listDeadLetters(undefined, organizationId), incidents: listIncidents({ organizationId }), calibrationFixtures: getCalibrationOverview(undefined, organizationId).fixtures || [] });
  res.json({ schemaVersion: '1.0.0-local', generatedAt: new Date().toISOString(), readiness, interviewGuide: getPilotInterviewGuide(), metrics, scorecard, feedback: listPilotFeedback(organizationId), nextActions: ['Realizar cinco entrevistas estructuradas', 'Autorizar fuentes y registrar licencias', 'Cargar 3-5 eventos históricos verificables', 'Definir baseline y criterio go/no-go'], disclaimer: 'Paquete local de preparación; no demuestra valor comercial ni sustituye validación con cliente.' });
});
app.get('/api/pilots/feedback', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => res.json(listPilotFeedback(req.user?.organizationId || DEFAULT_ORGANIZATION_ID)));
app.post('/api/pilots/feedback', authIfConfigured, roleIfConfigured('admin', 'risk_analyst'), (req, res) => { try { res.status(201).json(recordPilotFeedback(normalizePilotFeedback(req.body || {}), req.user?.email || 'operator', req.user?.organizationId || DEFAULT_ORGANIZATION_ID)); } catch (error) { res.status(400).json({ error: error.message }); } });
app.get('/api/incidents/runbook', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => res.json(getIncidentRunbook()));
app.get('/api/incidents', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => res.json(listIncidents({ ...req.query, organizationId: req.user?.organizationId || DEFAULT_ORGANIZATION_ID })));
app.post('/api/incidents', authIfConfigured, roleIfConfigured('admin', 'risk_analyst'), (req, res) => { try { res.status(201).json(createIncident(req.body || {}, req.user?.email || 'operator', req.user?.organizationId || DEFAULT_ORGANIZATION_ID)); } catch (error) { res.status(400).json({ error: error.message }); } });
app.patch('/api/incidents/:id', authIfConfigured, roleIfConfigured('admin', 'risk_analyst'), (req, res) => { try { const item = updateIncident(req.params.id, req.body || {}, req.user?.email || 'operator', req.user?.organizationId || DEFAULT_ORGANIZATION_ID); if (!item) return res.status(404).json({ error: 'Incidente no encontrado' }); res.json(item); } catch (error) { res.status(400).json({ error: error.message }); } });
app.get('/api/security/posture', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => res.json(buildSecurityPosture({ runtime: getRuntimeReadiness(), audit: getAuditIntegrity(), tenancy: { organizationId: DEFAULT_ORGANIZATION_ID }, snapshot: getLocalSnapshot() })));
app.post('/api/ingest/batch', authIfConfigured, roleIfConfigured('admin', 'risk_analyst'), (req, res) => {
  try {
    const validation = validateBatchInput(req.body || {}, listSources(), { production: process.env.APP_MODE === 'production' });
    if (validation.mode === 'dry_run' || !validation.readyToCommit) return res.status(validation.mode === 'dry_run' ? 200 : 422).json(validation);
    const results = validation.items.map((item) => { try { const result = ingestEvent(item.event, req.user?.email || 'connector', req.user?.organizationId || DEFAULT_ORGANIZATION_ID); return { index: item.index, externalId: item.externalId, status: result.created ? 'created' : 'duplicate', alertId: result.alert.id }; } catch (error) { return { index: item.index, externalId: item.externalId, status: 'error', error: error.message }; } });
    res.status(201).json({ ...validation, results, counts: { ...validation.counts, created: results.filter((item) => item.status === 'created').length, duplicates: results.filter((item) => item.status === 'duplicate').length, errors: results.filter((item) => item.status === 'error').length } });
  } catch (error) { res.status(400).json({ error: error.message }); }
});
app.post('/api/models/calibration/fixtures', authIfConfigured, roleIfConfigured('admin', 'risk_analyst'), (req, res) => {
  try { res.status(201).json(recordCalibrationFixtures(req.body || {}, req.user?.email || 'operator', req.user?.organizationId || DEFAULT_ORGANIZATION_ID)); }
  catch (error) { res.status(400).json({ error: error.message }); }
});
app.get('/api/models/backtest', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => res.json(buildBacktestReport(getCalibrationOverview(req.query.modelId, req.user?.organizationId || DEFAULT_ORGANIZATION_ID).fixtures, { modelId: req.query.modelId || 'all' })));
app.post('/api/models/sensitivity', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => { try { res.json(buildSensitivityAnalysis(req.body || {})); } catch (error) { res.status(400).json({ error: error.message }); } });
app.post('/api/models/uncertainty', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => { try { res.json(buildUncertaintyReport(req.body || {})); } catch (error) { res.status(400).json({ error: error.message }); } });
app.get('/api/notifications', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => res.json(listNotifications(req.query.unread === 'true', req.user?.organizationId || DEFAULT_ORGANIZATION_ID)));
app.get('/api/notifications/policy/readiness', (req, res) => res.json(getNotificationPolicyReadiness()));
app.post('/api/notifications/policy/preview', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => res.json(buildNotificationPolicy(req.body || {})));
app.post('/api/notifications/read-all', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => res.json(markAllNotificationsRead(req.user?.organizationId || DEFAULT_ORGANIZATION_ID)));
app.patch('/api/notifications/:id/read', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => {
  const item = markNotificationRead(req.params.id, req.user?.organizationId || DEFAULT_ORGANIZATION_ID);
  if (!item) return res.status(404).json({ error: 'Notificación no encontrada' });
  res.json(item);
});
app.get('/api/webhooks', authIfConfigured, roleIfConfigured('admin'), (req, res) => res.json(listWebhooks(req.user?.organizationId || DEFAULT_ORGANIZATION_ID)));
app.post('/api/webhooks', authIfConfigured, roleIfConfigured('admin'), (req, res) => {
  try { res.status(201).json(createWebhook(req.body || {}, req.user?.email || 'admin', req.user?.organizationId || DEFAULT_ORGANIZATION_ID)); }
  catch (error) { res.status(400).json({ error: error.message }); }
});
app.post('/api/webhooks/:id/rotate-secret', authIfConfigured, roleIfConfigured('admin'), (req, res) => {
  const result = rotateWebhookSecret(req.params.id, req.user?.email || 'admin', req.user?.organizationId || DEFAULT_ORGANIZATION_ID);
  if (!result) return res.status(404).json({ error: 'Webhook no encontrado' });
  res.status(200).json(result);
});
app.get('/api/webhooks/:id/deliveries', authIfConfigured, roleIfConfigured('admin'), (req, res) => res.json(listWebhookDeliveries(req.params.id, req.user?.organizationId || DEFAULT_ORGANIZATION_ID)));
app.post('/api/webhooks/:id/deliveries/:deliveryId/retry', authIfConfigured, roleIfConfigured('admin'), (req, res) => {
  const item = retryWebhookDelivery(req.params.id, req.params.deliveryId, req.user?.organizationId || DEFAULT_ORGANIZATION_ID);
  if (!item) return res.status(404).json({ error: 'Entrega no encontrada' });
  res.status(202).json(item);
});
app.post('/api/webhooks/deliveries/process-local', authIfConfigured, roleIfConfigured('admin'), (req, res) => res.status(200).json(processLocalWebhookDeliveries(req.body?.limit, req.user?.organizationId || DEFAULT_ORGANIZATION_ID)));
app.post('/api/webhooks/deliveries/process', authIfConfigured, roleIfConfigured('admin'), async (req, res) => {
  try { res.status(200).json(await processWebhookDeliveries({ limit: req.body?.limit, dryRun: req.body?.dryRun !== false, timeoutMs: req.body?.timeoutMs, organizationId: req.user?.organizationId || DEFAULT_ORGANIZATION_ID })); }
  catch (error) { res.status(500).json({ error: error.message, requestId: req.requestId }); }
});
app.get('/api/jobs', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => res.json(listJobRuns(req.user?.organizationId || DEFAULT_ORGANIZATION_ID)));
app.post('/api/jobs/demo-ingest', authIfConfigured, roleIfConfigured('admin', 'risk_analyst'), (req, res) => res.status(201).json(runDemoIngestionJob(req.user?.email || 'scheduler', req.user?.organizationId || DEFAULT_ORGANIZATION_ID)));
app.post('/api/jobs/sla-sweep', authIfConfigured, roleIfConfigured('admin', 'risk_analyst'), (req, res) => res.status(201).json(runSlaSweep(req.user?.email || 'scheduler', req.user?.organizationId || DEFAULT_ORGANIZATION_ID)));
app.post('/api/jobs/source-health-sweep', authIfConfigured, roleIfConfigured('admin', 'risk_analyst'), (req, res) => res.status(201).json(runSourceHealthSweep(req.user?.email || 'scheduler', req.user?.organizationId || DEFAULT_ORGANIZATION_ID)));
app.get('/api/metrics/overview', (req, res) => res.json(getOverviewMetrics({ vertical: req.query.vertical })));
 app.get('/api/metrics/scorecard', authIfConfigured, roleIfConfigured('admin', 'risk_analyst', 'viewer'), (req, res) => { const organizationId = req.user?.organizationId || DEFAULT_ORGANIZATION_ID; return res.json(buildOperationalScorecard({ alerts: listAlerts({ limit: 200, organizationId }), cases: listCases({ limit: 200, organizationId }), actionPlans: listActionPlans({ limit: 200, organizationId }), sources: listSources(), deadLetters: listDeadLetters(undefined, organizationId), incidents: listIncidents({ organizationId }), calibrationFixtures: getCalibrationOverview(undefined, organizationId).fixtures || [] })); });
app.get('/api/briefs/latest', (req, res) => res.json(getLatestBrief({ audience: req.query.audience })));
app.get('/api/briefs/latest/export', (req, res) => {
  const brief = getLatestBrief({ audience: req.query.audience });
  if (req.query.format === 'csv') {
    const rows = [['Campo', 'Valor'], ['Resilience score', brief.resilienceScore], ['Exposición USD', brief.exposureUsd], ['Eventos materiales', brief.materialEvents], ['Decisión requerida', brief.decisionRequired], ['Recomendación', brief.recommendation], ['Valor protegido USD', brief.protectedValueUsd], ['Confianza', brief.confidence]];
    res.type('text/csv').set('Content-Disposition', 'attachment; filename="resilience-brief.csv"').send(rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n'));
    return;
  }
  res.type('application/json').set('Content-Disposition', 'attachment; filename="resilience-brief.json"').send(JSON.stringify(brief, null, 2));
});

app.get('/api/cables/:id', (req, res) => {
  const cable = CABLES.find((c) => c.id === req.params.id);
  if (!cable) return res.status(404).json({ error: 'Cable no encontrado' });
  res.json(cable);
});

app.post('/api/simulate-rupture', (req, res) => {
  try {
    const input = validateSimulationInput(req.body);
    const result = computeImpact(input.cableId, input.severity, input.durationHours);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada', requestId: req.requestId }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  console.error(`[${req.requestId}] ${error.message}`);
  res.status(error.status || 500).json({ error: error.status ? error.message : 'Error interno del servicio', requestId: req.requestId });
});

export function startServer(port = PORT) {
  if (process.env.NODE_ENV !== 'test' && process.env.AUTH_REQUIRED === 'true' && (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32)) {
    throw new Error('AUTH_SECRET debe existir y tener al menos 32 caracteres cuando AUTH_REQUIRED=true');
  }
  return app.listen(port, () => {
    console.log(`\n  Global Resilience OS - mini-backend corriendo en http://localhost:${port}`);
    console.log(`  Prueba: curl http://localhost:${port}/api/health\n`);
  });
}

export async function stopServer(server, timeoutMs = 10_000) {
  if (!server?.listening) return flushPersistence();
  const closePromise = new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  let timer;
  try {
    await Promise.race([
      Promise.all([flushPersistence(), closePromise]),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Tiempo de cierre agotado')), timeoutMs); }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const server = startServer();
  const shutdown = async (signal) => {
    console.log(`\n${signal} recibido; vaciando persistencia y cerrando servidor.`);
    try { await stopServer(server); process.exit(0); }
    catch (error) { console.error(`Cierre incompleto: ${error.message}`); process.exit(1); }
  };
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
}
