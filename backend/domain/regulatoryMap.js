const FRAMEWORKS = [
  {
    id: 'nist-csf-2-gv-sc', name: 'NIST CSF 2.0 · GV.SC', jurisdiction: 'global',
    controls: [
      { id: 'GV.SC-01', title: 'Definir estrategia y objetivos de riesgo de cadena', evidence: ['product_requirements', 'data_requirements'] },
      { id: 'GV.SC-05', title: 'Integrar proveedores y terceros al ciclo de riesgo', evidence: ['data_catalog', 'source_provenance'] },
      { id: 'GV.SC-08', title: 'Monitorear desempeño y cambios de terceros', evidence: ['source_health', 'audit_log'] },
    ],
  },
  {
    id: 'nist-sp-800-161', name: 'NIST SP 800-161 Rev. 1', jurisdiction: 'global',
    controls: [
      { id: 'C-SCRM-IDENTIFY', title: 'Identificar proveedores, activos y dependencias', evidence: ['impact_graph', 'entity_resolution'] },
      { id: 'C-SCRM-ASSESS', title: 'Evaluar impacto, probabilidad y exposición', evidence: ['scenarios', 'calibration_benchmark'] },
      { id: 'C-SCRM-MONITOR', title: 'Monitorear señales y cambios materiales', evidence: ['event_contract', 'source_health', 'notifications'] },
    ],
  },
  {
    id: 'dora-third-party-risk', name: 'DORA · riesgo de terceros TIC', jurisdiction: 'EU',
    controls: [
      { id: 'DORA-TPRM-01', title: 'Registro de dependencias y terceros críticos', evidence: ['impact_graph', 'data_catalog'] },
      { id: 'DORA-TPRM-02', title: 'Incidentes, escalamiento y trazabilidad', evidence: ['alerts_cases', 'audit_log', 'sla'] },
      { id: 'DORA-TEST-01', title: 'Pruebas de resiliencia y escenarios', evidence: ['scenarios', 'decision_package'] },
    ],
  },
  {
    id: 'nis2-cer', name: 'NIS2 / CER · resiliencia de entidades críticas', jurisdiction: 'EU',
    controls: [
      { id: 'NIS2-RISK-01', title: 'Gestión de riesgos y dependencias críticas', evidence: ['impact_graph', 'source_provenance'] },
      { id: 'NIS2-INCIDENT-01', title: 'Detección, respuesta y reporte de incidentes', evidence: ['event_contract', 'alerts_cases', 'audit_log'] },
      { id: 'CER-RESILIENCE-01', title: 'Medidas de continuidad y recuperación', evidence: ['action_plans', 'snapshots_restore', 'decision_package'] },
    ],
  },
  {
    id: 'itu-submarine-cable-resilience', name: 'ITU · resiliencia de cables submarinos', jurisdiction: 'global',
    controls: [
      { id: 'ITU-CABLE-RISK', title: 'Identificar riesgos y dependencias de cable', evidence: ['impact_graph', 'data_catalog'] },
      { id: 'ITU-CABLE-MONITOR', title: 'Monitorear, alertar y registrar incidentes', evidence: ['connectors', 'source_health', 'audit_log'] },
      { id: 'ITU-CABLE-RECOVERY', title: 'Redundancia, reparación y prueba de estrés', evidence: ['scenarios', 'action_plans', 'outcome'] },
    ],
  },
];

function clone(value) { return structuredClone(value); }
export function listRegulatoryFrameworks() { return clone(FRAMEWORKS.map(({ controls, ...framework }) => ({ ...framework, controlCount: controls.length }))); }
export function getRegulatoryFramework(id) { return clone(FRAMEWORKS.find((framework) => framework.id === id) || null); }

export function buildRegulatoryEvidenceMap(input = {}) {
  const framework = FRAMEWORKS.find((item) => item.id === input.frameworkId) || FRAMEWORKS[0];
  const submitted = new Map((Array.isArray(input.evidence) ? input.evidence : []).map((item) => [String(item.controlId), item]));
  const controls = framework.controls.map((control) => {
    const item = submitted.get(control.id);
    return { ...control, status: item?.verified === true ? 'operator_verified_local' : 'evidence_required', evidenceRef: item?.evidenceRef ? String(item.evidenceRef) : null, note: item?.note ? String(item.note) : null };
  });
  return { schemaVersion: '1.0.0-local', framework: { id: framework.id, name: framework.name, jurisdiction: framework.jurisdiction }, generatedAt: new Date().toISOString(), scope: input.scope ? String(input.scope) : 'local-platform', controls, counts: { total: controls.length, verified: controls.filter((control) => control.status === 'operator_verified_local').length, missing: controls.filter((control) => control.status === 'evidence_required').length }, disclaimer: 'Mapa local de evidencia; no constituye certificación, opinión legal ni declaración de cumplimiento.' };
}
