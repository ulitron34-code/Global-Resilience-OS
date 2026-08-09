function value(input, fallback = '—') {
  return input === undefined || input === null || input === '' ? fallback : String(input);
}

export function decisionPackageToMarkdown(result = {}) {
  const item = result.package || result;
  const caseItem = item.case || {};
  const alert = item.alert || {};
  const scenarios = Array.isArray(item.scenarios) ? item.scenarios : [];
  const sources = Array.isArray(item.sources) ? item.sources : [];
  const evidence = item.evidenceChain || {};
  return [
    `# Paquete de decisión — ${value(caseItem.id)}`,
    '',
    `Generado: ${value(result.share?.accessedAt, new Date().toISOString())}`,
    '',
    '## Caso', '',
    `- **Título:** ${value(caseItem.title)}`,
    `- **Estado:** ${value(caseItem.status)}`,
    `- **Prioridad:** ${value(caseItem.priority)}`,
    `- **Responsable:** ${value(caseItem.owner)}`,
    `- **Impacto estimado:** ${value(caseItem.impactUsd)}`,
    `- **Alerta asociada:** ${value(alert.title, 'Sin alerta')}`,
    `- **Ubicación:** ${value(alert.location, 'No especificada')}`,
    '', '## Escenarios', '',
    scenarios.length ? scenarios.map((scenario) => `- **${value(scenario.name)}** — espera: ${value(scenario.lossIfWaitUsd)}, protegido: ${value(scenario.protectedValueUsd)}, evidencia: ${value(scenario.evidenceClass, 'assumed')}`).join('\n') : '- No hay escenarios registrados.',
    '', '## Cadena de evidencia', '',
    `- Fuentes observadas: ${Array.isArray(evidence.observedSourceIds) ? evidence.observedSourceIds.length : 0}`,
    `- Modelos inferidos: ${Array.isArray(evidence.inferredModelIds) ? evidence.inferredModelIds.length : 0}`,
    `- Supuestos de escenario: ${Number(evidence.assumedScenarioCount || 0)}`,
    `- Planes de acción: ${Number(evidence.actionPlanCount || 0)}`,
    sources.length ? sources.map((source) => `- Fuente: ${value(source.name, source.id)}`).join('\n') : '- No hay fuentes detalladas.',
    '', '## Limitaciones', '',
    value(result.disclaimer, 'Vista compartida de solo lectura. Requiere validación antes de uso productivo.'),
    value(item.disclaimer, ''), '',
  ].join('\n');
}
