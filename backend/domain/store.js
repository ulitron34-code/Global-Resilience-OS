import { createHash, createHmac, randomBytes } from 'node:crypto';
import { persistState, restoreState, verifyAuditChain } from './persistence.js';
import { computeImpact } from '../engine/impactEngine.js';
import { validateEventEnvelope } from './eventContract.js';
import { canTransitionIncident, normalizeIncidentInput, validateIncidentPatch } from './incidentOps.js';
import { buildEvidence } from './evidenceClassification.js';
import { listDataCatalog, validateSourceIntake } from './dataCatalog.js';

const now = new Date().toISOString();

const seed = {
  alerts: [
    { id: 'INC-0827', severity: 'critical', title: 'SMW-5 · degradación anómala', location: 'Suez / Mar Rojo', impactUsd: 2400000, status: 'open', createdAt: now, sourceIds: ['cables-demo', 'ais-demo'] },
    { id: 'INC-0825', severity: 'high', title: 'Congestión +18%', location: 'Fujairah · UAE', impactUsd: 840000, status: 'open', createdAt: now, sourceIds: ['ports-demo'] },
    { id: 'INC-0821', severity: 'medium', title: 'AIS gap detectado', location: 'Estrecho de Ormuz', impactUsd: 310000, status: 'open', createdAt: now, sourceIds: ['ais-demo'] },
    { id: 'INC-0819', severity: 'low', title: 'Latencia elevada de feed', location: 'N. Atlántico', impactUsd: 90000, status: 'open', createdAt: now, sourceIds: ['prices-demo'] },
  ],
  cases: [
    { id: 'RS-0827', alertId: 'INC-0827', title: 'SMW-5 · degradación crítica', owner: 'Risk Desk', priority: 'P1', status: 'open', slaMinutes: 44, impactUsd: 2400000, humanValidation: 'pending', createdAt: now },
    { id: 'RS-0825', alertId: 'INC-0825', title: 'Fujairah · congestión portuaria', owner: 'Ops MENA', priority: 'P2', status: 'open', slaMinutes: 138, impactUsd: 840000, humanValidation: 'pending', createdAt: now },
    { id: 'RS-0821', alertId: 'INC-0821', title: 'Gap AIS · Ormuz', owner: 'Maritime', priority: 'P2', status: 'open', slaMinutes: 332, impactUsd: 310000, humanValidation: 'pending', createdAt: now },
  ],
  scenarios: [
    { id: 'SC-0001', name: 'Reruteo preventivo Suez–Mar Rojo', status: 'recommended', lossIfWaitUsd: 3600000, mitigationCostUsd: 184000, protectedValueUsd: 2480000, confidence: 0.84, horizonHours: 72, createdAt: now },
  ],
  sources: [
    { id: 'ais-demo', name: 'AIS / vessel tracking', kind: 'licensed_feed', status: 'connected', latencySeconds: 38, lastEventAt: now },
    { id: 'cables-demo', name: 'Base de cables', kind: 'partner_dataset', status: 'demo', latencySeconds: null, lastEventAt: now },
    { id: 'ports-demo', name: 'Port congestion', kind: 'licensed_feed', status: 'connected', latencySeconds: 42, lastEventAt: now },
    { id: 'prices-demo', name: 'Commodity prices', kind: 'market_data', status: 'connected', latencySeconds: 15, lastEventAt: now },
  ],
};

const initialAuditLog = [
  { id: 'AUD-0003', entityType: 'case', entityId: 'RS-0827', action: 'recommendation_generated', actor: 'system', message: 'Reruteo preventivo; ventana sugerida menor a 45 minutos.', createdAt: now },
  { id: 'AUD-0002', entityType: 'case', entityId: 'RS-0827', action: 'correlation_confirmed', actor: 'system', message: 'Cable y congestión portuaria elevan la exposición.', createdAt: now },
  { id: 'AUD-0001', entityType: 'case', entityId: 'RS-0827', action: 'case_opened', actor: 'system', message: 'Umbral de impacto mayor a $2M activado.', createdAt: now },
];
const restored = restoreState(structuredClone(seed));
const state = { alerts: restored.alerts, cases: restored.cases, scenarios: restored.scenarios, sources: restored.sources, deadLetters: restored.deadLetters || [], calibrationFixtures: restored.calibrationFixtures || [], pilotFeedback: restored.pilotFeedback || [], incidents: restored.incidents || [], sourceIntakeReviews: restored.sourceIntakeReviews || [], decisionShares: restored.decisionShares || [] };
const auditLog = restored.auditLog || initialAuditLog;
const notifications = restored.notifications || [
  { id: 'NOT-0001', type: 'critical_alert', title: 'SMW-5 requiere atención', message: 'Existe una alerta crítica abierta en Suez / Mar Rojo.', read: false, createdAt: now },
];
const comments = restored.comments || [];
const webhooks = restored.webhooks || [];
const webhookDeliveries = restored.webhookDeliveries || [];
const jobRuns = restored.jobRuns || [];

function clone(value) {
  return structuredClone(value);
}

function decorateAlertEvidence(item) {
  if (!item) return null;
  return {
    ...item,
    evidenceClass: item.evidenceClass || 'observed',
    evidence: item.evidence || buildEvidence({
      evidenceClass: 'observed',
      sourceIds: item.sourceIds || [],
      observed: ['alert_event', 'severity', 'impactUsd', 'observedAt']
    })
  };
}

function decorateScenarioEvidence(item) {
  if (!item) return null;
  const evidenceClass = item.evidenceClass || (Array.isArray(item.sourceIds) && item.sourceIds.length ? 'inferred' : 'assumed');
  return {
    ...item,
    evidenceClass,
    evidence: item.evidence || buildEvidence({
      evidenceClass,
      sourceIds: item.sourceIds || [],
      modelId: item.modelId || 'impact-cascade',
      modelVersion: item.modelVersion || '0.5.0',
      assumptions: item.assumptions || [],
      inferred: ['scenario_economics']
    })
  };
}

function itemVertical(item) {
  return item.vertical || 'Oil & Gas';
}

function page(items, filters = {}) {
  const limit = Math.min(Math.max(Number(filters.limit) || items.length || 1, 1), 200);
  const offset = Math.max(Number(filters.offset) || 0, 0);
  return items.slice(offset, offset + limit);
}

function decorateCase(item, referenceTime = Date.now()) {
  if (!item) return null;
  const createdAtMs = Date.parse(item.createdAt);
  const dueAtMs = Number.isFinite(createdAtMs) && Number.isFinite(Number(item.slaMinutes)) ? createdAtMs + Number(item.slaMinutes) * 60_000 : null;
  const remainingMinutes = dueAtMs === null ? null : Math.ceil((dueAtMs - referenceTime) / 60_000);
  const slaStatus = item.status === 'closed' ? 'closed' : remainingMinutes === null ? 'unknown' : remainingMinutes <= 0 ? 'overdue' : remainingMinutes <= 30 ? 'at_risk' : 'on_track';
  return { ...item, sla: { dueAt: dueAtMs === null ? null : new Date(dueAtMs).toISOString(), remainingMinutes, status: slaStatus } };
}

function filterAlerts(filters = {}) {
  return state.alerts.filter((item) => (!filters.status || item.status === filters.status) && (!filters.severity || item.severity === filters.severity) && (!filters.region || item.location.toLowerCase().includes(String(filters.region).toLowerCase())) && (!filters.vertical || itemVertical(item) === filters.vertical) && (!filters.q || `${item.id} ${item.title} ${item.location}`.toLowerCase().includes(String(filters.q).toLowerCase())));
}

function filterCases(filters = {}) {
  return state.cases.filter((item) => (!filters.vertical || itemVertical(item) === filters.vertical) && (!filters.status || item.status === filters.status) && (!filters.priority || item.priority === filters.priority) && (!filters.owner || item.owner.toLowerCase().includes(String(filters.owner).toLowerCase())) && (!filters.q || `${item.id} ${item.title} ${item.owner} ${item.priority}`.toLowerCase().includes(String(filters.q).toLowerCase())));
}

