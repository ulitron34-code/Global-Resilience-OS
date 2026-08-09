import { readFileSync } from 'node:fs';

process.env.NODE_ENV = 'test';
process.env.AUTH_REQUIRED = 'false';

const { startServer } = await import('../backend/server.js');
const server = startServer(0);

function check(condition, message) {
  if (!condition) throw new Error(`Smoke test failed: ${message}`);
}

async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { ...(options.body ? { 'content-type': 'application/json' } : {}), ...(options.headers || {}) },
  });
  let body = null;
  const text = await response.text();
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { response, body };
}

try {
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const { response: health, body: healthBody } = await request(baseUrl, '/api/health');
  check(health.status === 200 && healthBody.status === 'ok', 'healthcheck');
  check(Boolean(health.headers.get('x-request-id')), 'request id');
  const { response: alerts, body: alertItems } = await request(baseUrl, '/api/alerts');
  check(alerts.status === 200 && Array.isArray(alertItems) && alertItems.every((item) => item.evidenceClass === 'observed' && item.evidence?.evidenceClass === 'observed'), 'alert evidence classification');

  const { response: login, body: session } = await request(baseUrl, '/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'analyst@resilience.local', password: 'demo123' }) });
  check(login.status === 200 && session.token, 'login');
  const authHeaders = { authorization: `Bearer ${session.token}` };
  const { response: me } = await request(baseUrl, '/api/auth/me', { headers: authHeaders });
  check(me.status === 200, 'auth me');

  const { response: simulation, body: simulationBody } = await request(baseUrl, '/api/simulate-rupture', { method: 'POST', body: JSON.stringify({ cableId: 'seamewe3', severity: 'parcial', durationHours: 12 }) });
  check(simulation.status === 200 && simulationBody.totalUsdLoss > 0 && simulationBody.evidence?.evidenceClass === 'assumed', 'simulation evidence classification');

  const { response: graph, body: graphBody } = await request(baseUrl, '/api/graph?cableId=seamewe3&verticalId=petroleo');
  check(graph.status === 200 && graphBody.counts.nodes > 0 && graphBody.edges.length > 0 && graphBody.edges.every((edge) => edge.evidenceClass === 'assumed'), 'impact graph evidence classification');
  const { response: historicalGraph, body: historicalGraphBody } = await request(baseUrl, '/api/graph?cableId=seamewe3&asOf=2025-12-31T00:00:00Z');
  check(historicalGraph.status === 200 && historicalGraphBody.edges.length === 0 && historicalGraphBody.temporalFilter.edgeValidityApplied, 'temporal impact graph filter');
  const { response: actionPlan, body: actionPlanBody } = await request(baseUrl, '/api/action-plans/preview', { method: 'POST', headers: authHeaders, body: JSON.stringify({ playbookId: 'cable-degradation', lossIfWaitUsd: 1000000, mitigationCostUsd: 100000, protectedValueUsd: 700000, confidence: 0.8 }) });
  check(actionPlan.status === 200 && actionPlanBody.status === 'draft_for_human_approval' && actionPlanBody.materialRecommendationAllowed === false && actionPlanBody.dataQualityGate?.decision === 'abstain_material_recommendations', 'action plan preview data gate');
  const { response: actionMetrics, body: actionMetricsBody } = await request(baseUrl, '/api/action-plans/metrics', { headers: authHeaders });
  check(actionMetrics.status === 200 && Object.hasOwn(actionMetricsBody, 'meanAbsoluteForecastErrorPct'), 'action outcome metrics');
  const { response: tenancy, body: tenancyBody } = await request(baseUrl, '/api/tenancy/context', { headers: authHeaders });
  check(tenancy.status === 200 && tenancyBody.organizationId === 'nashadi-demo' && tenancyBody.isolation === 'local-action-plans', 'tenant context');
  const { response: entity } = await request(baseUrl, '/api/entities/resolve', { method: 'POST', body: JSON.stringify({ type: 'cable', query: 'SMW3' }) });
  check(entity.status === 200, 'entity resolution');
  const { response: contract } = await request(baseUrl, '/api/ingest/validate', { method: 'POST', body: JSON.stringify({ externalId: 'smoke-contract', sourceId: 'ais-demo', eventType: 'ais_gap', title: 'Contract smoke signal', severity: 'low', impactUsd: 10, confidence: 0.5, observedAt: new Date().toISOString(), provenance: { licenseRef: 'smoke-demo' } }) });
  check(contract.status === 200, 'event contract validation');
  const { response: connectors, body: connectorItems } = await request(baseUrl, '/api/connectors');
  check(connectors.status === 200 && connectorItems.every((item) => item.mode === 'dry_run_only'), 'connector registry');
  const { response: connectorValidation, body: connectorValidationBody } = await request(baseUrl, '/api/connectors/ais/validate', { method: 'POST', body: JSON.stringify({ sourceId: 'ais-demo', eventType: 'ais_gap', externalId: 'connector-smoke', observedAt: new Date().toISOString(), location: 'Ormuz', confidence: 0.8, provenance: { licenseRef: 'smoke-demo' } }) });
  check(connectorValidation.status === 200 && connectorValidationBody.valid && connectorValidationBody.decision === 'ready_for_envelope_validation', 'connector contract validation');
  const { response: frameworks, body: frameworkItems } = await request(baseUrl, '/api/regulatory/frameworks');
  check(frameworks.status === 200 && frameworkItems.some((item) => item.id === 'nist-csf-2-gv-sc'), 'regulatory framework registry');
  const { response: evidenceMap, body: evidenceMapBody } = await request(baseUrl, '/api/regulatory/evidence-map', { method: 'POST', headers: authHeaders, body: JSON.stringify({ frameworkId: 'itu-submarine-cable-resilience', scope: 'smoke', evidence: [{ controlId: 'ITU-CABLE-RISK', evidenceRef: 'GRAPH-SMOKE', verified: true }] }) });
  check(evidenceMap.status === 200 && evidenceMapBody.counts.verified === 1 && evidenceMapBody.counts.missing > 0, 'regulatory evidence map');
  const { response: recovery, body: recoveryBody } = await request(baseUrl, '/api/recovery/profile', { method: 'POST', headers: authHeaders, body: JSON.stringify({ cableId: 'seamewe3', severity: 'total', horizons: [24, 168, 720] }) });
  check(recovery.status === 200 && recoveryBody.baseline.length === 3 && recoveryBody.options.length >= 3, 'recovery counterfactual profile');
  const { response: library, body: libraryBody } = await request(baseUrl, '/api/actions/library');
  check(library.status === 200 && libraryBody.length >= 5, 'action library');
  const { response: recommendations, body: recommendationsBody } = await request(baseUrl, '/api/actions/recommendations', { method: 'POST', headers: authHeaders, body: JSON.stringify({ budgetUsd: 500000, horizonHours: 72 }) });
  check(recommendations.status === 200 && recommendationsBody.candidates.length >= 1, 'action recommendations');
  const { response: notificationPolicy, body: notificationPolicyBody } = await request(baseUrl, '/api/notifications/policy/preview', { method: 'POST', headers: authHeaders, body: JSON.stringify({ severity: 'high', channels: ['in_app', 'email'] }) });
  check(notificationPolicy.status === 200 && notificationPolicyBody.recipients.length >= 1 && notificationPolicyBody.delivery.mode === 'dry_run', 'notification policy preview');
  const { response: qualityGate, body: qualityGateBody } = await request(baseUrl, '/api/data-quality/gate');
  check(qualityGate.status === 200 && qualityGateBody.decision === 'abstain_material_recommendations' && qualityGateBody.counts.abstain > 0 && qualityGateBody.checks.every((item) => item.sourcePresent === true), 'material data quality gate');
  const { response: invalidRecord, body: invalidRecordBody } = await request(baseUrl, '/api/data-quality/validate', { method: 'POST', body: JSON.stringify({ sourceId: 'ais-demo', observedAt: new Date().toISOString(), confidence: 0.8, provenance: {} }) });
  check(invalidRecord.status === 200 && invalidRecordBody.decision === 'abstain', 'data record abstention');
  const { response: contracts, body: contractItems } = await request(baseUrl, '/api/contracts');
  check(contracts.status === 200 && contractItems.some((item) => item.id === 'event-envelope' && item.version === '1.0.0'), 'schema registry');
  const { response: modelGovernance, body: modelGovernanceBody } = await request(baseUrl, '/api/models/governance');
  check(modelGovernance.status === 200 && modelGovernanceBody.length >= 2 && modelGovernanceBody.every((item) => item.decision === 'abstain_for_production'), 'model governance abstention');
  const { response: backtest, body: backtestBody } = await request(baseUrl, '/api/models/backtest', { headers: authHeaders });
  check(backtest.status === 200 && backtestBody.decision === 'abstain_for_production' && backtestBody.baseline.method === 'median_observed_impact', 'backtest baseline abstention');
  const { response: sensitivity, body: sensitivityBody } = await request(baseUrl, '/api/models/sensitivity', { method: 'POST', headers: authHeaders, body: JSON.stringify({ cableId: 'seamewe3', durations: [6, 24, 72] }) });
  check(sensitivity.status === 200 && sensitivityBody.checks.durationMonotonic && sensitivityBody.scenarios.length === 6, 'sensitivity monotonicity');
  const { response: uncertainty, body: uncertaintyBody } = await request(baseUrl, '/api/models/uncertainty', { method: 'POST', headers: authHeaders, body: JSON.stringify({ pointEstimateUsd: 1000000, confidence: 0.45, fixtureCount: 0 }) });
  check(uncertainty.status === 200 && uncertaintyBody.decision === 'abstain_material_interval' && uncertaintyBody.interval === null, 'uncertainty abstention');
  const { response: scorecard, body: scorecardBody } = await request(baseUrl, '/api/metrics/scorecard', { headers: authHeaders });
  check(scorecard.status === 200 && scorecardBody.product && Object.hasOwn(scorecardBody, 'business') && scorecardBody.timing.timeToDecisionMinutes === null, 'operational scorecard evidence boundary');
  const { response: pilotPackage, body: pilotPackageBody } = await request(baseUrl, '/api/pilots/package', { headers: authHeaders });
  check(pilotPackage.status === 200 && pilotPackageBody.readiness && pilotPackageBody.interviewGuide && Array.isArray(pilotPackageBody.nextActions), 'pilot package consolidation');
  const { response: sectorBenchmark, body: sectorBenchmarkBody } = await request(baseUrl, '/api/benchmarks/sectors', { headers: authHeaders });
  check(sectorBenchmark.status === 200 && sectorBenchmarkBody.kAnonymity.applied && sectorBenchmarkBody.totals.publishedSectors === 0, 'anonymous sector benchmark abstention');
  const { response: cooperativePreview, body: cooperativePreviewBody } = await request(baseUrl, '/api/network/cooperative/preview', { method: 'POST', headers: authHeaders, body: JSON.stringify({ consent: false, minCohort: 3 }) });
  check(cooperativePreview.status === 200 && cooperativePreviewBody.mode === 'dry_run_only' && cooperativePreviewBody.status === 'consent_required' && cooperativePreviewBody.anonymization?.applied, 'cooperative network safety preview');
  const { response: assistant, body: assistantBody } = await request(baseUrl, '/api/assistant/suggestion', { method: 'POST', headers: authHeaders, body: JSON.stringify({ eventType: 'cable_degradation', severity: 'high', confidence: 0.8, impactUsd: 800000 }) });
  check(assistant.status === 200 && assistantBody.guardrails.humanApprovalRequired && assistantBody.guardrails.externalActionsAllowed === false && assistantBody.decision === 'abstain', 'assistive agent guardrails');
  const { response: pilotReadiness, body: pilotReadinessBody } = await request(baseUrl, '/api/pilots/readiness', { headers: authHeaders });
  check(pilotReadiness.status === 200 && pilotReadinessBody.customerReady === false && pilotReadinessBody.evidenceCounts && Array.isArray(pilotReadinessBody.checks), 'pilot readiness gates');
  const { response: interviewGuide, body: interviewGuideBody } = await request(baseUrl, '/api/pilots/interview-guide', { headers: authHeaders });
  check(interviewGuide.status === 200 && interviewGuideBody.sections?.length >= 5, 'pilot interview guide');
  const { response: pilotMetrics, body: pilotMetricsBody } = await request(baseUrl, '/api/pilots/metrics', { headers: authHeaders });
  check(pilotMetrics.status === 200 && pilotMetricsBody.metrics && Array.isArray(pilotMetricsBody.missingEvidence), 'pilot metrics');
  const { response: feedbackCreate, body: feedbackBody } = await request(baseUrl, '/api/pilots/feedback', { method: 'POST', headers: authHeaders, body: JSON.stringify({ stage: 'interview', role: 'risk owner', summary: 'Necesitamos explicar la cascada y asignar una acción con evidencia.', evidence: 'Smoke fixture', urgencyScore: 4 }) });
  check(feedbackCreate.status === 201 && feedbackBody.id?.startsWith('PFB-'), 'pilot feedback capture');
  const { response: feedbackList, body: feedbackItems } = await request(baseUrl, '/api/pilots/feedback', { headers: authHeaders });
  check(feedbackList.status === 200 && feedbackItems.some((item) => item.id === feedbackBody.id), 'pilot feedback retrieval');
  const { response: runbook, body: runbookBody } = await request(baseUrl, '/api/incidents/runbook', { headers: authHeaders });
  check(runbook.status === 200 && runbookBody.steps?.length >= 5 && runbookBody.severityTargets?.sev1, 'incident response runbook');
  const { response: incidentCreate, body: incidentBody } = await request(baseUrl, '/api/incidents', { method: 'POST', headers: authHeaders, body: JSON.stringify({ title: 'Smoke incident', severity: 'sev2', summary: 'Incident generated by local verification', sourceIds: ['ais-demo'] }) });
  check(incidentCreate.status === 201 && incidentBody.status === 'open', 'incident creation');
  const { response: incidentUpdate, body: incidentUpdated } = await request(baseUrl, `/api/incidents/${incidentBody.id}`, { method: 'PATCH', headers: authHeaders, body: JSON.stringify({ status: 'triaged', note: 'Owner assigned and scope confirmed.' }) });
  check(incidentUpdate.status === 200 && incidentUpdated.status === 'triaged' && incidentUpdated.timeline.length >= 2, 'incident triage audit');
  const { response: invalidIncidentClose } = await request(baseUrl, `/api/incidents/${incidentBody.id}`, { method: 'PATCH', headers: authHeaders, body: JSON.stringify({ status: 'closed' }) });
  check(invalidIncidentClose.status === 400, 'incident closure evidence gate');
  const { response: securityPosture, body: securityPostureBody } = await request(baseUrl, '/api/security/posture', { headers: authHeaders });
  check(securityPosture.status === 200 && securityPostureBody.counts?.total >= 8 && securityPostureBody.checks.some((item) => item.id === 'external_actions'), 'security posture');
  const batchEvent = { externalId: `batch-${Date.now()}`, sourceId: 'ais-demo', eventType: 'ais_gap', title: 'Batch smoke signal', severity: 'medium', impactUsd: 25000 };
  const { response: batchDryRun, body: batchDryRunBody } = await request(baseUrl, '/api/ingest/batch', { method: 'POST', headers: authHeaders, body: JSON.stringify({ mode: 'dry_run', events: [batchEvent] }) });
  check(batchDryRun.status === 200 && batchDryRunBody.readyToCommit && batchDryRunBody.counts.valid === 1, 'batch ingestion dry run');
  const { response: batchCommit, body: batchCommitBody } = await request(baseUrl, '/api/ingest/batch', { method: 'POST', headers: authHeaders, body: JSON.stringify({ mode: 'commit', events: [batchEvent, batchEvent] }) });
  check(batchCommit.status === 201 && batchCommitBody.counts.created === 1 && batchCommitBody.counts.duplicates === 1, 'batch ingestion commit deduplication');
  const { response: sourceSweep, body: sourceSweepBody } = await request(baseUrl, '/api/jobs/source-health-sweep', { method: 'POST', headers: authHeaders });
  check(sourceSweep.status === 201 && Number.isInteger(sourceSweepBody.evaluated) && Number.isInteger(sourceSweepBody.notificationsCreated), 'source health sweep');

  const { response: webhookResponse, body: webhook } = await request(baseUrl, '/api/webhooks', { method: 'POST', headers: authHeaders, body: JSON.stringify({ url: 'https://example.local/smoke', events: ['alert.created', 'case.updated'] }) });
  check(webhookResponse.status === 201, 'webhook registration');

  const event = { externalId: `smoke-${Date.now()}`, sourceId: 'ais-demo', eventType: 'ais_gap', title: 'Smoke test AIS signal', severity: 'high', impactUsd: 123000, location: 'Estrecho de Ormuz' };
  const { response: ingest, body: ingestBody } = await request(baseUrl, '/api/ingest/events', { method: 'POST', body: JSON.stringify(event) });
  check(ingest.status === 201 && ingestBody.created, 'event ingestion');
  const { response: duplicate, body: duplicateBody } = await request(baseUrl, '/api/ingest/events', { method: 'POST', body: JSON.stringify(event) });
  check(duplicate.status === 200 && duplicateBody.created === false, 'event deduplication');

  const { response: conversion, body: conversionBody } = await request(baseUrl, `/api/alerts/${ingestBody.alert.id}/convert-to-case`, { method: 'POST' });
  check([200, 201].includes(conversion.status) && conversionBody.case.id, 'alert to case');
  const caseId = conversionBody.case.id;
  const { response: comment } = await request(baseUrl, `/api/cases/${caseId}/comments`, { method: 'POST', headers: authHeaders, body: JSON.stringify({ body: 'Smoke test comment' }) });
  check(comment.status === 201, 'case comment');
  const { response: caseUpdate } = await request(baseUrl, `/api/cases/${caseId}`, { method: 'PATCH', headers: authHeaders, body: JSON.stringify({ owner: 'Smoke Desk' }) });
  check(caseUpdate.status === 200, 'case update');
  const { response: decisionPackage, body: decisionPackageBody } = await request(baseUrl, `/api/cases/${caseId}/decision-package`, { headers: authHeaders });
  check(decisionPackage.status === 200 && decisionPackageBody.recoveryProfile && decisionPackageBody.regulatoryEvidenceMap && Array.isArray(decisionPackageBody.packageCapabilities) && decisionPackageBody.evidenceChain && Number.isInteger(decisionPackageBody.evidenceChain.assumedScenarioCount), 'enriched decision package');

  const { response: deliveries, body: deliveryItems } = await request(baseUrl, `/api/webhooks/${webhook.id}/deliveries`, { headers: authHeaders });
  check(deliveries.status === 200 && deliveryItems.some((item) => item.eventType === 'case.updated'), 'webhook dispatch');
  const { response: processOutbox, body: processed } = await request(baseUrl, '/api/webhooks/deliveries/process-local', { method: 'POST', headers: authHeaders, body: JSON.stringify({ limit: 20 }) });
  check(processOutbox.status === 200 && processed.processed >= 1, 'outbox processing');

  const { response: job } = await request(baseUrl, '/api/jobs/demo-ingest', { method: 'POST', headers: authHeaders });
  check(job.status === 201, 'demo job');
  const { response: readiness, body: readinessBody } = await request(baseUrl, '/api/health/readiness');
  check(readiness.status === 200 && readinessBody.ready, 'readiness');
  const { response: runtimeReadiness, body: runtimeBody } = await request(baseUrl, '/api/runtime/readiness');
  check(runtimeReadiness.status === 200 && runtimeBody.checks.externalActionsDisabledByDefault, 'runtime readiness');
  const { response: configContract, body: configContractBody } = await request(baseUrl, '/api/runtime/config-contract');
  check(configContract.status === 200 && configContractBody.ready && configContractBody.checks.some((item) => item.id === 'external_actions' && item.pass), 'environment configuration contract');
  const { response: enterpriseReadiness, body: enterpriseReadinessBody } = await request(baseUrl, '/api/readiness/enterprise', { headers: authHeaders });
  check(enterpriseReadiness.status === 200 && enterpriseReadinessBody.localReady && enterpriseReadinessBody.externalReady === false && enterpriseReadinessBody.decision === 'proceed_to_external_gates', 'enterprise readiness handoff');
  const { response: catalog } = await request(baseUrl, '/api/data-catalog/readiness');
  check(catalog.status === 200, 'data catalog readiness');
  const { response: calibration } = await request(baseUrl, '/api/models/calibration/benchmark');
  check(calibration.status === 200, 'calibration benchmark');
  const { response: briefExport } = await request(baseUrl, '/api/briefs/latest/export?format=csv');
  check(briefExport.status === 200, 'brief export');
  const { response: operatorBrief, body: operatorBriefBody } = await request(baseUrl, '/api/briefs/latest?audience=operator', { headers: authHeaders });
  check(operatorBrief.status === 200 && operatorBriefBody.audience === 'operator' && operatorBriefBody.operatorDetail?.openCases, 'operator brief view');
  const { response: auditExport } = await request(baseUrl, `/api/audit/export?entityId=${caseId}&format=json`, { headers: authHeaders });
  check(auditExport.status === 200, 'audit export');
  const { response: resetDemo, body: resetDemoBody } = await request(baseUrl, '/api/ops/reset-demo', { method: 'POST', headers: authHeaders });
  check(resetDemo.status === 200 && resetDemoBody.mode === 'demo_local_only' && resetDemoBody.counts.alerts === 4 && resetDemoBody.counts.cases === 3, 'controlled local demo reset');
  JSON.parse(readFileSync(new URL('../docs/openapi.local.json', import.meta.url), 'utf8'));
  console.log('LOCAL SMOKE TEST: PASS');
} finally {
  await new Promise((resolve) => server.close(resolve));
}
