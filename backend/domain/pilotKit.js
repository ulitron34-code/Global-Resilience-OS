const INTERVIEW_SECTIONS = [
  { id: 'critical_decision', title: 'Decisión crítica', questions: ['¿Qué evento externo cambia una decisión importante en menos de 72 horas?', '¿Quién recibe hoy esa señal y quién decide?'], evidence: 'Ejemplo documentado de una decisión reciente.' },
  { id: 'current_workflow', title: 'Flujo actual', questions: ['¿Qué sistemas, hojas o personas se consultan?', '¿Dónde se pierde tiempo o confianza?'], evidence: 'Mapa del flujo actual y tiempos aproximados.' },
  { id: 'economic_value', title: 'Valor económico', questions: ['¿Qué costo tiene esperar o actuar tarde?', '¿Qué métrica justificaría pagar por una primera versión?'], evidence: 'Rango de costo evitado o tiempo recuperable.' },
  { id: 'data_access', title: 'Datos y restricciones', questions: ['¿Qué fuentes internas y licenciadas existen?', '¿Qué restricciones legales, contractuales o de seguridad aplican?'], evidence: 'Lista de fuentes autorizables y responsable de acceso.' },
  { id: 'adoption_gate', title: 'Adopción y compra', questions: ['¿Qué rol usaría el sistema diariamente?', '¿Qué tendría que demostrar un piloto para continuar pagado?'], evidence: 'Criterios de éxito, comprador y sponsor.' },
];

export function buildPilotReadiness({ runtime, catalog, sourceHealth, modelGovernance, actionLibrary, tenancy, pilotFeedback = [], historicalFixtures = [] }) {
  const feedback = Array.isArray(pilotFeedback) ? pilotFeedback : [];
  const interviewCount = feedback.filter((item) => item.stage === 'interview').length;
  const customerReviewCount = feedback.filter((item) => ['pilot_review', 'gate_review'].includes(item.stage) && item.evidence).length;
  const verifiedHistoricalCount = (Array.isArray(historicalFixtures) ? historicalFixtures : []).filter((item) => item.sourceId && !String(item.sourceId).endsWith('-demo') && item.provenance).length;
  const checks = [
    { id: 'runtime', label: 'Runtime local reproducible', pass: Boolean(runtime?.ready), evidence: runtime?.ready ? 'runtime readiness pass' : 'configuración local incompleta' },
    { id: 'data_quality', label: 'Datos no materiales sin gate', pass: Boolean(catalog?.ready), evidence: catalog?.ready ? 'catálogo listo' : 'licencia/cobertura/frescura requieren revisión' },
    { id: 'source_health', label: 'Fuentes observables', pass: Boolean(sourceHealth?.sources?.length), evidence: `${sourceHealth?.sources?.length || 0} fuentes observadas` },
    { id: 'model_abstention', label: 'Modelo con abstención', pass: Array.isArray(modelGovernance) && modelGovernance.every((item) => item?.decision), evidence: Array.isArray(modelGovernance) ? `${modelGovernance.length} decisiones de gobernanza` : 'gobernanza no disponible' },
    { id: 'action_library', label: 'Acciones con readiness', pass: Boolean(actionLibrary?.ready), evidence: actionLibrary?.ready ? 'biblioteca local lista' : 'biblioteca requiere revisión' },
    { id: 'tenant_context', label: 'Contexto de organización', pass: Boolean(tenancy?.organizationId), evidence: tenancy?.organizationId || 'sin organización activa' },
    { id: 'customer_evidence', label: 'Evidencia de cliente', pass: customerReviewCount > 0, evidence: customerReviewCount ? `${customerReviewCount} revisiones de cliente con evidencia` : `requiere revisión piloto documentada; entrevistas registradas: ${interviewCount}` },
    { id: 'historical_validation', label: 'Validación histórica', pass: verifiedHistoricalCount >= 3, evidence: `${verifiedHistoricalCount}/3 eventos históricos autorizados con procedencia` },
  ];
  const technicalReady = checks.slice(0, 6).every((check) => check.pass);
  const customerReady = technicalReady && checks.slice(6).every((check) => check.pass);
  return { scope: 'local-pilot-preparation', status: customerReady ? 'customer_ready_for_gate_review' : technicalReady ? 'ready_for_customer_validation' : 'not_ready', technicalReady, customerReady, evidenceCounts: { interviews: interviewCount, customerReviews: customerReviewCount, verifiedHistoricalEvents: verifiedHistoricalCount }, checks, nextGate: customerReady ? 'aprobar go/no-go del piloto y documentar baseline' : 'entrevistas estructuradas + datos autorizados + baseline histórico', disclaimer: 'Este readiness prepara un piloto; no prueba valor comercial, precisión de mercado ni cumplimiento legal.' };
}

export function getPilotInterviewGuide() {
  return { version: '1.0.0', objective: 'validar un wedge pagable antes de activar datos materiales', instructions: ['Registrar respuestas textuales y evidencia.', 'Separar hechos, hipótesis y solicitudes.', 'No prometer predicción ni cumplimiento automático.', 'Cerrar cada entrevista con un criterio de éxito medible.'], sections: INTERVIEW_SECTIONS };
}

export function normalizePilotFeedback(input = {}) {
  const stage = String(input.stage || '').trim();
  const role = String(input.role || '').trim();
  const summary = String(input.summary || '').trim();
  const evidence = String(input.evidence || '').trim();
  const score = input.urgencyScore === undefined || input.urgencyScore === null ? null : Number(input.urgencyScore);
  if (!['interview', 'pilot_review', 'gate_review'].includes(stage)) throw new Error('stage de feedback inválido');
  if (role.length < 2 || role.length > 120) throw new Error('role de feedback inválido');
  if (summary.length < 5 || summary.length > 2000) throw new Error('summary de feedback inválido');
  if (evidence.length > 2000) throw new Error('evidence de feedback demasiado largo');
  if (score !== null && (!Number.isInteger(score) || score < 1 || score > 5)) throw new Error('urgencyScore debe estar entre 1 y 5');
  return { stage, role, summary, evidence: evidence || null, urgencyScore: score };
}

export function buildPilotMetrics({ cases = [], actionPlans = [], sourceHealth, notifications = [] }) {
  const closedCases = cases.filter((item) => item.status === 'closed').length;
  const documentedActions = actionPlans.filter((item) => ['in_execution', 'completed'].includes(item.status)).length;
  const withOutcome = actionPlans.filter((item) => item.outcome).length;
  const sourceCount = sourceHealth?.sources?.length || 0;
  const healthySources = sourceHealth?.sources?.filter((item) => ['healthy', 'demo'].includes(item.health)).length || 0;
  return { scope: 'local-pilot', generatedAt: new Date().toISOString(), metrics: { casesObserved: cases.length, casesClosed: closedCases, actionsDocumented: documentedActions, outcomesRecorded: withOutcome, sourceCoverage: sourceCount ? healthySources / sourceCount : null, notificationsObserved: notifications.length }, definitions: { timeToDecision: 'requiere timestamps de señal y decisión', avoidedLoss: 'requiere outcome con evidencia; no se infiere del demo', hoursRecovered: 'requiere captura de tiempo del usuario' }, missingEvidence: ['cliente piloto', 'baseline externo', 'timestamps de decisión', 'costo evitado validado'] };
}