export function listAlerts(filters = {}) {
  return clone(page(filterAlerts(filters).map(decorateAlertEvidence), filters));
}
export function countAlerts(filters = {}) { return filterAlerts(filters).length; }
export function getAlert(id) { return clone(decorateAlertEvidence(state.alerts.find((item) => item.id === id) ?? null)); }
export function updateAlert(id, patch, actor = 'operator') {
  const item = state.alerts.find((candidate) => candidate.id === id);
  if (!item) return null;
  const allowedStatuses = ['open', 'acknowledged', 'in_progress', 'resolved', 'suppressed'];
  const changes = {};
  if (patch.status !== undefined) {
    if (!allowedStatuses.includes(patch.status)) throw new Error('status de alerta inválido');
    item.status = patch.status;
    changes.status = patch.status;
  }
  if (patch.note !== undefined) {
    if (typeof patch.note !== 'string' || patch.note.trim().length < 2 || patch.note.length > 500) throw new Error('note inválida');
    item.triageNote = patch.note.trim();
    changes.note = item.triageNote;
  }
  if (Object.keys(changes).length) {
    const changedAt = new Date().toISOString();
    item.updatedAt = changedAt;
    auditLog.unshift({ id: `AUD-${String(auditLog.length + 1).padStart(4, '0')}`, entityType: 'alert', entityId: id, action: 'alert_triaged', actor, message: `Alerta actualizada: ${Object.keys(changes).join(', ')}.`, changes, createdAt: changedAt });
    persistState(state, auditLog, notifications, comments, webhooks, webhookDeliveries, jobRuns);
  }
  return clone(item);
}
export function listCases(filters = {}) {
  const items = filterCases(filters).map((item) => decorateCase(item));
  if (filters.sort === 'impact_desc') items.sort((a, b) => b.impactUsd - a.impactUsd);
  if (filters.sort === 'sla_urgent') items.sort((a, b) => (a.sla.remainingMinutes ?? Number.MAX_SAFE_INTEGER) - (b.sla.remainingMinutes ?? Number.MAX_SAFE_INTEGER));
  return clone(page(items, filters));
}
export function countCases(filters = {}) { return filterCases(filters).length; }
export function getCase(id) { return clone(decorateCase(state.cases.find((item) => item.id === id) ?? null)); }
export function listScenarios() { return clone(state.scenarios.map(decorateScenarioEvidence)); }
export function compareScenarios(ids = []) {
  const selected = state.scenarios.filter((item) => ids.includes(item.id));
  if (selected.length < 2) throw new Error('Se requieren al menos dos escenarios');
  const decorated = selected.map(decorateScenarioEvidence);
  const baseline = decorated[0];
  return { scenarios: clone(decorated), baselineId: baseline.id, deltas: decorated.map((item) => ({ id: item.id, lossVsBaselineUsd: item.lossIfWaitUsd - baseline.lossIfWaitUsd, mitigationCostVsBaselineUsd: item.mitigationCostUsd - baseline.mitigationCostUsd, protectedValueVsBaselineUsd: item.protectedValueUsd - baseline.protectedValueUsd })) };
}
export function listSources() { return clone(state.sources); }
export function listSourceIntakeReviews(filters = {}) {
  const items = state.sourceIntakeReviews.filter((item) => !filters.status || item.status === filters.status);
  return clone(items.slice(0, Math.min(Math.max(Number(filters.limit) || 100, 1), 200)));
}
export function createSourceIntakeReview(input, actor = 'operator') {
  const candidate = input?.candidate || input;
  const preview = validateSourceIntake(candidate);
  if (!preview.ready) throw new Error('La fuente no pasa el preview contractual');
  const createdAt = new Date().toISOString();
  const item = { id: `SIR-${randomBytes(4).toString('hex').toUpperCase()}`, candidate: preview.candidate, previewChecks: preview.checks, status: 'pending_review', activationStatus: 'blocked_external', reviewNote: null, createdAt, updatedAt: createdAt, createdBy: actor, reviewedBy: null };
  state.sourceIntakeReviews.unshift(item);
  auditLog.unshift({ id: `AUD-${String(auditLog.length + 1).padStart(4, '0')}`, entityType: 'source_intake_review', entityId: item.id, action: 'source_intake_review_created', actor, message: `Revisión de fuente ${item.id} creada; activación externa bloqueada.`, createdAt });
  persistState(state, auditLog, notifications, comments, webhooks, webhookDeliveries, jobRuns);
  return clone(item);
}
export function updateSourceIntakeReview(id, input = {}, actor = 'operator') {
  const item = state.sourceIntakeReviews.find((candidate) => candidate.id === id);
  if (!item) return null;
  const status = String(input.status || '').trim();
  if (!['approved_local', 'rejected'].includes(status)) throw new Error('status de revisión de fuente inválido');
  const note = String(input.note || '').trim();
  if (status === 'rejected' && note.length < 2) throw new Error('Una revisión rechazada requiere nota');
  const updatedAt = new Date().toISOString();
  item.status = status;
  item.reviewNote = note || null;
  item.reviewedBy = actor;
  item.updatedAt = updatedAt;
  auditLog.unshift({ id: `AUD-${String(auditLog.length + 1).padStart(4, '0')}`, entityType: 'source_intake_review', entityId: id, action: `source_intake_review_${status}`, actor, message: `Revisión ${id}: ${status}; activación externa continúa bloqueada.`, createdAt: updatedAt });
  persistState(state, auditLog, notifications, comments, webhooks, webhookDeliveries, jobRuns);
  return clone(item);
}
export function listPilotFeedback() { return clone(state.pilotFeedback); }
export function recordPilotFeedback(input, actor = 'operator') {
  const item = { id: `PFB-${randomBytes(4).toString('hex').toUpperCase()}`, ...input, createdAt: new Date().toISOString(), createdBy: actor };
  state.pilotFeedback.unshift(item);
  auditLog.unshift({ id: `AUD-${String(auditLog.length + 1).padStart(4, '0')}`, entityType: 'pilot_feedback', entityId: item.id, action: 'pilot_feedback_recorded', actor, message: `Feedback de piloto registrado en etapa ${item.stage}.`, createdAt: item.createdAt });
  persistState(state, auditLog, notifications, comments, webhooks, webhookDeliveries, jobRuns);
  return clone(item);
}
export function getSource(id) { return clone(state.sources.find((item) => item.id === id) ?? null); }
export function listIncidents(filters = {}) { return clone(state.incidents.filter((item) => (!filters.status || item.status === filters.status) && (!filters.severity || item.severity === filters.severity)).slice(0, Math.min(Math.max(Number(filters.limit) || 100, 1), 200))); }
export function createIncident(input, actor = 'operator') {
  const normalized = normalizeIncidentInput(input);
  const createdAt = new Date().toISOString();
  const item = { id: `IR-${randomBytes(4).toString('hex').toUpperCase()}`, ...normalized, status: 'open', owner: actor, timeline: [{ at: createdAt, action: 'opened', actor }], createdAt, updatedAt: createdAt };
  state.incidents.unshift(item);
  auditLog.unshift({ id: `AUD-${String(auditLog.length + 1).padStart(4, '0')}`, entityType: 'incident', entityId: item.id, action: 'incident_opened', actor, message: `Incidente ${item.id} abierto.`, createdAt });
  persistState(state, auditLog, notifications, comments, webhooks, webhookDeliveries, jobRuns);
  return clone(item);
}
export function updateIncident(id, input, actor = 'operator') {
  const item = state.incidents.find((candidate) => candidate.id === id);
  if (!item) return null;
  const patch = validateIncidentPatch(input);
  const changedAt = new Date().toISOString();
  if (patch.status && patch.status !== item.status) {
    if (!canTransitionIncident(item.status, patch.status)) throw new Error(`transición de incidente no permitida: ${item.status} -> ${patch.status}`);
    if (patch.status === 'closed' && !patch.note && !item.closureNote) throw new Error('cerrar incidente requiere una nota de resolución');
    item.status = patch.status;
    item.timeline.push({ at: changedAt, action: `status:${patch.status}`, actor });
  }
  if (patch.note) { item.timeline.push({ at: changedAt, action: 'note', actor, note: patch.note }); item.closureNote = patch.status === 'closed' ? patch.note : item.closureNote; }
  for (const key of ['title', 'severity', 'summary', 'sourceIds', 'caseId']) if (patch[key] !== undefined) item[key] = patch[key];
  item.updatedAt = changedAt;
  auditLog.unshift({ id: `AUD-${String(auditLog.length + 1).padStart(4, '0')}`, entityType: 'incident', entityId: id, action: 'incident_updated', actor, message: `Incidente ${id} actualizado.`, changes: patch, createdAt: changedAt });
  persistState(state, auditLog, notifications, comments, webhooks, webhookDeliveries, jobRuns);
  return clone(item);
}
export function getSourceHealthOverview(referenceTime = Date.now()) {
  const catalogMap = new Map(listDataCatalog().map((item) => [item.id, item]));
  const sources = state.sources.map((source) => {
    const catalog = catalogMap.get(source.id) || {};
    const ageMinutes = source.lastEventAt ? Math.max(0, Math.round((referenceTime - Date.parse(source.lastEventAt)) / 60_000)) : null;
    let health = source.status === 'demo' ? 'demo' : 'unknown';
    if (source.status === 'error') health = 'error';
    else if (source.latencySeconds !== null && source.latencySeconds !== undefined) health = source.latencySeconds > 180 ? 'degraded' : 'healthy';
    if (health !== 'demo' && catalog.refreshSlaHours !== null && (ageMinutes === null || ageMinutes > catalog.refreshSlaHours * 60)) health = 'stale';
    return { id: source.id, name: source.name, kind: source.kind, connectorStatus: source.status, health, latencySeconds: source.latencySeconds ?? null, lastEventAt: source.lastEventAt || null, ageMinutes, coverage: catalog.coverage || null, licenseStatus: catalog.licenseStatus || 'unknown', refreshSlaHours: catalog.refreshSlaHours ?? null };
  });
  const counts = { healthy: 0, degraded: 0, stale: 0, demo: 0, unknown: 0, error: 0 };
  sources.forEach((source) => { counts[source.health] = (counts[source.health] || 0) + 1; });
  return { checkedAt: new Date(referenceTime).toISOString(), ready: counts.error === 0 && counts.stale === 0, counts, sources: clone(sources) };
}
export function listModels() {
  return clone([
    { id: 'impact-cascade', name: 'Impact Cascade Engine', version: '0.5.0', status: 'demo', methodology: 'Heurística ponderada por cable, vertical y duración.', assumptions: ['Flujos diarios ilustrativos.', 'Pesos cable → vertical no calibrados históricamente.', 'Impacto sistémico base de demo.'], limitations: ['No sustituye datos de mercado.', 'No genera recomendación de trading.'] },
    { id: 'alert-correlation', name: 'Alert Correlation', version: '0.1.0', status: 'local-rule-based', methodology: 'Reglas de severidad, fuente, ubicación y umbral económico.', assumptions: ['Fuentes demo normalizadas.', 'Una señal externa se identifica por externalId.'], limitations: ['No usa ML ni series históricas.'] },
  ]);
}
export function getModelValidationReport() {
  const tests = [];
  const record = (id, label, pass, details) => tests.push({ id, label, status: pass ? 'pass' : 'fail', details });
  try {
    const partial = computeImpact('seamewe3', 'parcial', 24);
    const total = computeImpact('seamewe3', 'total', 24);
    const extended = computeImpact('seamewe3', 'total', 48);
    record('known_cable', 'El cable de referencia existe', partial.affected.length > 0, `${partial.affected.length} verticales evaluadas`);
    record('severity_monotonicity', 'Un corte total no reduce el impacto', total.totalUsdLoss >= partial.totalUsdLoss, `${partial.totalUsdLoss} -> ${total.totalUsdLoss}`);
    record('duration_monotonicity', 'Más duración no reduce la pérdida', extended.totalUsdLoss >= total.totalUsdLoss, `${total.totalUsdLoss} -> ${extended.totalUsdLoss}`);
    record('systemic_coverage', 'El modelo conserva cobertura sistémica', partial.affected.every((item) => item.impactPct > 0), `${partial.affected.filter((item) => item.impactPct > 0).length}/${partial.affected.length}`);
  } catch (error) {
    record('engine_execution', 'El motor ejecuta el fixture local', false, error.message);
  }
  return { scope: 'local-platform', generatedAt: new Date().toISOString(), ready: tests.every((test) => test.status === 'pass'), calibrationStatus: 'not_calibrated_with_historical_data', historicalFixtures: 0, tests, disclaimer: 'Los tests verifican invariantes del motor local; no sustituyen calibración con eventos históricos y datos licenciados.' };
}
export function getCalibrationOverview(modelId) {
  const fixtures = state.calibrationFixtures.filter((fixture) => !modelId || fixture.modelId === modelId);
  const eligibleFixtures = fixtures.filter((fixture) => fixture.evidenceStatus === 'complete');
  const errors = eligibleFixtures.map((fixture) => fixture.predictedImpactUsd - fixture.observedImpactUsd);
  const absoluteErrors = errors.map((value) => Math.abs(value));
  const percentageErrors = eligibleFixtures.filter((fixture) => fixture.observedImpactUsd > 0).map((fixture) => Math.abs(fixture.predictedImpactUsd - fixture.observedImpactUsd) / fixture.observedImpactUsd);
  const sum = (values) => values.reduce((total, value) => total + value, 0);
  return { scope: 'local-platform', modelId: modelId || 'all', fixtureCount: fixtures.length, completeFixtureCount: eligibleFixtures.length, incompleteFixtureCount: fixtures.length - eligibleFixtures.length, historicalFixtures: eligibleFixtures.length, status: eligibleFixtures.length >= 3 ? 'ready_for_review' : 'insufficient_sample', metrics: { maeUsd: absoluteErrors.length ? sum(absoluteErrors) / absoluteErrors.length : null, mape: percentageErrors.length ? sum(percentageErrors) / percentageErrors.length : null, biasUsd: errors.length ? sum(errors) / errors.length : null }, fixtures: clone(fixtures), disclaimer: 'Las métricas sólo usan fixtures completos con activo, duración, rutas alternativas, resultado, fuente y procedencia; una muestra local no constituye validación de mercado.' };
}
export function recordCalibrationFixtures(input, actor = 'operator') {
  const modelId = String(input?.modelId || 'impact-cascade');
  if (!listModels().some((model) => model.id === modelId)) throw new Error('Modelo desconocido');
  if (!Array.isArray(input?.fixtures) || input.fixtures.length < 1 || input.fixtures.length > 500) throw new Error('fixtures debe contener entre 1 y 500 registros');
  const existingIds = new Set(state.calibrationFixtures.map((fixture) => fixture.id));
  const incoming = input.fixtures.map((fixture, index) => {
    const id = String(fixture?.id || '').trim();
    const eventDate = Date.parse(fixture?.eventDate);
    const observedImpactUsd = Number(fixture?.observedImpactUsd);
    const predictedImpactUsd = Number(fixture?.predictedImpactUsd);
    const sourceId = String(fixture?.sourceId || '').trim();
    const provenance = String(fixture?.provenance || '').trim();
    const assetId = String(fixture?.assetId || '').trim();
    const durationHours = Number(fixture?.durationHours);
    const alternateRoutes = Array.isArray(fixture?.alternateRoutes) ? fixture.alternateRoutes.map(String).filter(Boolean).slice(0, 20) : String(fixture?.alternateRoutes || '').split(',').map((item) => item.trim()).filter(Boolean).slice(0, 20);
    const recoveryOutcome = String(fixture?.recoveryOutcome || '').trim();
    if (!id || id.length > 160 || existingIds.has(id)) throw new Error(`Fixture inválido o duplicado en posición ${index}`);
    if (!Number.isFinite(eventDate) || !Number.isFinite(observedImpactUsd) || observedImpactUsd < 0 || !Number.isFinite(predictedImpactUsd) || predictedImpactUsd < 0) throw new Error(`Valores inválidos en fixture ${id}`);
    if (!sourceId || !provenance) throw new Error(`Fixture ${id} requiere sourceId y provenance`);
    const missingEvidence = [!assetId && 'assetId', !(Number.isFinite(durationHours) && durationHours >= 0) && 'durationHours', !alternateRoutes.length && 'alternateRoutes', !recoveryOutcome && 'recoveryOutcome'].filter(Boolean);
    return { id, modelId, eventDate: new Date(eventDate).toISOString(), observedImpactUsd, predictedImpactUsd, sourceId: sourceId.slice(0, 160), provenance: provenance.slice(0, 300), assetId: assetId || null, durationHours: Number.isFinite(durationHours) && durationHours >= 0 ? durationHours : null, alternateRoutes, recoveryOutcome: recoveryOutcome || null, evidenceStatus: missingEvidence.length ? 'incomplete' : 'complete', missingEvidence, createdAt: new Date().toISOString(), createdBy: actor };
  });
  state.calibrationFixtures.unshift(...incoming);
  auditLog.unshift({ id: `AUD-${String(auditLog.length + 1).padStart(4, '0')}`, entityType: 'model', entityId: modelId, action: 'calibration_fixtures_recorded', actor, message: `${incoming.length} fixtures de calibración registrados.`, createdAt: new Date().toISOString() });
  persistState(state, auditLog, notifications, comments, webhooks, webhookDeliveries, jobRuns);
  return { recorded: incoming.length, overview: getCalibrationOverview(modelId) };
}
export function getDecisionPackage(caseId) {
  const caseItem = state.cases.find((item) => item.id === caseId);
  if (!caseItem) return null;
  const alert = state.alerts.find((item) => item.id === caseItem.alertId) || null;
  const sourceIds = new Set(alert?.sourceIds || []);
  return clone({
    schemaVersion: 1,
    packageType: 'local-decision-package',
    generatedAt: new Date().toISOString(),
    disclaimer: 'Artefacto local basado en datos demo; requiere validación humana y fuentes licenciadas antes de uso productivo.',
    case: caseItem,
    alert,
    sources: state.sources.filter((source) => sourceIds.has(source.id)),
    modelRegistry: listModels(),
    scenarios: state.scenarios.map((scenario) => ({ ...scenario, evidenceClass: scenario.evidenceClass || 'assumed', evidence: scenario.evidence || buildEvidence({ evidenceClass: 'assumed', sourceIds: [], modelId: 'impact-cascade', modelVersion: '0.5.0', assumptions: scenario.assumptions || [], inferred: ['scenario_economics'] }) })),
    evidenceChain: { observedSourceIds: [...sourceIds], inferredModelIds: listModels().map((model) => `${model.id}@${model.version}`), assumedScenarioCount: state.scenarios.length },
    audit: auditLog.filter((entry) => entry.entityId === caseId || entry.entityId === caseItem.alertId),
    comments: comments.filter((comment) => comment.caseId === caseId),
  });
}
function publicDecisionShare(share) {
  const { tokenHash: _tokenHash, ...safe } = share;
  if (safe.status === 'active' && Date.parse(safe.expiresAt) <= Date.now()) safe.status = 'expired';
  return clone(safe);
}
function normalizeShareExpiry(input) {
  const requested = Number(input?.expiresInHours);
  const hours = Number.isFinite(requested) ? requested : 72;
  return Math.min(Math.max(Math.round(hours), 1), 720);
}
export function listDecisionShares(caseId) {
  return clone(state.decisionShares.filter((item) => !caseId || item.caseId === caseId).map(publicDecisionShare));
}
export function createDecisionShare(caseId, input = {}, actor = 'operator') {
  if (!state.cases.some((item) => item.id === caseId)) return null;
  const token = randomBytes(32).toString('base64url');
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + normalizeShareExpiry(input) * 60 * 60 * 1000).toISOString();
  const share = { id: `SH-${randomBytes(5).toString('hex').toUpperCase()}`, caseId, tokenHash: createHash('sha256').update(token).digest('hex'), audience: String(input.audience || 'decision_reviewer').trim().slice(0, 120), status: 'active', createdBy: actor, createdAt, expiresAt, revokedAt: null, revokedBy: null, accessCount: 0, lastAccessedAt: null };
  state.decisionShares.unshift(share);
  auditLog.unshift({ id: `AUD-${String(auditLog.length + 1).padStart(4, '0')}`, entityType: 'decision_share', entityId: share.id, action: 'decision_share_created', actor, message: `Enlace de decisión creado para ${caseId}; expira ${expiresAt}.`, createdAt });
  persistState(state, auditLog, notifications, comments, webhooks, webhookDeliveries, jobRuns);
  return { share: publicDecisionShare(share), token, path: `/share/${token}`, apiPath: `/api/shares/${token}`, disclaimer: 'El token se muestra una sola vez; guárdalo de forma segura.' };
}
export function revokeDecisionShare(caseId, shareId, actor = 'operator') {
  const share = state.decisionShares.find((item) => item.id === shareId && item.caseId === caseId);
  if (!share) return null;
  if (share.status !== 'revoked') {
    share.status = 'revoked';
    share.revokedAt = new Date().toISOString();
    share.revokedBy = actor;
    auditLog.unshift({ id: `AUD-${String(auditLog.length + 1).padStart(4, '0')}`, entityType: 'decision_share', entityId: share.id, action: 'decision_share_revoked', actor, message: `Enlace de decisión revocado para ${caseId}.`, createdAt: share.revokedAt });
    persistState(state, auditLog, notifications, comments, webhooks, webhookDeliveries, jobRuns);
  }
  return publicDecisionShare(share);
}
export function getDecisionPackageByShareToken(token) {
  if (typeof token !== 'string' || token.length < 32) return null;
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const share = state.decisionShares.find((item) => item.tokenHash === tokenHash);
  if (!share || share.status !== 'active' || Date.parse(share.expiresAt) <= Date.now()) return null;
  const accessedAt = new Date().toISOString();
  share.accessCount += 1;
  share.lastAccessedAt = accessedAt;
  const packageData = getDecisionPackage(share.caseId);
  if (!packageData) return null;
  auditLog.unshift({ id: `AUD-${String(auditLog.length + 1).padStart(4, '0')}`, entityType: 'decision_share', entityId: share.id, action: 'decision_share_accessed', actor: 'share_token', message: `Paquete de decisión consultado para ${share.caseId}.`, createdAt: accessedAt });
  persistState(state, auditLog, notifications, comments, webhooks, webhookDeliveries, jobRuns);
  return { share: { id: share.id, caseId: share.caseId, audience: share.audience, status: share.status, expiresAt: share.expiresAt, accessedAt }, package: packageData, disclaimer: 'Vista de solo lectura; los datos demo y las limitaciones del paquete siguen vigentes.' };
}
export function listAudit(entityId, filters = {}) { return clone(page(auditLog.filter((item) => (!entityId || item.entityId === entityId) && (!filters.q || `${item.action} ${item.actor} ${item.message}`.toLowerCase().includes(String(filters.q).toLowerCase()))), filters)); }
export function countAudit(entityId, filters = {}) { return auditLog.filter((item) => (!entityId || item.entityId === entityId) && (!filters.q || `${item.action} ${item.actor} ${item.message}`.toLowerCase().includes(String(filters.q).toLowerCase()))).length; }
export function listComments(caseId) { return clone(comments.filter((item) => item.caseId === caseId)); }
export function addComment(caseId, body, author = 'operator') {
  if (!state.cases.some((item) => item.id === caseId)) return null;
  if (typeof body !== 'string' || body.trim().length < 2) throw new Error('El comentario debe tener al menos 2 caracteres');
  const item = { id: `COM-${String(comments.length + 1).padStart(4, '0')}`, caseId, body: body.trim(), author, createdAt: new Date().toISOString() };
  comments.unshift(item);
  auditLog.unshift({ id: `AUD-${String(auditLog.length + 1).padStart(4, '0')}`, entityType: 'case', entityId: caseId, action: 'comment_added', actor: author, message: 'Comentario añadido al caso.', createdAt: item.createdAt });
  persistState(state, auditLog, notifications, comments, webhooks, webhookDeliveries, jobRuns);
  return clone(item);
}
function createWebhookSecret() { return randomBytes(32).toString('base64url'); }
function ensureWebhookSecret(webhook) {
  if (!webhook.secret || typeof webhook.secret !== 'string') webhook.secret = createWebhookSecret();
  return webhook.secret;
}
function publicWebhook(webhook) {
  const secret = ensureWebhookSecret(webhook);
  const { secret: _secret, ...safe } = webhook;
  return { ...safe, secretConfigured: true, secretFingerprint: createHash('sha256').update(secret).digest('hex').slice(0, 12) };
}
function signWebhookDelivery(webhook, deliveryId, eventType, payload, timestamp) {
  const body = JSON.stringify({ deliveryId, eventType, payload });
  const signature = createHmac('sha256', ensureWebhookSecret(webhook)).update(`${timestamp}.${body}`).digest('hex');
  return { signature: `sha256=${signature}`, bodySha256: createHash('sha256').update(body).digest('hex') };
}
export function listWebhooks() { return clone(webhooks.map(publicWebhook)); }
export function createWebhook(input, owner = 'admin') {
  if (typeof input.url !== 'string' || !/^https?:\/\//.test(input.url)) throw new Error('url debe ser HTTP o HTTPS');
  if (input.url.length > 500) throw new Error('url demasiado larga');
  const supportedEvents = ['alert.created', 'case.updated'];
  const requestedEvents = Array.isArray(input.events) && input.events.length ? input.events : supportedEvents;
  if (requestedEvents.some((event) => !supportedEvents.includes(event))) throw new Error('evento webhook no soportado');
  const item = { id: `WH-${String(webhooks.length + 1).padStart(4, '0')}`, url: input.url, events: requestedEvents, active: input.active !== false, owner, secret: typeof input.secret === 'string' && input.secret.length >= 16 ? input.secret : createWebhookSecret(), createdAt: new Date().toISOString() };
  webhooks.unshift(item);
  persistState(state, auditLog, notifications, comments, webhooks, webhookDeliveries, jobRuns);
  return publicWebhook(item);
}
export function rotateWebhookSecret(webhookId, actor = 'admin') {
  const webhook = webhooks.find((candidate) => candidate.id === webhookId);
  if (!webhook) return null;
  const secret = createWebhookSecret();
  webhook.secret = secret;
  const rotatedAt = new Date().toISOString();
  auditLog.unshift({ id: `AUD-${String(auditLog.length + 1).padStart(4, '0')}`, entityType: 'webhook', entityId: webhookId, action: 'webhook_secret_rotated', actor, message: 'Secreto HMAC de webhook rotado.', createdAt: rotatedAt });
  persistState(state, auditLog, notifications, comments, webhooks, webhookDeliveries, jobRuns);
  return { webhook: publicWebhook(webhook), secret, rotatedAt };
}
export function listWebhookDeliveries(webhookId) { return clone(webhookDeliveries.filter((item) => !webhookId || item.webhookId === webhookId)); }
export function retryWebhookDelivery(webhookId, deliveryId) {
  const item = webhookDeliveries.find((candidate) => candidate.id === deliveryId && candidate.webhookId === webhookId);
  if (!item) return null;
  item.attempt += 1;
  item.status = 'queued_local';
  item.lastRetryAt = new Date().toISOString();
  item.lastError = 'Entrega externa pendiente de worker de producción.';
  persistState(state, auditLog, notifications, comments, webhooks, webhookDeliveries, jobRuns);
  return clone(item);
}
export function processLocalWebhookDeliveries(limit = 20) {
  const pending = webhookDeliveries.filter((item) => item.status === 'queued_local').slice(0, Math.min(Math.max(Number(limit) || 20, 1), 100));
  const processedAt = new Date().toISOString();
  for (const item of pending) {
    item.status = 'simulated_success';
    item.attempt += 1;
    item.processedAt = processedAt;
    item.responseCode = 202;
    item.lastError = null;
  }
  if (pending.length) persistState(state, auditLog, notifications, comments, webhooks, webhookDeliveries, jobRuns);
  return { processed: pending.length, processedAt, deliveries: clone(pending) };
}
export async function processWebhookDeliveries({ limit = 20, dryRun = true, timeoutMs = 3000 } = {}) {
  if (dryRun) return processLocalWebhookDeliveries(limit);
  const pending = webhookDeliveries.filter((item) => item.status === 'queued_local' && (!item.nextAttemptAt || Date.parse(item.nextAttemptAt) <= Date.now())).slice(0, Math.min(Math.max(Number(limit) || 20, 1), 100));
  const processedAt = new Date().toISOString();
  const results = [];
  for (const item of pending) {
    const webhook = webhooks.find((candidate) => candidate.id === item.webhookId);
    if (!webhook) { item.status = 'dead_letter'; item.lastError = 'Webhook eliminado o inexistente.'; results.push(clone(item)); continue; }
    const body = JSON.stringify({ deliveryId: item.id, eventType: item.eventType, payload: item.payload });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.min(Math.max(Number(timeoutMs) || 3000, 250), 15_000));
    try {
      const response = await fetch(webhook.url, { method: 'POST', headers: { 'content-type': 'application/json', 'user-agent': 'global-resilience-local-worker/0.8.0', ...item.headers }, body, signal: controller.signal });
      item.attempt += 1;
      item.responseCode = response.status;
      item.processedAt = processedAt;
      if (response.ok) { item.status = 'delivered'; item.lastError = null; item.nextAttemptAt = null; }
      else { item.status = item.attempt >= 5 ? 'dead_letter' : 'queued_local'; item.lastError = `HTTP ${response.status}`; item.nextAttemptAt = new Date(Date.now() + Math.min(3_600_000, 2 ** item.attempt * 1000)).toISOString(); }
    } catch (error) {
      item.attempt += 1;
      item.status = item.attempt >= 5 ? 'dead_letter' : 'queued_local';
      item.lastError = error.name === 'AbortError' ? 'Timeout de entrega' : error.message;
      item.nextAttemptAt = new Date(Date.now() + Math.min(3_600_000, 2 ** item.attempt * 1000)).toISOString();
      item.processedAt = processedAt;
    } finally { clearTimeout(timer); results.push(clone(item)); }
  }
  if (pending.length) persistState(state, auditLog, notifications, comments, webhooks, webhookDeliveries, jobRuns);
  return { processed: pending.length, delivered: results.filter((item) => item.status === 'delivered').length, processedAt, dryRun: false, deliveries: results };
}
export function dispatchWebhook(eventType, payload) {
  for (const webhook of webhooks.filter((item) => item.active && item.events.includes(eventType))) {
    const deliveryId = `DEL-${String(webhookDeliveries.length + 1).padStart(4, '0')}`;
    const createdAt = new Date().toISOString();
    const signed = signWebhookDelivery(webhook, deliveryId, eventType, payload, createdAt);
    webhookDeliveries.unshift({ id: deliveryId, webhookId: webhook.id, eventType, status: 'queued_local', attempt: 0, payload, createdAt, nextAttemptAt: createdAt, signature: signed.signature, bodySha256: signed.bodySha256, signatureVersion: 'v1', headers: { 'x-resilience-signature': signed.signature, 'x-resilience-timestamp': createdAt, 'x-resilience-event': eventType, 'x-resilience-delivery-id': deliveryId } });
  }
  persistState(state, auditLog, notifications, comments, webhooks, webhookDeliveries, jobRuns);
}
export function listNotifications(unreadOnly = false) { return clone(notifications.filter((item) => !unreadOnly || !item.read)); }
export function markNotificationRead(id) { const item = notifications.find((candidate) => candidate.id === id); if (!item) return null; item.read = true; persistState(state, auditLog, notifications, comments, webhooks, webhookDeliveries, jobRuns); return clone(item); }
export function markAllNotificationsRead() {
  const changed = notifications.filter((item) => !item.read);
  changed.forEach((item) => { item.read = true; });
  if (changed.length) persistState(state, auditLog, notifications, comments, webhooks, webhookDeliveries, jobRuns);
  return { updated: changed.length };
}

