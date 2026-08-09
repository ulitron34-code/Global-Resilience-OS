const PLAYBOOKS = [
  { id: 'reroute-critical-flow', name: 'Reruteo preventivo de flujo crítico', category: 'continuity', ownerRole: 'risk_analyst', defaultSlaMinutes: 45, triggers: ['critical', 'high'], steps: ['Confirmar fuente primaria y segunda señal.', 'Identificar ruta o proveedor alterno.', 'Comparar pérdida por espera contra costo de mitigación.', 'Solicitar aprobación del owner.', 'Registrar decisión, evidencia y criterio de salida.'] },
  { id: 'cable-degradation', name: 'Degradación de cable submarino', category: 'infrastructure', ownerRole: 'risk_analyst', defaultSlaMinutes: 60, triggers: ['cable', 'ais_gap', 'latency'], steps: ['Validar estado del cable y redundancia disponible.', 'Enumerar servicios y verticales dependientes.', 'Calcular escenarios 24h, 72h y 30d.', 'Activar comunicación con infraestructura y continuidad.', 'Cerrar sólo con validación humana y evidencia de recuperación.'] },
  { id: 'port-congestion', name: 'Congestión portuaria y corredor alterno', category: 'maritime', ownerRole: 'operations', defaultSlaMinutes: 180, triggers: ['port_delay', 'chokepoint'], steps: ['Confirmar congestión y ventana estimada.', 'Medir exposición por mercancía y región.', 'Comparar desvío, inventario y espera.', 'Asignar responsable operativo.', 'Actualizar el caso con resultado real.'] },
  { id: 'source-quality-degradation', name: 'Degradación de fuente de datos', category: 'data-quality', ownerRole: 'admin', defaultSlaMinutes: 120, triggers: ['stale', 'error', 'duplicate'], steps: ['Marcar la fuente como degradada.', 'Bloquear recomendaciones dependientes si falta evidencia.', 'Activar fuente secundaria o modo abstención.', 'Registrar incidente del conector.', 'Restituir readiness después de prueba de frescura.'] },
  { id: 'regulatory-evidence-pack', name: 'Paquete de evidencia regulatoria', category: 'governance', ownerRole: 'risk_analyst', defaultSlaMinutes: 240, triggers: ['audit', 'regulatory', 'third_party'], steps: ['Seleccionar alcance y jurisdicción.', 'Reunir fuentes, supuestos y versión de modelo.', 'Vincular controles y evidencia de ejecución.', 'Revisión humana del paquete.', 'Exportar y sellar el artefacto.'] },
];
const PLAYBOOK_VERSION = '1.0.0';
const DEFAULT_EVIDENCE = ['source_ids', 'model_version', 'assumptions', 'human_approval', 'outcome_after_action'];
function versioned(playbook) {
  return { ...playbook, schemaVersion: '1.0.0-local', version: PLAYBOOK_VERSION, reviewStatus: 'local_seed', requiredEvidence: [...DEFAULT_EVIDENCE] };
}
function clone(value) { return structuredClone(value); }
export function listPlaybooks() { return clone(PLAYBOOKS.map(versioned)); }
export function getPlaybook(id) { const playbook = PLAYBOOKS.find((item) => item.id === id); return playbook ? clone(versioned(playbook)) : null; }
export function buildActionPlan(input = {}) {
  const playbook = versioned(PLAYBOOKS.find((item) => item.id === input.playbookId) || PLAYBOOKS[0]);
  const lossIfWaitUsd = Math.max(0, Number(input.lossIfWaitUsd || 0));
  const mitigationCostUsd = Math.max(0, Number(input.mitigationCostUsd || 0));
  const protectedValueUsd = Math.max(0, Number(input.protectedValueUsd || Math.max(lossIfWaitUsd - mitigationCostUsd, 0)));
  const netValueUsd = protectedValueUsd - mitigationCostUsd;
  const confidence = Math.min(1, Math.max(0, Number(input.confidence ?? 0.45)));
  const decision = confidence < 0.5 ? 'abstain_insufficient_confidence' : netValueUsd > 0 ? 'mitigation_favorable' : 'wait_or_collect_evidence';
  return { schemaVersion: '1.0.0-local', generatedAt: new Date().toISOString(), status: 'draft_for_human_approval', playbook: clone(playbook), caseId: input.caseId ? String(input.caseId) : null, trigger: input.trigger ? String(input.trigger) : 'scenario_review', economics: { lossIfWaitUsd, mitigationCostUsd, protectedValueUsd, netValueUsd, roiMultiple: mitigationCostUsd > 0 ? Number((protectedValueUsd / mitigationCostUsd).toFixed(2)) : null }, decision, confidence, assumptions: Array.isArray(input.assumptions) ? input.assumptions.map(String).slice(0, 20) : ['El impacto es una estimación local.', 'La ejecución requiere aprobación humana.', 'La disponibilidad de la mitigación no está verificada.'], steps: playbook.steps.map((title, index) => ({ order: index + 1, title, status: index === 0 ? 'ready' : 'blocked_until_previous', ownerRole: playbook.ownerRole })), evidenceRequirements: ['source_ids', 'model_version', 'assumptions', 'human_approval', 'outcome_after_action'], disclaimer: 'Plan local de decisión. No ejecuta acciones externas ni sustituye análisis profesional.' };
}
