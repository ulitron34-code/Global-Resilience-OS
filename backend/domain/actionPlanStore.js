import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { buildActionPlan } from './playbooks.js';
import { validateActionPlanPatch } from './actionPlanWorkflow.js';
import { attachDecisionEvidence } from './decisionEvidence.js';
import { buildEvidence } from './evidenceClassification.js';

const file = process.env.ACTION_PLANS_FILE || resolve(dirname(fileURLToPath(import.meta.url)), '..', 'storage', 'action-plans.json');
export const DEFAULT_ORGANIZATION_ID = 'nashadi-demo';
const isTest = process.env.NODE_ENV === 'test' || process.argv.includes('--test');
let plans = load();

function load() {
  if (!existsSync(file)) return [];
  try {
    const value = JSON.parse(readFileSync(file, 'utf8'));
    return Array.isArray(value) ? value.map((item) => ({ ...item, organizationId: item.organizationId || DEFAULT_ORGANIZATION_ID })) : [];
  } catch { return []; }
}
function persist() { if (isTest) return; mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, JSON.stringify(plans, null, 2), 'utf8'); }
function clone(value) { return structuredClone(value); }

export function listActionPlans(filters = {}) {
  const organizationId = filters.organizationId || DEFAULT_ORGANIZATION_ID;
  const items = plans.filter((item) => item.organizationId === organizationId && (!filters.caseId || item.caseId === filters.caseId) && (!filters.status || item.status === filters.status));
  return clone(items.slice(0, Math.min(Number(filters.limit) || 100, 200)));
}

export function getActionPlan(id, organizationId = DEFAULT_ORGANIZATION_ID) { return clone(plans.find((item) => item.id === id && item.organizationId === organizationId) || null); }

export function createActionPlan(input, actor = 'operator', organizationId = DEFAULT_ORGANIZATION_ID) {
  const plan = attachDecisionEvidence(buildActionPlan(input), input);
  const saved = { ...plan, id: `AP-${randomUUID().slice(0, 8).toUpperCase()}`, organizationId, context: { vertical: input.vertical ? String(input.vertical).slice(0, 120) : 'unclassified', region: input.region ? String(input.region).slice(0, 120) : 'global', horizonHours: Number.isFinite(Number(input.horizonHours)) ? Math.max(0, Number(input.horizonHours)) : null }, createdBy: actor, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  plans.unshift(saved);
  persist();
  return clone(saved);
}

export function updateActionPlan(id, patch = {}, actor = 'operator', organizationId = DEFAULT_ORGANIZATION_ID) {
  const item = plans.find((candidate) => candidate.id === id && candidate.organizationId === organizationId);
  if (!item) return null;
  const allowed = ['status', 'humanApproval', 'owner', 'outcome'];
  const workflow = validateActionPlanPatch(item, patch);
  const changes = {};
  for (const field of allowed) if (patch[field] !== undefined) { item[field] = String(patch[field]).trim(); changes[field] = item[field]; }
  if (patch.status !== undefined) item.status = workflow.nextStatus;
  if (Object.keys(changes).length) { item.updatedAt = new Date().toISOString(); item.updatedBy = actor; persist(); }
  return clone(item);
}

export function recordActionPlanOutcome(id, input = {}, actor = 'operator', organizationId = DEFAULT_ORGANIZATION_ID) {
  const item = plans.find((candidate) => candidate.id === id && candidate.organizationId === organizationId);
  if (!item) return null;
  if (item.status !== 'in_execution') throw new Error('El plan debe estar en ejecución antes de registrar el resultado');
  const actualLossUsd = Number(input.actualLossUsd);
  const actualRecoveryHours = Number(input.actualRecoveryHours);
  if (!Number.isFinite(actualLossUsd) || actualLossUsd < 0) throw new Error('actualLossUsd debe ser un número no negativo');
  if (!Number.isFinite(actualRecoveryHours) || actualRecoveryHours < 0) throw new Error('actualRecoveryHours debe ser un número no negativo');
  const evidenceRef = String(input.evidenceRef || '').trim();
  if (!evidenceRef) throw new Error('evidenceRef es obligatorio para cerrar el feedback loop');
  const forecastLossUsd = Number(item.economics?.lossIfWaitUsd || 0);
  item.actualLossUsd = actualLossUsd;
  item.actualRecoveryHours = actualRecoveryHours;
  item.outcomeEvidence = evidenceRef;
  item.forecastLossUsd = forecastLossUsd;
  item.forecastErrorPct = forecastLossUsd > 0 ? Number((Math.abs(actualLossUsd - forecastLossUsd) / forecastLossUsd * 100).toFixed(2)) : null;
  item.outcome = String(input.outcome || 'Resultado registrado y pendiente de revisión analítica').trim();
  item.status = 'completed';
  item.updatedAt = new Date().toISOString();
  item.updatedBy = actor;
  item.outcomeRecordedAt = item.updatedAt;
  item.outcomeEvidenceRecord = buildEvidence({
    evidenceClass: 'observed',
    sourceIds: [evidenceRef],
    observed: ['actualLossUsd', 'actualRecoveryHours', 'outcome', 'forecastErrorPct'],
    assumptions: []
  });
  item.evidence = {
    ...(item.evidence || {}),
    outcome: item.outcomeEvidenceRecord,
    completeness: 'complete_for_local_review'
  };
  persist();
  return clone(item);
}

export function getActionPlanOutcomeMetrics(organizationId = DEFAULT_ORGANIZATION_ID) {
  const completed = plans.filter((item) => item.organizationId === organizationId && item.status === 'completed' && Number.isFinite(item.forecastErrorPct));
  const errors = completed.map((item) => item.forecastErrorPct);
  return { organizationId, completedWithOutcome: completed.length, meanAbsoluteForecastErrorPct: errors.length ? Number((errors.reduce((sum, value) => sum + value, 0) / errors.length).toFixed(2)) : null, maxForecastErrorPct: errors.length ? Math.max(...errors) : null, disclaimer: 'Métrica local basada únicamente en outcomes registrados por operadores; no representa validación estadística suficiente.' };
}

export function resetActionPlans() {
  const removed = plans.length;
  plans = [];
  persist();
  return { removed };
}

export function getAnonymousSectorBenchmark(minCohort = 3) {
  const completed = plans.filter((item) => item.status === 'completed' && Number.isFinite(item.forecastErrorPct));
  const groups = new Map();
  for (const item of completed) { const key = item.context?.vertical || 'unclassified'; const current = groups.get(key) || []; current.push(item); groups.set(key, current); }
  const sectors = [...groups.entries()].map(([vertical, items]) => {
    const eligible = items.length >= minCohort;
    const errors = items.map((item) => item.forecastErrorPct);
    return eligible ? { vertical, cohortSize: items.length, meanAbsoluteForecastErrorPct: Number((errors.reduce((sum, value) => sum + value, 0) / errors.length).toFixed(2)), completedOutcomes: items.length } : { vertical: 'withheld', cohortSize: 0, status: 'abstain_insufficient_cohort' };
  });
  return { schemaVersion: '1.0.0-local', generatedAt: new Date().toISOString(), kAnonymity: { minimumCohort: minCohort, applied: true }, sectors, totals: { completedOutcomes: completed.length, publishedSectors: sectors.filter((item) => item.vertical !== 'withheld').length }, disclaimer: 'Benchmark sectorial anonimizado local. No expone organizaciones ni cohortes pequeñas; no representa referencia estadística de mercado.' };
}
