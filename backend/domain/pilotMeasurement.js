import { randomBytes } from 'node:crypto';

const METRIC_TEMPLATES = [
  { id: 'time_to_explain_minutes', label: 'Tiempo para explicar la exposición', unit: 'minutes', direction: 'lower_is_better', required: true },
  { id: 'time_to_decision_minutes', label: 'Tiempo para tomar la decisión', unit: 'minutes', direction: 'lower_is_better', required: true },
  { id: 'evidence_completeness_pct', label: 'Completitud de procedencia', unit: 'percent', direction: 'higher_is_better', required: true },
  { id: 'action_documentation_pct', label: 'Casos con acción documentada', unit: 'percent', direction: 'higher_is_better', required: true },
  { id: 'avoided_loss_usd', label: 'Pérdida evitada validada', unit: 'usd', direction: 'higher_is_better', required: false },
  { id: 'hours_recovered', label: 'Horas recuperadas', unit: 'hours', direction: 'higher_is_better', required: false },
];

const TEMPLATE_BY_ID = new Map(METRIC_TEMPLATES.map((item) => [item.id, item]));

function asNullableNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new Error('Los valores de medición deben ser números no negativos');
  return Number(number.toFixed(4));
}

function asNullableText(value, max = 240) {
  if (value === null || value === undefined || value === '') return null;
  const text = String(value).trim();
  if (text.length > max) throw new Error('La referencia de evidencia excede el límite permitido');
  return text || null;
}

export function listPilotMetricTemplates() {
  return structuredClone(METRIC_TEMPLATES);
}

export function buildDefaultPilotMeasurementPlan(organizationId = 'nashadi-demo') {
  return {
    id: 'PMP-DEFAULT',
    organizationId,
    version: 1,
    status: 'draft',
    metrics: METRIC_TEMPLATES.map((template) => ({ ...template, baseline: null, target: null, actual: null, evidenceRef: null, evidenceClass: 'evidence_required', note: null })),
    gate: { status: 'not_ready', requiredMetricIds: METRIC_TEMPLATES.filter((item) => item.required).map((item) => item.id), passed: 0, totalRequired: METRIC_TEMPLATES.filter((item) => item.required).length, missingEvidence: METRIC_TEMPLATES.filter((item) => item.required).map((item) => item.id), failed: [] },
    disclaimer: 'Plan local de medición; no demuestra valor comercial hasta contar con evidencia del cliente y resultados verificables.',
  };
}

export function normalizePilotMeasurementPlan(input = {}, organizationId = 'nashadi-demo', actor = 'operator') {
  if (!Array.isArray(input.metrics) || input.metrics.length === 0) throw new Error('El plan de medición requiere al menos una métrica');
  const seen = new Set();
  const metrics = input.metrics.map((raw) => {
    const id = String(raw?.id || '').trim();
    const template = TEMPLATE_BY_ID.get(id);
    if (!template) throw new Error(`Métrica de piloto no soportada: ${id || 'vacía'}`);
    if (seen.has(id)) throw new Error(`Métrica de piloto duplicada: ${id}`);
    seen.add(id);
    return { ...template, baseline: asNullableNumber(raw.baseline), target: asNullableNumber(raw.target), actual: asNullableNumber(raw.actual), evidenceRef: asNullableText(raw.evidenceRef), evidenceClass: raw.evidenceClass === 'observed' ? 'observed' : 'evidence_required', note: asNullableText(raw.note, 500) };
  });
  return { id: String(input.id || `PMP-${randomBytes(4).toString('hex').toUpperCase()}`), organizationId, version: Number.isInteger(input.version) && input.version > 0 ? input.version + 1 : 1, status: 'draft', metrics, createdBy: String(input.createdBy || actor), updatedBy: actor, updatedAt: new Date().toISOString(), disclaimer: 'Plan local de medición; no demuestra valor comercial hasta contar con evidencia del cliente y resultados verificables.' };
}

export function evaluatePilotMeasurementPlan(plan = {}) {
  const metrics = Array.isArray(plan.metrics) ? plan.metrics : [];
  const evaluated = metrics.map((metric) => {
    const complete = [metric.baseline, metric.target, metric.actual].every((value) => Number.isFinite(Number(value)));
    const evidenced = metric.evidenceClass === 'observed' && Boolean(metric.evidenceRef);
    const passed = complete && evidenced && (metric.direction === 'lower_is_better' ? metric.actual <= metric.target : metric.actual >= metric.target);
    return { ...metric, complete, evidenced, passed, status: !complete || !evidenced ? 'missing_evidence' : passed ? 'pass' : 'fail' };
  });
  const required = evaluated.filter((metric) => metric.required);
  const failed = required.filter((metric) => metric.status === 'fail').map((metric) => metric.id);
  const missingEvidence = required.filter((metric) => metric.status === 'missing_evidence').map((metric) => metric.id);
  const passed = required.filter((metric) => metric.status === 'pass').length;
  const status = missingEvidence.length ? 'not_ready' : failed.length ? 'no_go' : required.length > 0 && passed === required.length ? 'go' : 'not_ready';
  return { ...plan, status, metrics: evaluated, gate: { status, requiredMetricIds: required.map((metric) => metric.id), passed, totalRequired: required.length, missingEvidence, failed }, disclaimer: 'Go/no-go local basado en métricas y evidencia registradas; requiere validación del sponsor y no sustituye un piloto real.' };
}
