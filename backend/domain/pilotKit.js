import { getCalibrationEligibility } from './calibrationEligibility.js';
import { isIllustrativeSource } from './sourceClassification.js';

const INTERVIEW_SECTIONS = [
  { id: 'critical_decision', title: 'Decision critica', questions: ['Que evento externo cambia una decision importante en menos de 72 horas?', 'Quien recibe hoy esa senal y quien decide?'], evidence: 'Ejemplo documentado de una decision reciente.' },
  { id: 'current_workflow', title: 'Flujo actual', questions: ['Que sistemas, hojas o personas se consultan?', 'Donde se pierde tiempo o confianza?'], evidence: 'Mapa del flujo actual y tiempos aproximados.' },
  { id: 'economic_value', title: 'Valor economico', questions: ['Que costo tiene esperar o actuar tarde?', 'Que metrica justificaria pagar por una primera version?'], evidence: 'Rango de costo evitado o tiempo recuperable.' },
  { id: 'data_access', title: 'Datos y restricciones', questions: ['Que fuentes internas y licenciadas existen?', 'Que restricciones legales, contractuales o de seguridad aplican?'], evidence: 'Lista de fuentes autorizables y responsable de acceso.' },
  { id: 'adoption_gate', title: 'Adopcion y compra', questions: ['Que rol usaria el sistema diariamente?', 'Que tendria que demostrar un piloto para continuar pagado?'], evidence: 'Criterios de exito, comprador y sponsor.' },
];
const EVIDENCE_TYPES = ['general', 'economic_value', 'success_criteria', 'data_access', 'adoption'];

export function buildPilotReadiness({ runtime, catalog, sourceHealth, modelGovernance, actionLibrary, tenancy, pilotFeedback = [], historicalFixtures = [] }) {
  const feedback = Array.isArray(pilotFeedback) ? pilotFeedback : [];
  const interviewCount = feedback.filter((item) => item.stage === 'interview').length;
  const customerReviewCount = feedback.filter((item) => ['pilot_review', 'gate_review'].includes(item.stage) && item.evidence).length;
  const economicEvidenceCount = feedback.filter((item) => ['pilot_review', 'gate_review'].includes(item.stage) && item.evidenceType === 'economic_value' && item.evidence).length;
  const successCriteriaCount = feedback.filter((item) => ['pilot_review', 'gate_review'].includes(item.stage) && item.evidenceType === 'success_criteria' && item.evidence).length;
  const verifiedHistoricalCount = (Array.isArray(historicalFixtures) ? historicalFixtures : []).filter((item) => getCalibrationEligibility(item).eligible).length;
  const observedSources = Array.isArray(sourceHealth?.sources) ? sourceHealth.sources : [];
  const productiveSourceCount = observedSources.filter((item) => !isIllustrativeSource(item)).length;
  const checks = [
    { id: 'runtime', label: 'Runtime local reproducible', pass: Boolean(runtime?.ready), evidence: runtime?.ready ? 'runtime readiness pass' : 'configuracion local incompleta' },
    { id: 'data_quality', label: 'Datos no materiales sin gate', pass: Boolean(catalog?.ready), evidence: catalog?.ready ? 'catalogo listo' : 'licencia/cobertura/frescura requieren revision' },
    { id: 'source_health', label: 'Fuentes productivas observables', pass: productiveSourceCount > 0, evidence: `${productiveSourceCount}/${observedSources.length} fuentes no ilustrativas observadas` },
    { id: 'model_abstention', label: 'Modelo con abstencion', pass: Array.isArray(modelGovernance) && modelGovernance.every((item) => item?.decision), evidence: Array.isArray(modelGovernance) ? `${modelGovernance.length} decisiones de gobernanza` : 'gobernanza no disponible' },
    { id: 'action_library', label: 'Acciones con readiness', pass: Boolean(actionLibrary?.ready), evidence: actionLibrary?.ready ? 'biblioteca local lista' : 'biblioteca requiere revision' },
    { id: 'tenant_context', label: 'Contexto de organizacion', pass: Boolean(tenancy?.organizationId), evidence: tenancy?.organizationId || 'sin organizacion activa' },
    { id: 'interview_threshold', label: 'Entrevistas estructuradas', pass: interviewCount >= 5, evidence: `${interviewCount}/5 entrevistas estructuradas registradas` },
    { id: 'customer_evidence', label: 'Evidencia de cliente', pass: customerReviewCount > 0, evidence: customerReviewCount ? `${customerReviewCount} revisiones de cliente con evidencia` : `requiere revision piloto documentada; entrevistas registradas: ${interviewCount}` },
    { id: 'economic_value', label: 'Valor economico documentado', pass: economicEvidenceCount > 0, evidence: economicEvidenceCount ? `${economicEvidenceCount} evidencias de valor economico` : 'requiere costo evitado, tiempo recuperable o criterio de pago documentado' },
    { id: 'success_criteria', label: 'Criterio de exito medible', pass: successCriteriaCount > 0, evidence: successCriteriaCount ? `${successCriteriaCount} criterios de exito documentados` : 'requiere baseline y umbral de go/no-go documentados' },
    { id: 'historical_validation', label: 'Validacion historica', pass: verifiedHistoricalCount >= 3, evidence: `${verifiedHistoricalCount}/3 eventos historicos autorizados con procedencia` },
  ];
  const technicalReady = checks.slice(0, 6).every((check) => check.pass);
  const customerReady = technicalReady && checks.slice(6).every((check) => check.pass);
  return { scope: 'local-pilot-preparation', status: customerReady ? 'customer_ready_for_gate_review' : technicalReady ? 'ready_for_customer_validation' : 'not_ready', technicalReady, customerReady, evidenceCounts: { interviews: interviewCount, customerReviews: customerReviewCount, economicEvidence: economicEvidenceCount, successCriteria: successCriteriaCount, verifiedHistoricalEvents: verifiedHistoricalCount }, checks, nextGate: customerReady ? 'aprobar go/no-go del piloto y documentar baseline' : 'entrevistas estructuradas + valor economico + criterio de exito + datos autorizados', disclaimer: 'Este readiness prepara un piloto; no prueba valor comercial, precision de mercado ni cumplimiento legal.' };
}

