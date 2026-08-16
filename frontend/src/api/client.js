import { computeImpact } from '../engine/impactEngine';
import { CABLES } from '../data/cables';
import { VERTICALS } from '../data/verticals';

// URL del mini-backend. Si no responde en BACKEND_TIMEOUT_MS, el cliente
// cae automáticamente al motor de cálculo local (misma lógica, corre en
// el navegador) — así la demo funciona igual de bien standalone (sin
// backend corriendo, ej. abierta desde un build estático en una laptop
// sin internet) que conectada a un backend real.
const CONFIGURED_BACKEND_URL = String(import.meta.env.VITE_BACKEND_URL || '').trim();
const BACKEND_URL = CONFIGURED_BACKEND_URL || 'http://localhost:4000';
const BACKEND_REQUIRED = String(import.meta.env.VITE_BACKEND_REQUIRED || 'false').toLowerCase() === 'true';
const BACKEND_TIMEOUT_MS = 1200;

export function isBackendRequired() {
  return BACKEND_REQUIRED;
}

export function getBackendUrl() {
  return BACKEND_URL;
}

function localFallback(value, error) {
  setBackendStatus('offline');
  if (BACKEND_REQUIRED) {
    const failure = new Error('El backend es obligatorio y no esta disponible.');
    failure.cause = error;
    failure.code = 'BACKEND_REQUIRED';
    failure.status = error?.status || null;
    failure.requestId = error?.requestId || null;
    throw failure;
  }
  return value;
}

