function impactBand(value) {
  const amount = Number(value) || 0;
  if (amount >= 1_000_000) return '1m_plus';
  if (amount >= 100_000) return '100k_to_1m';
  return 'under_100k';
}

function dayBucket(value) {
  const parsed = Date.parse(value || '');
  return Number.isFinite(parsed) ? new Date(parsed).toISOString().slice(0, 10) : null;
}

export function buildCooperativeIncidentPreview({ alerts = [], minCohort = 3, consent = false } = {}) {
  const cohort = Math.max(3, Math.min(20, Number(minCohort) || 3));
  const signals = (Array.isArray(alerts) ? alerts : []).map((alert) => ({
    severity: alert.severity || 'unknown',
    impactBand: impactBand(alert.impactUsd),
    vertical: alert.vertical || 'unclassified',
    sourceCount: Array.isArray(alert.sourceIds) ? alert.sourceIds.length : 0,
    observedDay: dayBucket(alert.payload?.observedAt || alert.createdAt),
  }));
  const eligible = signals.length >= cohort;
  const canShare = Boolean(consent) && eligible;
  return {
    schemaVersion: '1.0.0-local',
    generatedAt: new Date().toISOString(),
    mode: 'dry_run_only',
    consentRequired: true,
    consentProvided: Boolean(consent),
    anonymization: { applied: true, removedFields: ['id', 'externalId', 'location', 'caseId', 'organizationId'], kAnonymityMinimum: cohort, cohortEligible: eligible },
    status: canShare ? 'ready_for_human_review' : !consent ? 'consent_required' : 'abstain_insufficient_cohort',
    signalCount: signals.length,
    sharedSignals: canShare ? signals : [],
    disclaimer: 'PrevisualizaciÃ³n local anonimizada. No comparte datos, no contacta otros tenants y requiere gobernanza, consentimiento y revisiÃ³n de reidentificaciÃ³n antes de cualquier red cooperativa real.'
  };
}