export function buildPilotNextActions(readiness = {}) {
  const actionByCheck = {
    runtime: 'Completar el contrato de runtime local y repetir la verificacion reproducible.',
    data_quality: 'Completar licencia, cobertura y SLA de frescura del catalogo de datos.',
    source_health: 'Registrar al menos una fuente productiva autorizada y observar su health en staging.',
    model_abstention: 'Revisar gobernanza del modelo y conservar abstencion ante evidencia insuficiente.',
    action_library: 'Completar el catalogo de acciones, prerrequisitos y evidencia de ejecucion.',
    tenant_context: 'Configurar la organizacion del piloto antes de registrar evidencia operativa.',
    interview_threshold: 'Registrar al menos cinco entrevistas estructuradas con roles, problemas y evidencia.',
    customer_evidence: 'Registrar una revision piloto con evidencia textual del cliente.',
    economic_value: 'Documentar costo evitado, tiempo recuperable o criterio de pago del caso de uso.',
    success_criteria: 'Registrar baseline, metrica y umbral de go/no-go del piloto.',
    historical_validation: 'Cargar al menos tres eventos historicos licenciados, completos y con procedencia.',
  };
  const pending = (Array.isArray(readiness.checks) ? readiness.checks : [])
    .filter((check) => !check.pass)
    .map((check) => actionByCheck[check.id] || `Resolver el gate local: ${check.label || check.id}.`);
  if (pending.length) return pending;
  return ['Aprobar el go/no-go del piloto con el sponsor.', 'Documentar baseline, criterio de exito y responsable de medicion.', 'Preparar la repeticion del gate en staging con datos reales.'];
}

export function getPilotInterviewGuide() {
  return { version: '1.0.0', objective: 'validar un wedge pagable antes de activar datos materiales', instructions: ['Registrar respuestas textuales y evidencia.', 'Separar hechos, hipotesis y solicitudes.', 'No prometer prediccion ni cumplimiento automatico.', 'Cerrar cada entrevista con un criterio de exito medible.'], evidenceTypes: EVIDENCE_TYPES, sections: INTERVIEW_SECTIONS };
}

export function normalizePilotFeedback(input = {}) {
  const stage = String(input.stage || '').trim();
  const role = String(input.role || '').trim();
  const summary = String(input.summary || '').trim();
  const evidence = String(input.evidence || '').trim();
  const evidenceType = String(input.evidenceType || 'general').trim();
  const score = input.urgencyScore === undefined || input.urgencyScore === null ? null : Number(input.urgencyScore);
  if (!['interview', 'pilot_review', 'gate_review'].includes(stage)) throw new Error('stage de feedback invalido');
  if (role.length < 2 || role.length > 120) throw new Error('role de feedback invalido');
  if (summary.length < 5 || summary.length > 2000) throw new Error('summary de feedback invalido');
  if (evidence.length > 2000) throw new Error('evidence de feedback demasiado largo');
  if (!EVIDENCE_TYPES.includes(evidenceType)) throw new Error('evidenceType de feedback invalido');
  if (score !== null && (!Number.isInteger(score) || score < 1 || score > 5)) throw new Error('urgencyScore debe estar entre 1 y 5');
  return { stage, role, summary, evidence: evidence || null, evidenceType, urgencyScore: score };
}

export function buildPilotMetrics({ cases = [], actionPlans = [], sourceHealth, notifications = [] }) {
  const closedCases = cases.filter((item) => item.status === 'closed').length;
  const documentedActions = actionPlans.filter((item) => ['in_execution', 'completed'].includes(item.status)).length;
  const withOutcome = actionPlans.filter((item) => item.outcome).length;
  const sourceCount = sourceHealth?.sources?.length || 0;
  const healthySources = sourceHealth?.sources?.filter((item) => item.health === 'healthy' && !isIllustrativeSource(item)).length || 0;
  const illustrativeSources = sourceHealth?.sources?.filter((item) => isIllustrativeSource(item)).length || 0;
  const productiveSourceCount = sourceCount - illustrativeSources;
  return {
    scope: 'local-pilot',
    generatedAt: new Date().toISOString(),
    metrics: { casesObserved: cases.length, casesClosed: closedCases, actionsDocumented: documentedActions, outcomesRecorded: withOutcome, sourceCoverage: productiveSourceCount ? healthySources / productiveSourceCount : null, productiveSourceCount, illustrativeSourceCount: illustrativeSources, notificationsObserved: notifications.length },
    definitions: { timeToDecision: 'requiere timestamps de senal y decision', avoidedLoss: 'requiere outcome con evidencia; no se infiere del demo', hoursRecovered: 'requiere captura de tiempo del usuario', sourceCoverage: 'proporcion de fuentes productivas con health healthy; fuentes ilustrativas se excluyen del numerador y denominador' },
    missingEvidence: ['cliente piloto', 'baseline externo', 'timestamps de decision', 'costo evitado validado', 'fuentes productivas licenciadas'],
  };
}