async function fetchWithTimeout(url, options = {}, timeout = BACKEND_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('resilience_token') : null;
    const headers = { ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    const tenantId = String(import.meta.env.VITE_TENANT_ID || '').trim();
    if (tenantId) headers['x-tenant-id'] = tenantId;
    const res = await fetch(url, { ...options, headers, signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) {
      let payload = null;
      try { payload = await res.json(); } catch { /* respuestas no JSON */ }
      const error = new Error(payload?.error || `HTTP ${res.status}`);
      error.status = res.status;
      error.requestId = res.headers.get('x-request-id') || null;
      throw error;
    }
    return await res.json();
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

let backendStatus = 'unknown'; // 'unknown' | 'online' | 'offline'
const listeners = new Set();

function setBackendStatus(status) {
  if (backendStatus !== status) {
    backendStatus = status;
    listeners.forEach((cb) => cb(status));
  }
}

export function onBackendStatusChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getBackendStatus() {
  return backendStatus;
}

export async function login(email, password) {
  const data = await fetchWithTimeout(`${BACKEND_URL}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  localStorage.setItem('resilience_token', data.token);
  localStorage.setItem('resilience_user', JSON.stringify(data.user));
  return data;
}

export async function logout() {
  const token = localStorage.getItem('resilience_token');
  try {
    if (token) await fetch(`${BACKEND_URL}/api/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  } finally {
    localStorage.removeItem('resilience_token');
    localStorage.removeItem('resilience_user');
  }
}

export async function getCurrentUser() {
  const token = localStorage.getItem('resilience_token');
  if (!token) return null;
  try {
    const data = await fetchWithTimeout(`${BACKEND_URL}/api/auth/me`);
    localStorage.setItem('resilience_user', JSON.stringify(data.user));
    return data.user;
  } catch {
    await logout();
    return null;
  }
}

export async function checkBackend() {
  try {
    await fetchWithTimeout(`${BACKEND_URL}/api/health`);
    setBackendStatus('online');
    return true;
  } catch {
    setBackendStatus('offline');
    return false;
  }
}

export async function simulateRupture(cableId, severity, durationHours) {
  try {
    const data = await fetchWithTimeout(`${BACKEND_URL}/api/simulate-rupture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cableId, severity, durationHours }),
    });
    setBackendStatus('online');
    return { ...data, source: 'backend' };
  } catch (error) {
    setBackendStatus('offline');
    // Fallback: mismo cálculo, ejecutado localmente en el navegador
    const data = computeImpact(cableId, severity, durationHours);
    return { ...localFallback(data, error), source: 'local' };
  }
}

export async function getCables() {
  try {
    const data = await fetchWithTimeout(`${BACKEND_URL}/api/cables`);
    setBackendStatus('online');
    return data;
  } catch (error) {
    setBackendStatus('offline');
    return localFallback(CABLES.map(({ vertical_weights: _verticalWeights, ...c }) => c), error);
  }
}

export async function getVerticals() {
  try {
    const data = await fetchWithTimeout(`${BACKEND_URL}/api/verticals`);
    setBackendStatus('online');
    return data;
  } catch (error) {
    setBackendStatus('offline');
    return localFallback(VERTICALS, error);
  }
}

export async function getCases(filters = {}) {
  try {
    const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
    const data = await fetchWithTimeout(`${BACKEND_URL}/api/cases${query.toString() ? `?${query}` : ''}`);
    setBackendStatus('online');
    return data;
  } catch (error) {
    setBackendStatus('offline');
    return localFallback([], error);
  }
}

export async function updateCase(caseId, patch) {
  const data = await fetchWithTimeout(`${BACKEND_URL}/api/cases/${caseId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'x-actor': 'operator' },
    body: JSON.stringify(patch),
  });
  setBackendStatus('online');
  return data;
}

export async function getLatestBrief() {
  try {
    const data = await fetchWithTimeout(`${BACKEND_URL}/api/briefs/latest`);
    setBackendStatus('online');
    return data;
  } catch (error) {
    setBackendStatus('offline');
    return localFallback(null, error);
  }
}

export async function getAlerts(filters = {}) {
  try {
    const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
    const data = await fetchWithTimeout(`${BACKEND_URL}/api/alerts${query.toString() ? `?${query}` : ''}`);
    setBackendStatus('online');
    return data;
  } catch (error) {
    setBackendStatus('offline');
    return localFallback([], error);
  }
}

export async function convertAlertToCase(alertId) {
  const data = await fetchWithTimeout(`${BACKEND_URL}/api/alerts/${alertId}/convert-to-case`, { method: 'POST' });
  setBackendStatus('online');
  return data;
}

export async function updateAlert(alertId, patch) {
  const data = await fetchWithTimeout(`${BACKEND_URL}/api/alerts/${alertId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-actor': 'operator' }, body: JSON.stringify(patch) });
  setBackendStatus('online');
  return data;
}

export async function getOverviewMetrics(filters = {}) {
  try {
    const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
    const data = await fetchWithTimeout(`${BACKEND_URL}/api/metrics/overview${query.toString() ? `?${query}` : ''}`);
    setBackendStatus('online');
    return data;
  } catch (error) {
    return localFallback(null, error);
  }
}

export async function getSources() {
  try {
    const data = await fetchWithTimeout(`${BACKEND_URL}/api/sources`);
    setBackendStatus('online');
    return data;
  } catch (error) {
    return localFallback([], error);
  }
}

export async function getModels() {
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/models`); } catch (error) { return localFallback([], error); }
}

export async function getModelProfiles({ vertical = '', region = 'global' } = {}) {
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/models/profiles?vertical=${encodeURIComponent(vertical)}&region=${encodeURIComponent(region)}`); } catch (error) { return localFallback({ selection: { vertical, region }, region: { label: region === 'global' ? 'Global' : region, operatingContext: 'Contexto local standalone sin conexión' }, vertical: { label: vertical, decisionLenses: [] }, dataNeeds: [], readiness: { productionReady: false }, error: error.message }, error); }
}

export async function buildPilotValueCase(input) {
  return fetchWithTimeout(`${BACKEND_URL}/api/pilots/value-case`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
}

export async function createScenario(input) {
  const data = await fetchWithTimeout(`${BACKEND_URL}/api/scenarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  setBackendStatus('online');
  return data;
}

export async function ingestEvent(input) {
  const data = await fetchWithTimeout(`${BACKEND_URL}/api/ingest/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  setBackendStatus('online');
  return data;
}

export async function ingestBatch(input) {
  const data = await fetchWithTimeout(`${BACKEND_URL}/api/ingest/batch`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  setBackendStatus('online');
  return data;
}

export async function getOperationalScorecard() { return fetchWithTimeout(`${BACKEND_URL}/api/metrics/scorecard`); }

export async function previewCooperativeNetwork(input = {}) {
  return fetchWithTimeout(`${BACKEND_URL}/api/network/cooperative/preview`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
}

export async function getDeadLetters(status = '') {
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/ingest/dead-letters${status ? `?status=${encodeURIComponent(status)}` : ''}`); } catch (error) { return localFallback([], error); }
}

export async function retryDeadLetter(id, payload) {
  return fetchWithTimeout(`${BACKEND_URL}/api/ingest/dead-letters/${id}/retry`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload ? { payload } : {}) });
}

