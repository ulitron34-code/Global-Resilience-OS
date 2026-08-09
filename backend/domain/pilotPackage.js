function safe(value, fallback = '—') {
  return value === undefined || value === null || value === '' ? fallback : String(value);
}

export function pilotPackageToMarkdown(packet = {}) {
  const readiness = packet.readiness || {};
  const metrics = packet.metrics?.metrics || {};
  const scorecard = packet.scorecard || {};
  const checks = Array.isArray(readiness.checks) ? readiness.checks : [];
  const feedback = Array.isArray(packet.feedback) ? packet.feedback : [];
  const passed = checks.filter((item) => item.pass).length;
  const lines = [
    '# Paquete de preparación de piloto', '',
    `Generado: ${safe(packet.generatedAt)}`, '',
    '## Estado', '',
    `- **Estado:** ${safe(readiness.status)}`,
    `- **Readiness técnico:** ${readiness.technicalReady ? 'PASS' : 'PENDIENTE'}`,
    `- **Readiness de cliente:** ${readiness.customerReady ? 'PASS' : 'PENDIENTE'}`,
    `- **Gates locales:** ${passed}/${checks.length}`,
    `- **Siguiente gate:** ${safe(readiness.nextGate)}`, '',
    '## Métricas locales', '',
    `- Casos observados: ${safe(metrics.casesObserved, '0')}`,
    `- Casos cerrados: ${safe(metrics.casesClosed, '0')}`,
    `- Acciones documentadas: ${safe(metrics.actionsDocumented, '0')}`,
    `- Outcomes registrados: ${safe(metrics.outcomesRecorded, '0')}`,
    `- Cobertura de fuentes: ${metrics.sourceCoverage === null || metrics.sourceCoverage === undefined ? 'sin evidencia' : `${Math.round(metrics.sourceCoverage * 100)}%`}`, '',
    '## Gates', '',
    checks.length ? checks.map((item) => `- ${item.pass ? 'PASS' : 'PENDIENTE'} — ${safe(item.label)}: ${safe(item.evidence)}`).join('\n') : '- Sin gates calculados.', '',
    '## Entrevistas y feedback', '',
    `- Registros de feedback: ${feedback.length}`,
    feedback.length ? feedback.map((item) => `- ${safe(item.stage)} · ${safe(item.role)}: ${safe(item.summary)}`).join('\n') : '- No hay feedback registrado.', '',
    '## Scorecard', '',
    `- Alertas: ${safe(scorecard.alerts?.total, '0')}`,
    `- Casos: ${safe(scorecard.cases?.total, '0')}`,
    `- Planes de acción: ${safe(scorecard.actions?.total, '0')}`,
    `- Fuentes: ${safe(scorecard.sources?.total, '0')}`, '',
    '## Próximas acciones', '',
    ...(Array.isArray(packet.nextActions) && packet.nextActions.length ? packet.nextActions.map((item) => `- ${safe(item)}`) : ['- Sin acciones registradas.']), '',
    '## Limitaciones', '',
    safe(packet.disclaimer, 'Artefacto local de preparación; requiere evidencia externa antes de una decisión comercial.'), '',
  ];
  return lines.join('\n');
}
