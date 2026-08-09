import { filterEligibleCalibrationFixtures } from './calibrationEligibility.js';
import { isProductiveConnectedSource } from './sourceClassification.js';

function ratio(part, whole) { return whole ? Number((part / whole).toFixed(4)) : null; }
function average(values) { const valid = values.filter((value) => Number.isFinite(value)); return valid.length ? Number((valid.reduce((sum, value) => sum + value, 0) / valid.length).toFixed(2)) : null; }

export function buildOperationalScorecard({ alerts = [], cases = [], actionPlans = [], sources = [], deadLetters = [], incidents = [], calibrationFixtures = [], referenceTime = Date.now() } = {}) {
  const materialAlerts = alerts.filter((item) => ['critical', 'high'].includes(item.severity));
  const sourcedAlerts = alerts.filter((item) => Array.isArray(item.sourceIds) && item.sourceIds.length && item.payload?.provenance);
  const closedCases = cases.filter((item) => item.status === 'closed');
  const documentedActions = actionPlans.filter((item) => item.status === 'completed' && item.outcome);
  const outcomeErrors = documentedActions.map((item) => Math.abs(Number(item.forecast?.lossIfWaitUsd || 0) - Number(item.outcome.actualLossUsd || 0))).filter(Number.isFinite);
  const freshSources = sources.filter((item) => isProductiveConnectedSource(item));
  const overdueCases = cases.filter((item) => item.status !== 'closed' && Number.isFinite(Date.parse(item.createdAt)) && Number.isFinite(Number(item.slaMinutes)) && Date.parse(item.createdAt) + Number(item.slaMinutes) * 60000 < referenceTime);
  const eligibleCalibrationFixtures = filterEligibleCalibrationFixtures(calibrationFixtures).filter((item) => Number.isFinite(Number(item.predictedImpactUsd)) && Number.isFinite(Number(item.observedImpactUsd)));
  const modelErrors = eligibleCalibrationFixtures.map((item) => Math.abs(Number(item.predictedImpactUsd) - Number(item.observedImpactUsd))).filter(Number.isFinite);
  const incidentsOpen = incidents.filter((item) => !['closed', 'resolved'].includes(item.status));

  const decisionTimes = actionPlans.map((item) => {
    const start = Date.parse(item.createdAt || '');
    const end = Date.parse(item.decisionAt || '');
    return Number.isFinite(start) && Number.isFinite(end) && end >= start ? (end - start) / 60000 : null;
  }).filter((value) => value !== null);
  const averageDecisionTime = decisionTimes.length ? Number((decisionTimes.reduce((sum, value) => sum + value, 0) / decisionTimes.length).toFixed(2)) : null;

  return {
    schemaVersion: '1.0.0-local',
    generatedAt: new Date(referenceTime).toISOString(),
    scope: 'local-platform',
    product: {
      alerts: { total: alerts.length, material: materialAlerts.length, withSourceAndProvenance: sourcedAlerts.length, provenanceCoverage: ratio(sourcedAlerts.length, alerts.length) },
      cases: { total: cases.length, closed: closedCases.length, closureRate: ratio(closedCases.length, cases.length), overdue: overdueCases.length },
      actions: { completed: documentedActions.length, documentedRate: ratio(documentedActions.length, actionPlans.length), outcomesWithEvidence: documentedActions.filter((item) => item.outcome.evidenceRef).length },
      sources: { total: sources.length, freshOrHealthy: freshSources.length, readinessRate: ratio(freshSources.length, sources.length), pendingExternal: sources.filter((item) => item.status === 'pending_external').length },
      deadLetters: { total: deadLetters.length, unresolved: deadLetters.filter((item) => item.status !== 'resolved').length },
      incidents: { total: incidents.length, open: incidentsOpen.length },
    },
    models: {
      calibrationFixtures: calibrationFixtures.length,
      eligibleCalibrationFixtures: eligibleCalibrationFixtures.length,
      excludedIllustrativeCalibrationFixtures: calibrationFixtures.filter((item) => item?.evidenceStatus === 'complete' && String(item?.sourceId || '').toLowerCase().includes('demo')).length,
      meanAbsoluteErrorUsd: average(modelErrors),
      abstentionReady: eligibleCalibrationFixtures.length >= 3,
      disclaimer: 'Las métricas locales no prueban precisión de mercado; requieren eventos históricos licenciados y revisión experta.',
    },
    business: {
      avoidedLossDocumentedUsd: documentedActions.reduce((sum, item) => sum + Math.max(0, Number(item.forecast?.lossIfWaitUsd || 0) - Number(item.outcome?.actualLossUsd || 0)), 0),
      meanForecastErrorUsd: average(outcomeErrors),
      evidenceRequired: ['cliente piloto', 'baseline externo', 'tiempo de decisión', 'costo evitado validado', 'willingness-to-pay'],
    },
    timing: { timeToDetectionMinutes: null, timeToExplanationMinutes: null, timeToDecisionMinutes: averageDecisionTime, decisionsObserved: decisionTimes.length, note: averageDecisionTime === null ? 'Se habilita al aprobar planes con timestamps comparables.' : 'Tiempo medio local desde creación del plan hasta aprobación humana; detección y explicación requieren timestamps de fuente y revisión.' },
    disclaimer: 'Scorecard operativo local; no constituye evidencia comercial, regulatoria ni de precisión predictiva.',
  };
}