export async function getCaseAudit(caseId, filters = {}) {
  try {
    const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
    const data = await fetchWithTimeout(`${BACKEND_URL}/api/cases/${caseId}/audit${query.toString() ? `?${query}` : ''}`);
    setBackendStatus('online');
    return data;
  } catch (error) {
    return localFallback([], error);
  }
}

export async function getScenarios() {
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/scenarios`); } catch (error) { return localFallback([], error); }
}

export async function compareScenarios(ids) {
  return fetchWithTimeout(`${BACKEND_URL}/api/scenarios/compare?ids=${ids.join(',')}`);
}

export async function getNotifications(unread = false) {
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/notifications${unread ? '?unread=true' : ''}`); } catch (error) { return localFallback([], error); }
}

export async function markNotificationRead(id) {
  return fetchWithTimeout(`${BACKEND_URL}/api/notifications/${id}/read`, { method: 'PATCH' });
}

export async function markAllNotificationsRead() {
  return fetchWithTimeout(`${BACKEND_URL}/api/notifications/read-all`, { method: 'POST' });
}

export async function previewNotificationPolicy(input) {
  return fetchWithTimeout(`${BACKEND_URL}/api/notifications/policy/preview`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
}

export async function getCaseComments(caseId) {
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/cases/${caseId}/comments`); } catch (error) { return localFallback([], error); }
}

export async function addCaseComment(caseId, body) {
  return fetchWithTimeout(`${BACKEND_URL}/api/cases/${caseId}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body }) });
}

export async function getJobs() {
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/jobs`); } catch (error) { return localFallback([], error); }
}

export async function getReadiness() {
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/health/readiness`); } catch (error) { return localFallback({ ready: false, error: error.message, checks: {} }, error); }
}

export async function getComplianceReadiness() {
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/compliance/readiness`); } catch (error) { return localFallback({ ready: false, disclaimer: error.message, controls: [] }, error); }
}

export async function getRegulatoryFrameworks() {
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/regulatory/frameworks`); } catch (error) { return localFallback([], error); }
}

export async function buildRegulatoryEvidenceMap(input) {
  return fetchWithTimeout(`${BACKEND_URL}/api/regulatory/evidence-map`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
}

export async function getRecoveryProfile(input) {
  return fetchWithTimeout(`${BACKEND_URL}/api/recovery/profile`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
}

export async function getDataQualityReport() {
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/quality/report`); } catch (error) { return localFallback({ ready: false, checks: [], error: error.message }, error); }
}

export async function getAuditIntegrity() {
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/audit/integrity`); } catch (error) { return localFallback({ valid: false, sealed: false, entries: 0, mismatches: [], error: error.message }, error); }
}

export async function getSlaOverview(filters = {}) {
  try { const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value)); return await fetchWithTimeout(`${BACKEND_URL}/api/ops/sla${query.toString() ? `?${query}` : ''}`); } catch (error) { return localFallback({ ready: false, counts: {}, cases: [], error: error.message }, error); }
}

export async function getSourceHealthOverview() {
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/ops/source-health`); } catch (error) { return localFallback({ ready: false, counts: {}, sources: [], error: error.message }, error); }
}

export async function runSourceHealthSweep() {
  return fetchWithTimeout(`${BACKEND_URL}/api/jobs/source-health-sweep`, { method: 'POST' });
}

export async function getPilotReadiness() {
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/pilots/readiness`); } catch (error) { return localFallback({ status: 'unavailable', checks: [], error: error.message }, error); }
}

export async function getPilotMetrics() {
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/pilots/metrics`); } catch (error) { return localFallback({ metrics: {}, missingEvidence: [], error: error.message }, error); }
}

export async function getPilotMeasurementPlan() {
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/pilots/measurement-plan`); } catch (error) { return localFallback({ status: 'not_ready', metrics: [], gate: { status: 'not_ready' }, error: error.message }, error); }
}