export function recordDeadLetter(input, error, actor = 'connector') {
  const item = { id: `DLQ-${String(state.deadLetters.length + 1).padStart(4, '0')}`, status: 'queued', attempts: 0, payload: clone(input || {}), error: String(error?.message || error || 'Error de ingesta'), actor, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  state.deadLetters.unshift(item);
  persistState(state, auditLog, notifications, comments, webhooks, webhookDeliveries, jobRuns);
  return clone(item);
}

export function listDeadLetters(status) { return clone(state.deadLetters.filter((item) => !status || item.status === status)); }

export function retryDeadLetter(id, overridePayload, actor = 'operator') {
  const item = state.deadLetters.find((candidate) => candidate.id === id);
  if (!item) return null;
  item.attempts += 1;
  item.status = 'processing';
  item.updatedAt = new Date().toISOString();
  const payload = overridePayload && typeof overridePayload === 'object' ? overridePayload : item.payload;
  try {
    const result = ingestEvent(payload, actor);
    item.status = 'resolved';
    item.error = null;
    item.result = { created: result.created, alertId: result.alert.id };
  } catch (error) {
    item.status = 'queued';
    item.error = error.message;
  }
  item.updatedAt = new Date().toISOString();
  persistState(state, auditLog, notifications, comments, webhooks, webhookDeliveries, jobRuns);
  return clone(item);
}

export function ingestEvent(input, actor = 'connector') {
  input = validateEventEnvelope(input);
  const required = ['externalId', 'sourceId', 'eventType', 'title', 'severity', 'impactUsd'];
  if (required.some((field) => input[field] === undefined)) throw new Error('Faltan campos requeridos del evento');
  const source = state.sources.find((item) => item.id === input.sourceId);
  if (!source) throw new Error(`Fuente desconocida: ${input.sourceId}`);
  if (typeof input.externalId !== 'string' || input.externalId.trim().length < 2 || input.externalId.length > 200) throw new Error('externalId debe tener entre 2 y 200 caracteres');
  if (typeof input.title !== 'string' || input.title.trim().length < 2 || input.title.length > 300) throw new Error('title debe tener entre 2 y 300 caracteres');
  if (typeof input.eventType !== 'string' || input.eventType.trim().length < 2 || input.eventType.length > 100) throw new Error('eventType inválido');
  if (!['critical', 'high', 'medium', 'low'].includes(input.severity)) throw new Error('severity inválida');
  const impactUsd = Number(input.impactUsd);
  if (!Number.isFinite(impactUsd) || impactUsd < 0) throw new Error('impactUsd debe ser un número no negativo');

  const existing = state.alerts.find((item) => item.payload?.externalId === input.externalId);
  if (existing) return { alert: clone(existing), created: false };

  const alert = {
    id: `INC-${String(Date.now()).slice(-6)}`,
    vertical: input.vertical || 'Oil & Gas',
    severity: input.severity,
    title: String(input.title).trim(),
    location: input.location ? String(input.location) : 'No especificado',
    impactUsd,
    status: 'open',
    createdAt: new Date().toISOString(),
    sourceIds: [source.id],
    evidenceClass: 'observed',
    payload: { schemaVersion: input.schemaVersion, externalId: input.externalId, eventType: input.eventType, confidence: input.confidence, provenance: input.provenance, observedAt: input.observedAt, evidenceClass: 'observed', raw: input.payload || {} },
  };
  state.alerts.unshift(alert);
  source.status = 'connected';
  source.lastEventAt = alert.createdAt;
  auditLog.unshift({ id: `AUD-${String(auditLog.length + 1).padStart(4, '0')}`, entityType: 'alert', entityId: alert.id, action: 'event_ingested', actor, message: `Evento ${input.externalId} ingerido desde ${source.name}.`, createdAt: alert.createdAt });
  notifications.unshift({ id: `NOT-${String(notifications.length + 1).padStart(4, '0')}`, type: 'new_alert', title: alert.title, message: `${alert.location} · ${alert.impactUsd} USD de exposición.`, read: false, createdAt: alert.createdAt });
  dispatchWebhook('alert.created', alert);
  persistState(state, auditLog, notifications, comments, webhooks, webhookDeliveries, jobRuns);
  return { alert: clone(alert), created: true };
}

export function getReadiness() {
  const sources = state.sources.map((source) => ({ id: source.id, name: source.name, status: source.status, lastEventAt: source.lastEventAt || null }));
  const quality = getDataQualityReport();
  const audit = getAuditIntegrity();
  const sourceHealth = getSourceHealthOverview();
  const checks = { persistence: true, sourceRegistry: sources.length > 0, auth: true, dataQuality: quality.ready, auditIntegrity: audit.valid, sourceHealth: sourceHealth.ready };
  return { ready: Object.values(checks).every(Boolean), checks, sources, checkedAt: new Date().toISOString() };
}

export function getLocalSnapshot() {
  const safeWebhooks = webhooks.map(({ secret: _secret, ...webhook }) => ({ ...webhook, secretConfigured: true }));
  return clone({ schemaVersion: 1, state, auditLog, notifications, comments, webhooks: safeWebhooks, webhookDeliveries, jobRuns, exportedAt: new Date().toISOString(), mode: 'local-platform' });
}

export function resetLocalDemo(actor = 'admin') {
  state.alerts = clone(seed.alerts);
  state.cases = clone(seed.cases);
  state.scenarios = clone(seed.scenarios);
  state.sources = clone(seed.sources);
  state.deadLetters = [];
  state.calibrationFixtures = [];
  state.pilotFeedback = [];
  state.incidents = [];
  state.sourceIntakeReviews = [];
  state.decisionShares = [];
  auditLog.splice(0, auditLog.length, ...clone(initialAuditLog));
  notifications.splice(0, notifications.length, { id: 'NOT-0001', type: 'critical_alert', title: 'SMW-5 requiere atención', message: 'Existe una alerta crítica abierta en Suez / Mar Rojo.', read: false, createdAt: now });
  comments.splice(0, comments.length);
  webhooks.splice(0, webhooks.length);
  webhookDeliveries.splice(0, webhookDeliveries.length);
  jobRuns.splice(0, jobRuns.length);
  persistState(state, auditLog, notifications, comments, webhooks, webhookDeliveries, jobRuns);
  return { status: 'reset', mode: 'demo_local_only', actor, resetAt: new Date().toISOString(), counts: { alerts: state.alerts.length, cases: state.cases.length, scenarios: state.scenarios.length, sources: state.sources.length }, disclaimer: 'Reinicio local controlado; no disponible como operación de producción.' };
}

export function restoreLocalSnapshot(snapshot, actor = 'admin') {
  const candidate = snapshot?.state;
  const collections = ['alerts', 'cases', 'scenarios', 'sources', 'deadLetters', 'calibrationFixtures', 'pilotFeedback', 'incidents', 'sourceIntakeReviews', 'decisionShares'];
  if (!candidate || collections.some((key) => !Array.isArray(candidate[key]))) throw new Error('Snapshot inválido: faltan colecciones principales');
  if ([...collections, 'auditLog', 'notifications', 'comments', 'webhooks', 'webhookDeliveries', 'jobRuns'].some((key) => {
    const value = key === 'auditLog' || key === 'notifications' || key === 'comments' || key === 'webhooks' || key === 'webhookDeliveries' || key === 'jobRuns' ? snapshot[key] : candidate[key];
    return !Array.isArray(value) || value.some((item) => !item || typeof item !== 'object' || typeof item.id !== 'string');
  })) throw new Error('Snapshot inválido: registros mal formados');

  for (const key of collections) state[key] = clone(candidate[key]);
  const replace = (target, value) => { target.splice(0, target.length, ...clone(value)); };
  replace(auditLog, snapshot.auditLog);
  replace(notifications, snapshot.notifications);
  replace(comments, snapshot.comments);
  replace(webhooks, snapshot.webhooks.map((webhook) => ({ ...webhook, secret: createWebhookSecret() })));
  replace(webhookDeliveries, snapshot.webhookDeliveries);
  replace(jobRuns, snapshot.jobRuns);
  const restoredAt = new Date().toISOString();
  auditLog.unshift({ id: `AUD-${String(auditLog.length + 1).padStart(4, '0')}`, entityType: 'platform', entityId: 'LOCAL', action: 'snapshot_restored', actor, message: 'Snapshot local restaurado de forma controlada.', createdAt: restoredAt });
  persistState(state, auditLog, notifications, comments, webhooks, webhookDeliveries, jobRuns);
  return { restored: true, restoredAt, schemaVersion: 1, counts: Object.fromEntries(collections.map((key) => [key, state[key].length])) };
}

export function getComplianceReadiness() {
  const controls = [
    { id: 'authentication', label: 'Autenticación', status: process.env.AUTH_REQUIRED === 'true' ? 'configured_local' : 'demo_optional', evidence: 'Tokens HMAC y usuarios locales' },
    { id: 'authorization', label: 'Autorización por rol', status: 'implemented_local', evidence: 'admin, risk_analyst y viewer' },
    { id: 'auditability', label: 'Trazabilidad', status: 'implemented_local', evidence: 'audit log por casos, alertas y escenarios' },
    { id: 'persistence', label: 'Persistencia', status: 'partial_local', evidence: 'JSON local; migración productiva pendiente' },
    { id: 'row_level_security', label: 'Aislamiento por organización', status: 'pending_external', evidence: 'Requiere Supabase RLS' },
    { id: 'data_provenance', label: 'Procedencia de datos', status: 'partial_local', evidence: 'Registro local de fuentes, linaje y clasificación; licencias pendientes' },
    { id: 'retention_policy', label: 'Retención y borrado', status: 'pending_external', evidence: 'Debe definirse con política legal y almacenamiento productivo' },
    { id: 'webhook_security', label: 'Seguridad webhook', status: 'partial_local', evidence: 'Firma HMAC, rotación y outbox local; worker externo pendiente' },
  ];
  return { ready: controls.every((control) => !['pending_external', 'illustrative_only'].includes(control.status)), scope: 'local-demo', disclaimer: 'No constituye certificación SOC 2, ISO 27001 ni compliance legal.', controls, checkedAt: new Date().toISOString() };
}

export function getProvenanceOverview() {
  const catalogMap = new Map(listDataCatalog().map((item) => [item.id, item]));
  const sourceRecords = state.sources.map((source) => {
    const catalog = catalogMap.get(source.id) || {};
    return {
      id: source.id,
      name: source.name,
      kind: source.kind || 'unknown',
      sourceClass: catalog.sourceClass || 'unknown',
      coverage: catalog.coverage || null,
      requiredFor: catalog.requiredFor || [],
      refreshSlaHours: catalog.refreshSlaHours ?? null,
      classification: catalog.sourceClass || (source.status === 'demo' ? 'illustrative_demo' : 'external_feed_placeholder'),
      licenseStatus: catalog.licenseStatus || (source.status === 'demo' ? 'not_for_production' : 'license_verification_required'),
      lineage: [`source:${source.id}`, 'normalizer:local-event-schema', 'consumer:alert-correlation'],
      freshness: { lastEventAt: source.lastEventAt || null, latencySeconds: source.latencySeconds ?? null },
      caveats: source.status === 'demo' ? ['Valores ilustrativos', 'No utilizar para decisiones reales'] : ['Conector local simulado', 'Validar contrato y licencia antes de producción'],
    };
  });
  const modelRecords = listModels().map((model) => ({ id: model.id, version: model.version, status: model.status, assumptions: model.assumptions, limitations: model.limitations, validationStatus: 'not_calibrated_with_historical_data' }));
  return { scope: 'local-platform', generatedAt: new Date().toISOString(), disclaimer: 'El registro documenta procedencia y supuestos locales; no prueba derechos de uso ni exactitud de mercado.', sources: sourceRecords, models: modelRecords, ready: sourceRecords.length > 0 && modelRecords.length > 0 };
}

export function getRetentionOverview(referenceTime = Date.now()) {
  const configuredDays = Number(process.env.LOCAL_RETENTION_DAYS || 365);
  const retentionDays = Number.isFinite(configuredDays) ? Math.min(Math.max(Math.floor(configuredDays), 1), 3650) : 365;
  const cutoffMs = referenceTime - retentionDays * 86_400_000;
  const collections = { alerts: state.alerts, cases: state.cases, scenarios: state.scenarios, deadLetters: state.deadLetters, sourceIntakeReviews: state.sourceIntakeReviews, auditLog, comments, webhookDeliveries, jobRuns };
  const summary = Object.entries(collections).map(([name, items]) => {
    const dated = items.filter((item) => Number.isFinite(Date.parse(item.createdAt || item.startedAt || item.updatedAt)));
    const eligible = dated.filter((item) => Date.parse(item.createdAt || item.startedAt || item.updatedAt) < cutoffMs);
    return { name, total: items.length, dated: dated.length, eligibleForReview: eligible.length, missingTimestamp: items.length - dated.length };
  });
  return { scope: 'local-platform', policyVersion: 'local-retention-v1', retentionDays, cutoffAt: new Date(cutoffMs).toISOString(), dryRun: true, deletionEnabled: false, collections: summary, disclaimer: 'Vista previa no destructiva. El borrado y la retención legal requieren política aprobada y almacenamiento productivo.' };
}

export function getDataQualityReport() {
  const sourceIds = new Set(state.sources.map((source) => source.id));
  const externalIds = state.alerts.map((alert) => alert.payload?.externalId).filter(Boolean);
  const duplicateExternalIds = [...new Set(externalIds.filter((id, index) => externalIds.indexOf(id) !== index))];
  const orphanAlerts = state.alerts.filter((alert) => !Array.isArray(alert.sourceIds) || alert.sourceIds.some((id) => !sourceIds.has(id))).map((alert) => alert.id);
  const orphanCases = state.cases.filter((item) => item.alertId && !state.alerts.some((alert) => alert.id === item.alertId)).map((item) => item.id);
  const invalidScenarios = state.scenarios.filter((item) => !Number.isFinite(Number(item.confidence)) || Number(item.confidence) < 0 || Number(item.confidence) > 1 || Number(item.lossIfWaitUsd) < 0).map((item) => item.id);
  const checks = [
    { id: 'source_references', label: 'Referencias de fuentes', status: orphanAlerts.length ? 'fail' : 'pass', count: orphanAlerts.length, details: orphanAlerts },
    { id: 'case_references', label: 'Referencias alerta -> caso', status: orphanCases.length ? 'fail' : 'pass', count: orphanCases.length, details: orphanCases },
    { id: 'event_deduplication', label: 'External IDs duplicados', status: duplicateExternalIds.length ? 'warn' : 'pass', count: duplicateExternalIds.length, details: duplicateExternalIds },
    { id: 'scenario_values', label: 'Valores de escenarios', status: invalidScenarios.length ? 'fail' : 'pass', count: invalidScenarios.length, details: invalidScenarios },
    { id: 'source_registry', label: 'Registro de fuentes', status: state.sources.length ? 'pass' : 'fail', count: state.sources.length, details: [] },
  ];
  return { ready: checks.every((check) => check.status !== 'fail'), scope: 'local-platform', checkedAt: new Date().toISOString(), totals: { alerts: state.alerts.length, cases: state.cases.length, scenarios: state.scenarios.length, sources: state.sources.length, deadLetters: state.deadLetters.length }, checks };
}

export function getAuditIntegrity() {
  return { ...verifyAuditChain(auditLog), scope: 'local-platform', checkedAt: new Date().toISOString(), disclaimer: 'La cadena se sella al persistir el estado local; la integración productiva deberá conservar el mismo control en almacenamiento durable.' };
}

export function getSlaOverview(filters = {}) {
  const cases = state.cases.filter((item) => !filters.vertical || itemVertical(item) === filters.vertical).map((item) => decorateCase(item));
  const counts = { on_track: 0, at_risk: 0, overdue: 0, closed: 0, unknown: 0 };
  cases.forEach((item) => { counts[item.sla.status] = (counts[item.sla.status] || 0) + 1; });
  return { checkedAt: new Date().toISOString(), counts, cases: clone(cases), ready: counts.overdue === 0 };
}

export function runSlaSweep(actor = 'scheduler') {
  const overview = getSlaOverview();
  const actionable = overview.cases.filter((item) => ['at_risk', 'overdue'].includes(item.sla.status));
  const created = [];
  for (const item of actionable) {
    const exists = notifications.some((notification) => notification.type === 'sla_warning' && notification.caseId === item.id && !notification.read);
    if (exists) continue;
    const notification = { id: `NOT-${String(notifications.length + 1).padStart(4, '0')}`, type: 'sla_warning', caseId: item.id, title: item.sla.status === 'overdue' ? `SLA vencido: ${item.id}` : `SLA en riesgo: ${item.id}`, message: item.sla.status === 'overdue' ? 'El caso requiere escalamiento inmediato.' : `Quedan aproximadamente ${item.sla.remainingMinutes} minutos.`, read: false, createdAt: new Date().toISOString() };
    notifications.unshift(notification);
    auditLog.unshift({ id: `AUD-${String(auditLog.length + 1).padStart(4, '0')}`, entityType: 'case', entityId: item.id, action: 'sla_sweep_flagged', actor, message: `Caso marcado como ${item.sla.status}.`, createdAt: notification.createdAt });
    created.push(notification);
  }
  if (created.length) persistState(state, auditLog, notifications, comments, webhooks, webhookDeliveries, jobRuns);
  return { checkedAt: overview.checkedAt, evaluated: overview.cases.length, flagged: actionable.length, notificationsCreated: created.length, notifications: clone(created), counts: overview.counts };
}

export function runSourceHealthSweep(actor = 'scheduler') {
  const overview = getSourceHealthOverview();
  const actionable = overview.sources.filter((item) => ['stale', 'degraded', 'error'].includes(item.health));
  const created = [];
  for (const source of actionable) {
    const exists = notifications.some((notification) => notification.type === 'source_health' && notification.sourceId === source.id && !notification.read);
    if (exists) continue;
    const notification = { id: `NOT-${String(notifications.length + 1).padStart(4, '0')}`, type: 'source_health', sourceId: source.id, title: `Salud de fuente: ${source.name}`, message: `La fuente esta ${source.health}; revisar freshness, latencia y licencia antes de recomendar.`, read: false, createdAt: new Date().toISOString() };
    notifications.unshift(notification);
    auditLog.unshift({ id: `AUD-${String(auditLog.length + 1).padStart(4, '0')}`, entityType: 'source', entityId: source.id, action: 'source_health_sweep_flagged', actor, message: `Fuente marcada como ${source.health}.`, createdAt: notification.createdAt });
    created.push(notification);
  }
  if (created.length) persistState(state, auditLog, notifications, comments, webhooks, webhookDeliveries, jobRuns);
  return { checkedAt: overview.checkedAt, evaluated: overview.sources.length, flagged: actionable.length, notificationsCreated: created.length, notifications: clone(created), counts: overview.counts, ready: overview.ready };
}

export function listJobRuns() { return clone(jobRuns); }
export function runDemoIngestionJob(actor = 'scheduler') {
  const job = { id: `JOB-${String(jobRuns.length + 1).padStart(4, '0')}`, type: 'demo_ingestion', status: 'running', startedAt: new Date().toISOString(), eventsReceived: 0, alertsCreated: 0 };
  jobRuns.unshift(job);
  const events = [
    { externalId: `job-${job.id}-ais`, sourceId: 'ais-demo', eventType: 'ais_gap', title: 'AIS gap detectado por job', severity: 'medium', impactUsd: 180000, location: 'Estrecho de Ormuz' },
    { externalId: `job-${job.id}-port`, sourceId: 'ports-demo', eventType: 'port_delay', title: 'Congestión portuaria detectada por job', severity: 'high', impactUsd: 420000, location: 'Fujairah · UAE' },
  ];
  for (const event of events) {
    const result = ingestEvent(event, actor);
    job.eventsReceived += 1;
    if (result.created) job.alertsCreated += 1;
  }
  job.status = 'completed';
  job.finishedAt = new Date().toISOString();
  persistState(state, auditLog, notifications, comments, webhooks, webhookDeliveries, jobRuns);
  return clone(job);
}

export function createCaseFromAlert(alertId, actor = 'system') {
  const alert = state.alerts.find((item) => item.id === alertId);
  if (!alert) return null;
  const existing = state.cases.find((item) => item.alertId === alertId);
  if (existing) return { case: clone(existing), created: false };

  const caseItem = {
    id: `RS-${String(state.cases.length + 1).padStart(4, '0')}`,
    alertId,
    title: alert.title,
    owner: 'Risk Desk',
    priority: alert.severity === 'critical' ? 'P1' : 'P2',
    status: 'open',
    slaMinutes: alert.severity === 'critical' ? 45 : 180,
    impactUsd: alert.impactUsd,
    humanValidation: 'pending',
    createdAt: new Date().toISOString(),
  };
  state.cases.unshift(caseItem);
  alert.status = 'in_progress';
  auditLog.unshift({ id: `AUD-${String(auditLog.length + 1).padStart(4, '0')}`, entityType: 'case', entityId: caseItem.id, action: 'case_opened_from_alert', actor, message: `Alerta ${alertId} convertida en caso.`, createdAt: new Date().toISOString() });
  persistState(state, auditLog, notifications, comments, webhooks, webhookDeliveries, jobRuns);
  return { case: clone(caseItem), created: true };
}

export function createScenario(input, actor = 'operator') {
  const required = ['name', 'lossIfWaitUsd', 'mitigationCostUsd', 'protectedValueUsd', 'confidence', 'horizonHours'];
  if (required.some((field) => input[field] === undefined)) throw new Error('Faltan campos requeridos del escenario');
  if (Number(input.lossIfWaitUsd) < 0 || Number(input.mitigationCostUsd) < 0 || Number(input.protectedValueUsd) < 0) throw new Error('Los valores económicos no pueden ser negativos');
  if (Number(input.confidence) < 0 || Number(input.confidence) > 1) throw new Error('confidence debe estar entre 0 y 1');
  const scenario = { id: `SC-${String(state.scenarios.length + 1).padStart(4, '0')}`, name: String(input.name).trim(), status: input.status || 'draft', lossIfWaitUsd: Number(input.lossIfWaitUsd), mitigationCostUsd: Number(input.mitigationCostUsd), protectedValueUsd: Number(input.protectedValueUsd), confidence: Number(input.confidence), horizonHours: Number(input.horizonHours), assumptions: Array.isArray(input.assumptions) ? input.assumptions : [], evidenceClass: Array.isArray(input.sourceIds) && input.sourceIds.length ? 'inferred' : 'assumed', evidence: buildEvidence({ evidenceClass: Array.isArray(input.sourceIds) && input.sourceIds.length ? 'inferred' : 'assumed', sourceIds: input.sourceIds || [], modelId: input.modelId || 'impact-cascade', modelVersion: input.modelVersion || '0.5.0', assumptions: Array.isArray(input.assumptions) ? input.assumptions : [], inferred: ['scenario_economics'] }), createdAt: new Date().toISOString(), createdBy: actor };
  state.scenarios.unshift(scenario);
  auditLog.unshift({ id: `AUD-${String(auditLog.length + 1).padStart(4, '0')}`, entityType: 'scenario', entityId: scenario.id, action: 'scenario_created', actor, message: `Escenario ${scenario.name} creado.`, createdAt: new Date().toISOString() });
  persistState(state, auditLog, notifications, comments, webhooks, webhookDeliveries);
  return clone(scenario);
}

export function getOverviewMetrics(filters = {}) {
  const alerts = state.alerts.filter((item) => !filters.vertical || itemVertical(item) === filters.vertical);
  const cases = state.cases.filter((item) => !filters.vertical || itemVertical(item) === filters.vertical);
  return {
    resilienceScore: 72,
    vertical: filters.vertical || 'all',
    openAlerts: alerts.filter((item) => item.status === 'open').length,
    openCases: cases.filter((item) => item.status !== 'closed').length,
    monitoredSources: state.sources.length,
    exposureUsd: cases.filter((item) => item.status !== 'closed').reduce((sum, item) => sum + item.impactUsd, 0),
    lastUpdatedAt: new Date().toISOString(),
  };
}

export function updateCase(id, patch, actor = 'operator') {
  const item = state.cases.find((candidate) => candidate.id === id);
  if (!item) return null;

  const allowedFields = ['owner', 'status', 'humanValidation'];
  const validStatuses = ['open', 'in_progress', 'closed', 'blocked'];
  const validValidations = ['pending', 'validated', 'rejected'];
  const changes = {};
  for (const field of allowedFields) {
    if (patch[field] !== undefined) {
      if (field === 'owner' && (typeof patch[field] !== 'string' || patch[field].trim().length < 2 || patch[field].length > 120)) throw new Error('owner inválido');
      if (field === 'status' && !validStatuses.includes(patch[field])) throw new Error('status inválido');
      if (field === 'humanValidation' && !validValidations.includes(patch[field])) throw new Error('humanValidation inválida');
      item[field] = patch[field];
      changes[field] = patch[field];
    }
  }

  if (changes.status === 'closed' && (changes.humanValidation || item.humanValidation) !== 'validated') throw new Error('Un caso solo puede cerrarse después de validación humana');

  if (Object.keys(changes).length > 0) {
    auditLog.unshift({
      id: `AUD-${String(auditLog.length + 1).padStart(4, '0')}`,
      entityType: 'case',
      entityId: id,
      action: 'case_updated',
      actor,
      message: `Caso actualizado: ${Object.keys(changes).join(', ')}.`,
      changes,
      createdAt: new Date().toISOString(),
    });
    if (changes.status === 'closed' && item.alertId) {
      const alert = state.alerts.find((candidate) => candidate.id === item.alertId);
      if (alert) {
        alert.status = 'resolved';
        auditLog.unshift({ id: `AUD-${String(auditLog.length + 1).padStart(4, '0')}`, entityType: 'alert', entityId: alert.id, action: 'alert_resolved', actor, message: `Alerta resuelta al cerrar el caso ${id}.`, createdAt: new Date().toISOString() });
      }
    }
    dispatchWebhook('case.updated', item);
    persistState(state, auditLog, notifications, comments, webhooks, webhookDeliveries, jobRuns);
  }

  return clone(item);
}

export function getLatestBrief(options = {}) {
  const audience = ['executive', 'operator'].includes(options.audience) ? options.audience : 'executive';
  const openCases = state.cases.filter((item) => item.status === 'open');
  const exposureUsd = openCases.reduce((sum, item) => sum + item.impactUsd, 0);
  const scenario = state.scenarios[0];
  const decoratedScenario = decorateScenarioEvidence(scenario);
  const brief = {
    id: 'BRIEF-LATEST',
    generatedAt: new Date().toISOString(),
    audience,
    resilienceScore: 72,
    exposureUsd,
    materialEvents: state.alerts.filter((item) => item.status === 'open').length,
    decisionRequired: 'Autorizar reruteo preventivo del corredor Suez–Mar Rojo.',
    recommendation: scenario.name,
    protectedValueUsd: scenario.protectedValueUsd,
    confidence: scenario.confidence,
    assumptions: ['Los datos de esta demo son ilustrativos.', 'Cada recomendación debe enlazar a su fuente y versión de modelo.'],
    evidence: decoratedScenario?.evidence || null,
    evidenceClass: decoratedScenario?.evidenceClass || 'assumed',
  };
  if (audience === 'operator') brief.operatorDetail = {
    openCases: openCases.map((item) => decorateCase(item)),
    topAlerts: listAlerts({ limit: 5 }),
    pendingApprovals: state.cases.filter((item) => item.humanValidation === 'pending').map((item) => item.id),
    actionEvidenceRequired: ['source_ids', 'model_version', 'assumptions', 'human_approval', 'outcome_after_action']
  };
  return brief;
}
