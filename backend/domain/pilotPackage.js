function safe(value, fallback = '—') {
  return value === undefined || value === null || value === '' ? fallback : String(value);
}

export function pilotPackageToMarkdown(packet = {}) {
  const readiness = packet.readiness || {};
  const metrics = packet.metrics?.metrics || {};
  const scorecard = packet.scorecard || {};
  const checks = Array.isArray(readiness.checks) ? readiness.checks : [];
  const feedback = Array.isArray(packet.feedback) ? packet.feedback : [];
  const measurementPlan = packet.measurementPlan || {};
  const measurementMetrics = Array.isArray(measurementPlan.metrics) ? measurementPlan.metrics : [];
  const decisionContext = packet.decisionContext || {};
  const passed = checks.filter((item) => item.pass).length;
  const lines = [
    '# Paquete de preparacion de piloto', '',
    `Generado: ${safe(packet.generatedAt)}`, '',
    `Organizacion: ${safe(packet.organizationId)}`,
    `Tipo de paquete: ${safe(packet.packageMetadata?.packageType, 'pilot-readiness')}`,
    `Evidencia externa requerida: ${packet.packageMetadata?.externalEvidenceRequired ? 'SI' : 'NO'}`, '',
    `Integridad: ${safe(packet.integrity?.algorithm, 'sin huella')} / ${safe(packet.integrity?.digest, 'sin digest')}`, '',
    '## Estado', '',
    `- **Estado:** ${safe(readiness.status)}`,
    `- **Readiness tecnico:** ${readiness.technicalReady ? 'PASS' : 'PENDIENTE'}`,
    `- **Readiness de cliente:** ${readiness.customerReady ? 'PASS' : 'PENDIENTE'}`,
    `- **Gates locales:** ${passed}/${checks.length}`,
    `- **Siguiente gate:** ${safe(readiness.nextGate)}`, '',
    '## Metricas locales', '',
    `- Casos observados: ${safe(metrics.casesObserved, '0')}`,
    `- Casos cerrados: ${safe(metrics.casesClosed, '0')}`,
    `- Acciones documentadas: ${safe(metrics.actionsDocumented, '0')}`,
    `- Outcomes registrados: ${safe(metrics.outcomesRecorded, '0')}`,
    `- Cobertura de fuentes: ${metrics.sourceCoverage === null || metrics.sourceCoverage === undefined ? 'sin evidencia' : `${Math.round(metrics.sourceCoverage * 100)}%`}`, '',
    `- Fuentes productivas: ${safe(metrics.productiveSourceCount, '0')}`,
    `- Fuentes ilustrativas excluidas: ${safe(metrics.illustrativeSourceCount, '0')}`, '',
    '## Gates', '',
    checks.length ? checks.map((item) => `- ${item.pass ? 'PASS' : 'PENDIENTE'} - ${safe(item.label)}: ${safe(item.evidence)}`).join('\n') : '- Sin gates calculados.', '',
    '## Entrevistas y feedback', '',
    `- Registros de feedback: ${feedback.length}`,
    feedback.length ? feedback.map((item) => `- ${safe(item.stage)} · ${safe(item.role)} · tipo=${safe(item.evidenceType, 'general')}: ${safe(item.summary)} | evidencia: ${safe(item.evidence, 'sin evidencia')}`).join('\n') : '- No hay feedback registrado.', '',
    '## Plan de medicion y go/no-go', '',
    `- Gate: ${safe(measurementPlan.gate?.status, 'not_ready')}`,
    `- **Metricas requeridas aprobadas:** ${safe(measurementPlan.gate?.passed, '0')}/${safe(measurementPlan.gate?.totalRequired, '0')}`,
    measurementMetrics.length ? measurementMetrics.map((item) => `- ${safe(item.label, item.id)}: baseline=${safe(item.baseline, 'sin baseline')} · objetivo=${safe(item.target, 'sin objetivo')} · actual=${safe(item.actual, 'sin resultado')} · estado=${safe(item.status, 'sin evaluar')} · evidencia=${safe(item.evidenceRef, 'faltante')}`).join('\n') : '- Sin plan de medicion registrado.', '',
    '## Contexto de decisión', '',
    `- Perfil regional: ${safe(decisionContext.modelProfile?.region?.label, 'Global')} · vertical: ${safe(decisionContext.modelProfile?.vertical?.label, 'No clasificada')}`,
    `- Perfil de modelo: ${safe(decisionContext.modelProfile?.model?.decision, 'abstain_for_production')}`,
    `- Caso económico: ${safe(decisionContext.valueCase?.status, 'not_ready')} · willingness-to-pay validado: ${decisionContext.valueCase?.gates?.willingnessToPayValidated ? 'SI' : 'NO'}`, '',
    '## Scorecard', '',
    `- Alertas: ${safe(scorecard.alerts?.total, '0')}`,
    `- Casos: ${safe(scorecard.cases?.total, '0')}`,
    `- Planes de accion: ${safe(scorecard.actions?.total, '0')}`,
    `- Fuentes: ${safe(scorecard.sources?.total, '0')}`, '',
    '## Proximas acciones', '',
    ...(Array.isArray(packet.nextActions) && packet.nextActions.length ? packet.nextActions.map((item) => `- ${safe(item)}`) : ['- Sin acciones registradas.']), '',
    '## Limitaciones', '',
    safe(packet.disclaimer, 'Artefacto local de preparacion; requiere evidencia externa antes de una decision comercial.'), '',
  ];
  return lines.join('\n');
}