export async function savePilotMeasurementPlan(input) {
  return fetchWithTimeout(`${BACKEND_URL}/api/pilots/measurement-plan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
}

export async function getCapacityMarketplace(filters = {}) {
  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== undefined && value !== ''));
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/capacity/marketplace${query.toString() ? `?${query}` : ''}`); } catch (error) { return localFallback({ offers: [], error: error.message }, error); }
}

export async function getCapacityInquiries() {
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/capacity/inquiries`); } catch (error) { return localFallback([], error); }
}

export async function createCapacityInquiry(input) {
  return fetchWithTimeout(`${BACKEND_URL}/api/capacity/inquiries`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
}

export async function getPilotPackage() { return fetchWithTimeout(`${BACKEND_URL}/api/pilots/package`); }
export async function downloadPilotPackage(format = 'json') {
  const normalized = format === 'md' ? 'markdown' : format;
  const token = localStorage.getItem('gr_auth_token');
  const response = await fetch(`${BACKEND_URL}/api/pilots/package?format=${encodeURIComponent(normalized)}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!response.ok) throw new Error(`No se pudo exportar el paquete de piloto (${response.status})`);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `global-resilience-pilot-package.${normalized === 'markdown' ? 'md' : 'json'}`;
  anchor.click();
  URL.revokeObjectURL(url);
}
export async function getEnterpriseReadiness() { return fetchWithTimeout(`${BACKEND_URL}/api/readiness/enterprise`); }

export async function getPilotFeedback() {
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/pilots/feedback`); } catch (error) { return localFallback([], error); }
}

export async function recordPilotFeedback(input) {
  return fetchWithTimeout(`${BACKEND_URL}/api/pilots/feedback`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
}

export async function getIncidents() {
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/incidents`); } catch (error) { return localFallback([], error); }
}

export async function createIncident(input) {
  return fetchWithTimeout(`${BACKEND_URL}/api/incidents`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
}

export async function updateIncident(id, input) {
  return fetchWithTimeout(`${BACKEND_URL}/api/incidents/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
}

export async function getSecurityPosture() {
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/security/posture`); } catch (error) { return localFallback({ status: 'unavailable', checks: [], counts: {}, error: error.message }, error); }
}

export async function getModelSensitivity(input) {
  return fetchWithTimeout(`${BACKEND_URL}/api/models/sensitivity`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
}

export async function getModelUncertainty(input) {
  return fetchWithTimeout(`${BACKEND_URL}/api/models/uncertainty`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
}

export async function getProvenanceOverview() {
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/governance/provenance`); } catch (error) { return localFallback({ ready: false, sources: [], models: [], error: error.message }, error); }
}

export async function getModelValidationReport() {
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/models/validation`); } catch (error) { return localFallback({ ready: false, tests: [], error: error.message }, error); }
}

export async function getCalibrationOverview(modelId = '') {
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/models/calibration${modelId ? `?modelId=${encodeURIComponent(modelId)}` : ''}`); } catch (error) { return localFallback({ fixtureCount: 0, status: 'unavailable', metrics: {}, fixtures: [], error: error.message }, error); }
}

export async function recordCalibrationFixtures(input) {
  return fetchWithTimeout(`${BACKEND_URL}/api/models/calibration/fixtures`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
}

export async function getRetentionOverview(retentionDays = '') {
  try { const query = retentionDays ? `?retentionDays=${encodeURIComponent(retentionDays)}` : ''; return await fetchWithTimeout(`${BACKEND_URL}/api/governance/retention${query}`); } catch (error) { return localFallback({ dryRun: true, collections: [], error: error.message }, error); }
}

export async function getSectorBenchmark(minCohort = 3) {
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/benchmarks/sectors?minCohort=${encodeURIComponent(minCohort)}`); } catch (error) { return localFallback({ sectors: [], totals: { completedOutcomes: 0, publishedSectors: 0 }, readiness: { status: 'unavailable' }, evidencePolicy: { marketClaimAllowed: false }, error: error.message }, error); }
}

