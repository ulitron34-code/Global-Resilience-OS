const STATUSES = ['open', 'triaged', 'contained', 'recovering', 'resolved', 'closed'];
const SEVERITIES = ['sev1', 'sev2', 'sev3', 'sev4'];

export function normalizeIncidentInput(input = {}, partial = false) {
  const result = {};
  if (!partial || input.title !== undefined) {
    const title = String(input.title || '').trim();
    if (title.length < 4 || title.length > 180) throw new Error('title de incidente inválido');
    result.title = title;
  }
  if (!partial || input.severity !== undefined) {
    const severity = String(input.severity || '').trim();
    if (!SEVERITIES.includes(severity)) throw new Error('severity de incidente inválida');
    result.severity = severity;
  }
  if (!partial || input.summary !== undefined) {
    const summary = String(input.summary || '').trim();
    if (summary.length < 5 || summary.length > 2000) throw new Error('summary de incidente inválido');
    result.summary = summary;
  }
  if (input.sourceIds !== undefined) {
    if (!Array.isArray(input.sourceIds) || input.sourceIds.length > 20) throw new Error('sourceIds de incidente inválidos');
    result.sourceIds = input.sourceIds.map((value) => String(value).trim()).filter(Boolean);
  }
  if (input.caseId !== undefined) result.caseId = input.caseId ? String(input.caseId).trim().slice(0, 80) : null;
  return result;
}

export function validateIncidentPatch(input = {}) {
  const result = normalizeIncidentInput(input, true);
  if (input.status !== undefined) {
    const status = String(input.status).trim();
    if (!STATUSES.includes(status)) throw new Error('status de incidente inválido');
    result.status = status;
  }
  if (input.note !== undefined) {
    const note = String(input.note).trim();
    if (note.length < 2 || note.length > 1000) throw new Error('note de incidente inválida');
    result.note = note;
  }
  return result;
}

export function canTransitionIncident(from, to) {
  if (from === to) return true;
  const order = STATUSES.indexOf(from);
  const next = STATUSES.indexOf(to);
  return order >= 0 && next === order + 1;
}

export function getIncidentRunbook() {
  return { version: '1.0.0-local', statuses: STATUSES, severityTargets: { sev1: { acknowledgeMinutes: 15, updateMinutes: 30 }, sev2: { acknowledgeMinutes: 30, updateMinutes: 60 }, sev3: { acknowledgeMinutes: 120, updateMinutes: 240 }, sev4: { acknowledgeMinutes: 480, updateMinutes: 1440 } }, steps: ['confirmar señal y alcance', 'asignar owner humano', 'contener sin ejecutar cambios externos automáticamente', 'registrar evidencia y comunicaciones', 'validar recuperación', 'cerrar con revisión post-incidente'], requiredEvidence: ['incident_id', 'owner', 'timeline', 'affected_sources', 'decision_package', 'closure_note'], disclaimer: 'Runbook local de coordinación. No ejecuta cambios de infraestructura ni sustituye el proceso de respuesta del cliente.' };
}