export async function getHistoricalBenchmarkPlan(modelId = '') {
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/models/benchmark-plan${modelId ? `?modelId=${encodeURIComponent(modelId)}` : ''}`); } catch (error) { return localFallback({ status: 'unavailable', targetEventCount: 10, minimumBacktestEventCount: 3, eligibleEventCount: 0, remainingTargetSlots: 10, filledEvents: [], gates: { productionClaim: 'abstain_until_licensed_review' }, error: error.message }, error); }
}

export async function getPlaybookReadiness() {
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/playbooks/readiness`); } catch (error) { return localFallback({ status: 'unavailable', requiredPlaybooksPerVertical: 5, verticals: [], externalExecution: 'blocked_until_human_approval', error: error.message }, error); }
}

export async function runDemoIngestionJob() {
  const data = await fetchWithTimeout(`${BACKEND_URL}/api/jobs/demo-ingest`, { method: 'POST' });
  setBackendStatus('online');
  return data;
}

export async function runSlaSweep() {
  return fetchWithTimeout(`${BACKEND_URL}/api/jobs/sla-sweep`, { method: 'POST' });
}

export async function getWebhooks() {
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/webhooks`); } catch (error) { return localFallback([], error); }
}

export async function createWebhook(input) {
  return fetchWithTimeout(`${BACKEND_URL}/api/webhooks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
}

export async function rotateWebhookSecret(id) {
  return fetchWithTimeout(`${BACKEND_URL}/api/webhooks/${id}/rotate-secret`, { method: 'POST' });
}

export async function processLocalWebhookDeliveries(limit = 20) {
  return fetchWithTimeout(`${BACKEND_URL}/api/webhooks/deliveries/process-local`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ limit }) });
}

export async function processWebhookDeliveries({ limit = 20, dryRun = true } = {}) {
  return fetchWithTimeout(`${BACKEND_URL}/api/webhooks/deliveries/process`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ limit, dryRun }) });
}

export async function getWebhookDeliveries(id) {
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/webhooks/${id}/deliveries`); } catch (error) { return localFallback([], error); }
}

export async function getWebhookDeliveriesAll() {
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/webhooks/deliveries`); } catch (error) { return localFallback([], error); }
}

export async function downloadBrief(format = 'json') {
  const token = localStorage.getItem('resilience_token');
  const response = await fetch(`${BACKEND_URL}/api/briefs/latest/export?format=${format}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `resilience-brief.${format}`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function downloadAudit(format = 'csv', entityId = '') {
  const token = localStorage.getItem('resilience_token');
  const query = new URLSearchParams({ format });
  if (entityId) query.set('entityId', entityId);
  const response = await fetch(`${BACKEND_URL}/api/audit/export?${query}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `audit-export.${format}`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function downloadDecisionPackage(caseId, format = 'json') {
  const token = localStorage.getItem('resilience_token');
  const response = await fetch(`${BACKEND_URL}/api/cases/${caseId}/decision-package?format=${encodeURIComponent(format)}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `decision-package-${caseId}.${format === 'markdown' || format === 'md' ? 'md' : 'json'}`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function getDecisionShares(caseId) {
  return fetchWithTimeout(`${BACKEND_URL}/api/cases/${caseId}/shares`);
}

export async function createDecisionShare(caseId, input = {}) {
  return fetchWithTimeout(`${BACKEND_URL}/api/cases/${caseId}/shares`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
}

export async function revokeDecisionShare(caseId, shareId) {
  return fetchWithTimeout(`${BACKEND_URL}/api/cases/${caseId}/shares/${shareId}/revoke`, { method: 'POST' });
}

export async function getSharedDecisionPackage(token) {
  return fetchWithTimeout(`${BACKEND_URL}/api/shares/${encodeURIComponent(token)}`);
}
export async function downloadSharedDecisionPackage(token) {
  const response = await fetch(`${BACKEND_URL}/api/shares/${encodeURIComponent(token)}?format=markdown`);
  if (!response.ok) throw new Error(`No se pudo exportar el paquete compartido (${response.status})`);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'shared-decision-package.md';
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function downloadLocalSnapshot() {
  const token = localStorage.getItem('resilience_token');
  const response = await fetch(`${BACKEND_URL}/api/ops/snapshot`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'resilience-local-snapshot.json';
  link.click();
  URL.revokeObjectURL(url);
}

export async function restoreLocalSnapshot(snapshot) {
  const data = await fetchWithTimeout(`${BACKEND_URL}/api/ops/restore`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(snapshot) });
  setBackendStatus('online');
  return data;
}

export async function resetLocalDemo() {
  const data = await fetchWithTimeout(`${BACKEND_URL}/api/ops/reset-demo`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
  setBackendStatus('online');
  return data;
}

export async function getOperationalMetrics() {
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/ops/metrics`); } catch (error) { return localFallback({ requests: 0, errors: 0, routes: [], error: error.message }, error); }
}

export async function getRuntimeReadiness() {
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/runtime/readiness`); } catch (error) { return localFallback({ ready: false, checks: {}, config: {}, error: error.message }, error); }
}

export async function getDataCatalogReadiness() {
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/data-catalog/readiness`); } catch (error) { return localFallback({ ready: false, checks: [], error: error.message }, error); }
}

export async function previewSourceIntake(input) {
  return fetchWithTimeout(`${BACKEND_URL}/api/data-catalog/intake-preview`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
}

export async function getSourceIntakeReviews(filters = {}) {
  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/data-catalog/intake-reviews${query.toString() ? `?${query}` : ''}`); } catch (error) { return localFallback([], error); }
}

export async function createSourceIntakeReview(input) {
  return fetchWithTimeout(`${BACKEND_URL}/api/data-catalog/intake-reviews`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
}

export async function updateSourceIntakeReview(id, input) {
  return fetchWithTimeout(`${BACKEND_URL}/api/data-catalog/intake-reviews/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
}

export async function getEvidenceManifest() {
  return fetchWithTimeout(`${BACKEND_URL}/api/ops/evidence-manifest`);
}

export async function registerSourceFromIntakeReview(id) {
  return fetchWithTimeout(`${BACKEND_URL}/api/data-catalog/intake-reviews/${encodeURIComponent(id)}/register-local`, { method: 'POST' });
}

export async function getDataQualityGate() {
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/data-quality/gate`); } catch (error) { return localFallback({ ready: false, checks: [], error: error.message }, error); }
}

export async function getConnectorContractReadiness() {
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/connectors/readiness`); } catch (error) { return localFallback({ ready: false, connectorCount: 0, checks: [], externalIntegrationReady: false, error: error.message }, error); }
}

export async function getTenancyContext() {
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/tenancy/context`); } catch (error) { return localFallback({ organizationId: 'unknown', isolation: 'unavailable', error: error.message }, error); }
}

export async function getActionLibrary(filters = {}) {
  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/actions/library${query.toString() ? `?${query}` : ''}`); } catch (error) { return localFallback([], error); }
}

export async function recommendActions(input) {
  return fetchWithTimeout(`${BACKEND_URL}/api/actions/recommendations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
}

export async function getAssistiveSuggestion(input) {
  return fetchWithTimeout(`${BACKEND_URL}/api/assistant/suggestion`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
}

export async function getImpactGraph(filters = {}) {
  try {
    const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
    return await fetchWithTimeout(`${BACKEND_URL}/api/graph${query.toString() ? `?${query}` : ''}`);
  } catch (error) {
    return localFallback({ nodes: [], edges: [], counts: {}, error: error.message, disclaimer: 'Grafo no disponible sin backend.' }, error);
  }
}

export async function getPlaybooks() {
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/playbooks`); } catch (error) { return localFallback([], error); }
}

export async function previewActionPlan(input) {
  return fetchWithTimeout(`${BACKEND_URL}/api/action-plans/preview`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
}

export async function getActionPlans(filters = {}) {
  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== undefined && value !== ''));
  try { return await fetchWithTimeout(`${BACKEND_URL}/api/action-plans${query.toString() ? `?${query}` : ''}`); } catch (error) { return localFallback([], error); }
}

export async function createActionPlan(input) {
  return fetchWithTimeout(`${BACKEND_URL}/api/action-plans`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
}

export async function updateActionPlan(id, patch) {
  return fetchWithTimeout(`${BACKEND_URL}/api/action-plans/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
}

export async function recordActionPlanOutcome(id, input) {
  return fetchWithTimeout(`${BACKEND_URL}/api/action-plans/${encodeURIComponent(id)}/outcome`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
}
