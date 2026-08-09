import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { startServer, stopServer } from '../server.js';
import { createActionPlan, getActionPlan, listActionPlans } from '../domain/actionPlanStore.js';

let server;
let baseUrl;

before(() => new Promise((resolve) => {
  server = startServer(0);
  server.on('listening', () => {
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
    resolve();
  });
}));

after(async () => {
  await stopServer(server);
});

async function postSimulation(body) {
  return fetch(`${baseUrl}/api/simulate-rupture`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function patchCase(caseId, body) {
  return fetch(`${baseUrl}/api/cases/${caseId}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', 'x-actor': 'test-user' },
    body: JSON.stringify(body),
  });
}

describe('Global Resilience OS API', () => {
  it('expone healthcheck', async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    assert.equal(response.status, 200);
    const healthBody = await response.json();
    assert.equal(healthBody.status, 'ok');
    assert.equal(healthBody.version, '0.9.0');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.ok(response.headers.get('content-security-policy')?.includes("default-src 'none'"));
    assert.equal(response.headers.get('cross-origin-opener-policy'), 'same-origin');
    assert.ok(response.headers.get('x-request-id'));

    const missing = await fetch(`${baseUrl}/api/does-not-exist`);
    assert.equal(missing.status, 404);
    assert.equal((await missing.json()).error, 'Ruta no encontrada');
  });

  it('expone el Impact Graph y planes de acción con aprobación humana', async () => {
    const graph = await fetch(`${baseUrl}/api/graph?cableId=seamewe3&verticalId=petroleo`);
    assert.equal(graph.status, 200);
    const graphBody = await graph.json();
    assert.equal(graphBody.counts.cables, 1);
    assert.ok(graphBody.edges.some((edge) => edge.relation === 'exposes_directly'));

    const path = await fetch(`${baseUrl}/api/graph/paths?cableId=seamewe3&verticalId=petroleo`);
    assert.equal(path.status, 200);
    assert.equal((await path.json()).relation, 'exposes_directly');

    const playbooks = await fetch(`${baseUrl}/api/playbooks`);
    assert.equal(playbooks.status, 200);
    assert.ok((await playbooks.json()).length >= 5);

    const resolved = await fetch(`${baseUrl}/api/entities/resolve`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'cable', query: 'SMW3' }) });
    assert.equal((await resolved.json()).resolved.id, 'seamewe3');

    const plan = await fetch(`${baseUrl}/api/action-plans/preview`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ playbookId: 'reroute-critical-flow', lossIfWaitUsd: 1000000, mitigationCostUsd: 100000, protectedValueUsd: 800000, confidence: 0.8 }),
    });
    assert.equal(plan.status, 200);
    const planBody = await plan.json();
    assert.equal(planBody.status, 'draft_for_human_approval');
    assert.equal(planBody.decision, 'mitigation_favorable');
    assert.ok(planBody.evidenceRequirements.includes('human_approval'));
    assert.equal(planBody.evidence.completeness, 'incomplete_until_source_linked');
    assert.equal(planBody.evidence.model.id, 'impact-cascade');

    const abstention = await fetch(`${baseUrl}/api/action-plans/preview`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ confidence: 0.2, lossIfWaitUsd: 1000000, mitigationCostUsd: 100, protectedValueUsd: 999999 }) });
    assert.equal((await abstention.json()).decision, 'abstain_insufficient_confidence');

    const saved = await fetch(`${baseUrl}/api/action-plans`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ playbookId: 'cable-degradation', caseId: 'RS-0827', lossIfWaitUsd: 900000, mitigationCostUsd: 100000, protectedValueUsd: 700000, confidence: 0.8 }) });
    assert.equal(saved.status, 201);
    const savedBody = await saved.json();
    assert.match(savedBody.id, /^AP-/);
    assert.equal(savedBody.organizationId, 'nashadi-demo');
    const listed = await fetch(`${baseUrl}/api/action-plans?caseId=RS-0827`);
    assert.ok((await listed.json()).some((item) => item.id === savedBody.id));
    const updated = await fetch(`${baseUrl}/api/action-plans/${savedBody.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ humanApproval: 'pending_review', owner: 'Risk Desk' }) });
    assert.equal((await updated.json()).owner, 'Risk Desk');
    const invalidTransition = await fetch(`${baseUrl}/api/action-plans/${savedBody.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: 'completed', outcome: 'too early' }) });
    assert.equal(invalidTransition.status, 400);
    const approved = await fetch(`${baseUrl}/api/action-plans/${savedBody.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: 'approved', humanApproval: 'approved' }) });
    assert.equal((await approved.json()).status, 'approved');
    const executing = await fetch(`${baseUrl}/api/action-plans/${savedBody.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: 'in_execution' }) });
    assert.equal((await executing.json()).status, 'in_execution');
    const completed = await fetch(`${baseUrl}/api/action-plans/${savedBody.id}/outcome`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ actualLossUsd: 480000, actualRecoveryHours: 18, evidenceRef: 'OUTCOME-LOCAL-001', outcome: 'Ruta alterna activada y verificada' }) });
    const completedBody = await completed.json();
    assert.equal(completedBody.status, 'completed');
    assert.equal(completedBody.outcomeEvidence, 'OUTCOME-LOCAL-001');
    assert.equal(completedBody.outcomeEvidenceRecord.evidenceClass, 'observed');
    assert.deepEqual(completedBody.outcomeEvidenceRecord.sourceIds, ['OUTCOME-LOCAL-001']);
    assert.ok(completedBody.evidence.outcome);
    assert.ok(Number.isFinite(completedBody.forecastErrorPct));
    const outcomeMetrics = await fetch(`${baseUrl}/api/action-plans/metrics`);
    assert.equal((await outcomeMetrics.json()).completedWithOutcome >= 1, true);
  });

  it('expone el contexto de tenant y limita los planes a la organización activa', async () => {
    const context = await fetch(`${baseUrl}/api/tenancy/context`);
    assert.equal(context.status, 200);
    const body = await context.json();
    assert.equal(body.organizationId, 'nashadi-demo');
    assert.equal(body.isolation, 'local-action-plans');
  });

  it('no permite leer un plan desde otra organización', () => {
    const plan = createActionPlan({ playbookId: 'port-congestion', caseId: 'TENANT-TEST', confidence: 0.8 }, 'tenant-a-user', 'org-a');
    assert.equal(getActionPlan(plan.id, 'org-b'), null);
    assert.equal(listActionPlans({ organizationId: 'org-b' }).some((item) => item.id === plan.id), false);
    assert.equal(listActionPlans({ organizationId: 'org-a' }).some((item) => item.id === plan.id), true);
  });

  it('expone versión, readiness y notificaciones operativas', async () => {
    const version = await fetch(`${baseUrl}/api/version`);
    assert.equal(version.status, 200);
    assert.equal((await version.json()).apiVersion, 'v1');
    const readiness = await fetch(`${baseUrl}/api/health/readiness`);
    assert.equal(readiness.status, 200);
    const readinessBody = await readiness.json();
    assert.equal(readinessBody.checks.persistence, true);
    assert.equal(readinessBody.persistence.enabled, false);
    assert.equal(readinessBody.checks.dataQuality, true);
    assert.equal(readinessBody.checks.auditIntegrity, true);
    const runtimeReadiness = await fetch(`${baseUrl}/api/runtime/readiness`);
    assert.equal(runtimeReadiness.status, 200);
    const runtimeReadinessBody = await runtimeReadiness.json();
    assert.equal(runtimeReadinessBody.checks.externalActionsDisabledByDefault, true);
    assert.equal(runtimeReadinessBody.checks.remotePersistence, true);
    assert.equal(runtimeReadinessBody.persistence.enabled, false);
    const catalog = await fetch(`${baseUrl}/api/data-catalog`);
    assert.ok((await catalog.json()).some((item) => item.id === 'cables-demo'));
    const connectors = await fetch(`${baseUrl}/api/connectors`);
    assert.ok((await connectors.json()).some((item) => item.id === 'ais' && item.mode === 'dry_run_only'));
    const frameworks = await fetch(`${baseUrl}/api/regulatory/frameworks`);
    assert.equal(frameworks.status, 200);
    assert.ok((await frameworks.json()).some((item) => item.id === 'nist-sp-800-161'));
    const evidenceMap = await fetch(`${baseUrl}/api/regulatory/evidence-map`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ frameworkId: 'dora-third-party-risk', evidence: [{ controlId: 'DORA-TPRM-01', evidenceRef: 'AP-LOCAL-001', verified: true }] }) });
    assert.equal(evidenceMap.status, 200);
    const evidenceMapBody = await evidenceMap.json();
    assert.equal(evidenceMapBody.counts.verified, 1);
    assert.match(evidenceMapBody.disclaimer, /no constituye certificación/);
    const recovery = await fetch(`${baseUrl}/api/recovery/profile`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ cableId: 'seamewe3', severity: 'total', horizons: [24, 168, 720] }) });
    assert.equal(recovery.status, 200);
    const recoveryBody = await recovery.json();
    assert.equal(recoveryBody.baseline.length, 3);
    assert.ok(recoveryBody.options.some((item) => item.id === 'reroute'));
    assert.ok(recoveryBody.bestByHorizon.every((item) => item.optionId));
    const validEvent = await fetch(`${baseUrl}/api/ingest/validate`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ externalId: 'contract-001', sourceId: 'ais-demo', eventType: 'ais_gap', title: 'AIS gap', severity: 'medium', impactUsd: 100, observedAt: '2026-08-08T12:00:00Z', confidence: 0.8, provenance: { licenseRef: 'demo-contract' } }) });
    assert.equal((await validEvent.json()).valid, true);

    const notifications = await fetch(`${baseUrl}/api/notifications?unread=true`);
    assert.equal(notifications.status, 200);
    const items = await notifications.json();
    assert.ok(items.length >= 1);

    const marked = await fetch(`${baseUrl}/api/notifications/${items[0].id}/read`, { method: 'PATCH' });
    assert.equal(marked.status, 200);
    assert.equal((await marked.json()).read, true);

    const compliance = await fetch(`${baseUrl}/api/compliance/readiness`);
    assert.equal(compliance.status, 200);
    const complianceBody = await compliance.json();
    assert.equal(complianceBody.ready, false);
    assert.ok(complianceBody.controls.some((control) => control.id === 'row_level_security' && control.status === 'pending_external'));
    const models = await fetch(`${baseUrl}/api/models`);
    assert.equal(models.status, 200);
    assert.ok((await models.json()).some((model) => model.id === 'impact-cascade' && model.assumptions.length > 0));
    const modelValidation = await fetch(`${baseUrl}/api/models/validation`);
    assert.equal(modelValidation.status, 200);
    const benchmark = await fetch(`${baseUrl}/api/models/calibration/benchmark`);
    assert.equal(benchmark.status, 200);
    assert.equal((await benchmark.json()).gate, 'abstain_no_fixtures');
    const cooperative = await fetch(`${baseUrl}/api/network/cooperative/preview`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ consent: false, minCohort: 3 }) });
    assert.equal(cooperative.status, 200);
    const cooperativeBody = await cooperative.json();
    assert.equal(cooperativeBody.status, 'consent_required');
    assert.equal(cooperativeBody.sharedSignals.length, 0);
    assert.equal(cooperativeBody.anonymization.applied, true);
    const modelValidationBody = await modelValidation.json();
    assert.equal(modelValidationBody.ready, true);
    assert.equal(modelValidationBody.historicalFixtures, 0);
    const calibration = await fetch(`${baseUrl}/api/models/calibration?modelId=impact-cascade`);
    assert.equal(calibration.status, 200);
    assert.equal((await calibration.json()).status, 'insufficient_sample');
    const fixtures = await fetch(`${baseUrl}/api/models/calibration/fixtures`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ modelId: 'impact-cascade', fixtures: [{ id: 'hist-001', eventDate: '2024-01-01', observedImpactUsd: 100, predictedImpactUsd: 120, sourceId: 'historical-authorized', provenance: 'local-fixture', assetId: 'cable-hist-001', durationHours: 48, alternateRoutes: ['route-alt-1'], recoveryOutcome: 'Servicio recuperado en 72 horas' }] }) });
    assert.equal(fixtures.status, 201);
    assert.equal((await fixtures.json()).overview.fixtureCount, 1);
    const source = await fetch(`${baseUrl}/api/sources/ais-demo`);
    assert.equal(source.status, 200);
    const quality = await fetch(`${baseUrl}/api/quality/report`);
    assert.equal(quality.status, 200);
    assert.equal((await quality.json()).ready, true);
    const provenance = await fetch(`${baseUrl}/api/governance/provenance`);
    assert.equal(provenance.status, 200);
    const provenanceBody = await provenance.json();
    assert.equal(provenanceBody.sources.length, 4);
    assert.ok(provenanceBody.sources.every((source) => Array.isArray(source.lineage)));
    const aisProvenance = provenanceBody.sources.find((item) => item.id === 'ais-demo');
    assert.equal(aisProvenance.licenseStatus, 'verification_required');
    assert.equal(aisProvenance.coverage, 'demo_events');
    const retention = await fetch(`${baseUrl}/api/governance/retention`);
    assert.equal(retention.status, 200);
    const retentionBody = await retention.json();
    assert.equal(retentionBody.dryRun, true);
    assert.equal(retentionBody.deletionEnabled, false);
    const readAll = await fetch(`${baseUrl}/api/notifications/read-all`, { method: 'POST' });
    assert.equal(readAll.status, 200);
    assert.ok((await readAll.json()).updated >= 0);
    const sla = await fetch(`${baseUrl}/api/ops/sla`);
    assert.equal(sla.status, 200);
    const slaBody = await sla.json();
    assert.equal(slaBody.cases.length, 3);
    assert.ok(slaBody.cases.every((item) => item.sla && item.sla.status));
    const sourceHealth = await fetch(`${baseUrl}/api/ops/source-health`);
    assert.equal(sourceHealth.status, 200);
    const sourceHealthBody = await sourceHealth.json();
    assert.equal(sourceHealthBody.sources.length, 4);
    assert.ok(sourceHealthBody.sources.every((source) => source.health));
    const failedIngest = await fetch(`${baseUrl}/api/ingest/events`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ externalId: 'dlq-test-001', sourceId: 'missing-source', eventType: 'test', title: 'Señal inválida', severity: 'high', impactUsd: 10 }) });
    assert.equal(failedIngest.status, 400);
    const deadLetters = await fetch(`${baseUrl}/api/ingest/dead-letters?status=queued`);
    const queued = await deadLetters.json();
    assert.ok(queued.some((item) => item.payload.externalId === 'dlq-test-001'));
    const deadLetter = queued.find((item) => item.payload.externalId === 'dlq-test-001');
    const retried = await fetch(`${baseUrl}/api/ingest/dead-letters/${deadLetter.id}/retry`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ payload: { externalId: 'dlq-test-001', sourceId: 'ais-demo', eventType: 'ais_gap', title: 'Señal corregida', severity: 'high', impactUsd: 10 } }) });
    assert.equal(retried.status, 200);
    assert.equal((await retried.json()).status, 'resolved');
  });

  it('permite colaboración en casos y administra webhooks locales', async () => {
    const comment = await fetch(`${baseUrl}/api/cases/RS-0827/comments`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ body: 'Revisar capacidad alternativa antes de cerrar.' }) });
    assert.equal(comment.status, 201);
    const comments = await fetch(`${baseUrl}/api/cases/RS-0827/comments`);
    assert.ok((await comments.json()).some((item) => item.body.includes('capacidad alternativa')));

    const webhook = await fetch(`${baseUrl}/api/webhooks`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: 'https://example.test/resilience-hook', events: ['alert.created', 'case.updated'] }) });
    assert.equal(webhook.status, 201);
    const created = await webhook.json();
    assert.equal(created.active, true);
    assert.equal(created.secretConfigured, true);
    assert.equal(created.secret, undefined);

    const event = await fetch(`${baseUrl}/api/ingest/events`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ externalId: 'webhook-test-001', sourceId: 'ports-demo', eventType: 'port_delay', title: 'Demora portuaria de prueba', severity: 'medium', impactUsd: 45000 }) });
    assert.equal(event.status, 201);
    const deliveries = await fetch(`${baseUrl}/api/webhooks/${created.id}/deliveries`);
    const deliveryItems = await deliveries.json();
    assert.ok(deliveryItems.some((item) => item.status === 'queued_local'));
    assert.match(deliveryItems[0].signature, /^sha256=/);
    assert.equal(deliveryItems[0].headers['x-resilience-delivery-id'], deliveryItems[0].id);
    assert.equal(deliveryItems[0].signatureVersion, 'v1');
    const rotated = await fetch(`${baseUrl}/api/webhooks/${created.id}/rotate-secret`, { method: 'POST' });
    assert.equal(rotated.status, 200);
    const rotatedBody = await rotated.json();
    assert.ok(rotatedBody.secret.length >= 32);
    assert.equal(rotatedBody.webhook.secret, undefined);
    const retry = await fetch(`${baseUrl}/api/webhooks/${created.id}/deliveries/${deliveryItems[0].id}/retry`, { method: 'POST' });
    assert.equal(retry.status, 202);
    assert.equal((await retry.json()).attempt, 1);
    const processed = await fetch(`${baseUrl}/api/webhooks/deliveries/process-local`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ limit: 10 }) });
    assert.equal(processed.status, 200);
    assert.ok((await processed.json()).processed >= 1);
    const updatedCase = await patchCase('RS-0827', { owner: 'Webhook Test' });
    assert.equal(updatedCase.status, 200);
    const afterCaseUpdate = await fetch(`${baseUrl}/api/webhooks/${created.id}/deliveries`);
    assert.ok((await afterCaseUpdate.json()).some((item) => item.eventType === 'case.updated'));
    const workerDryRun = await fetch(`${baseUrl}/api/webhooks/deliveries/process`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ dryRun: true, limit: 10 }) });
    assert.equal(workerDryRun.status, 200);
    assert.equal((await workerDryRun.json()).dryRun, undefined);
  });

  it('permite hacer triage de alertas con estado y nota auditables', async () => {
    const acknowledged = await fetch(`${baseUrl}/api/alerts/INC-0821`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: 'acknowledged', note: 'Revisada por el desk de riesgo.' }) });
    assert.equal(acknowledged.status, 200);
    const item = await acknowledged.json();
    assert.equal(item.status, 'acknowledged');
    assert.equal(item.triageNote, 'Revisada por el desk de riesgo.');
    const invalid = await fetch(`${baseUrl}/api/alerts/INC-0821`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: 'unknown' }) });
    assert.equal(invalid.status, 400);
  });

  it('ejecuta un job local de ingesta y conserva su historial', async () => {
    const run = await fetch(`${baseUrl}/api/jobs/demo-ingest`, { method: 'POST' });
    assert.equal(run.status, 201);
    const job = await run.json();
    assert.equal(job.status, 'completed');
    assert.equal(job.eventsReceived, 2);
    const jobs = await fetch(`${baseUrl}/api/jobs`);
    assert.ok((await jobs.json()).some((item) => item.id === job.id));
  });

  it('ejecuta el sweep local de SLA y devuelve el resultado operativo', async () => {
    const sweep = await fetch(`${baseUrl}/api/jobs/sla-sweep`, { method: 'POST' });
    assert.equal(sweep.status, 201);
    const body = await sweep.json();
    assert.equal(body.evaluated, 3);
    assert.ok(Number.isInteger(body.notificationsCreated));
    assert.ok(body.counts.on_track >= 0);
  });

  it('autentica usuarios demo y devuelve su rol', async () => {
    const invalid = await fetch(`${baseUrl}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'viewer@resilience.local', password: 'incorrecta' }) });
    assert.equal(invalid.status, 401);
    const lockoutEmail = `unknown-${Date.now()}@resilience.local`;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await fetch(`${baseUrl}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: lockoutEmail, password: 'incorrecta' }) });
    }
    const locked = await fetch(`${baseUrl}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: lockoutEmail, password: 'incorrecta' }) });
    assert.equal(locked.status, 429);
    assert.ok(locked.headers.get('retry-after'));

    const login = await fetch(`${baseUrl}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'analyst@resilience.local', password: 'demo123' }) });
    assert.equal(login.status, 200);
    const session = await login.json();
    assert.equal(session.user.role, 'risk_analyst');

    const me = await fetch(`${baseUrl}/api/auth/me`, { headers: { authorization: `Bearer ${session.token}` } });
    assert.equal(me.status, 200);
    assert.equal((await me.json()).user.email, 'analyst@resilience.local');
    const logout = await fetch(`${baseUrl}/api/auth/logout`, { method: 'POST', headers: { authorization: `Bearer ${session.token}` } });
    assert.equal(logout.status, 204);
    const revoked = await fetch(`${baseUrl}/api/auth/me`, { headers: { authorization: `Bearer ${session.token}` } });
    assert.equal(revoked.status, 401);
    const malformed = await fetch(`${baseUrl}/api/auth/me`, { headers: { authorization: 'Bearer malformed.token' } });
    assert.equal(malformed.status, 401);
    const roles = await fetch(`${baseUrl}/api/auth/roles`);
    assert.equal(roles.status, 200);
    assert.ok((await roles.json()).some((role) => role.id === 'admin'));
  });

  it('aplica autenticación y autorización cuando se activa el modo protegido', async () => {
    const previous = process.env.AUTH_REQUIRED;
    process.env.AUTH_REQUIRED = 'true';
    try {
      const publicHealth = await fetch(`${baseUrl}/api/health`);
      assert.equal(publicHealth.status, 200);
      const protectedGraph = await fetch(`${baseUrl}/api/graph`);
      assert.equal(protectedGraph.status, 401);
      const unauthenticated = await patchCase('RS-0825', { owner: 'blocked' });
      assert.equal(unauthenticated.status, 401);

      const viewerLogin = await fetch(`${baseUrl}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'viewer@resilience.local', password: 'demo123' }) });
      const viewer = await viewerLogin.json();
      const forbidden = await fetch(`${baseUrl}/api/cases/RS-0825`, { method: 'PATCH', headers: { authorization: `Bearer ${viewer.token}`, 'content-type': 'application/json' }, body: JSON.stringify({ owner: 'blocked' }) });
      assert.equal(forbidden.status, 403);

      const adminLogin = await fetch(`${baseUrl}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'admin@resilience.local', password: 'demo123' }) });
      const admin = await adminLogin.json();
      const authorized = await fetch(`${baseUrl}/api/cases/RS-0825`, { method: 'PATCH', headers: { authorization: `Bearer ${admin.token}`, 'content-type': 'application/json' }, body: JSON.stringify({ owner: 'Ops MENA' }) });
      assert.equal(authorized.status, 200);
      const users = await fetch(`${baseUrl}/api/auth/users`, { headers: { authorization: `Bearer ${admin.token}` } });
      assert.equal(users.status, 200);
      assert.ok((await users.json()).every((user) => !user.passwordHash));

      const loginTenant = async (email) => {
        const response = await fetch(`${baseUrl}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'demo123' }) });
        assert.equal(response.status, 200);
        return response.json();
      };
      const tenantA = await loginTenant('tenant-a@resilience.local');
      const tenantB = await loginTenant('tenant-b@resilience.local');
      assert.equal(tenantA.user.organizationId, 'tenant-a-demo');
      assert.equal(tenantB.user.organizationId, 'tenant-b-demo');
      const tenantPlan = await fetch(`${baseUrl}/api/action-plans`, { method: 'POST', headers: { authorization: `Bearer ${tenantA.token}`, 'content-type': 'application/json' }, body: JSON.stringify({ playbookId: 'port-congestion', caseId: 'TENANT-A-API', confidence: 0.8 }) });
      assert.equal(tenantPlan.status, 201);
      const tenantPlanBody = await tenantPlan.json();
      const crossTenantRead = await fetch(`${baseUrl}/api/action-plans/${tenantPlanBody.id}`, { headers: { authorization: `Bearer ${tenantB.token}` } });
      assert.equal(crossTenantRead.status, 404);
      const tenantBPlans = await fetch(`${baseUrl}/api/action-plans`, { headers: { authorization: `Bearer ${tenantB.token}` } });
      assert.equal(tenantBPlans.status, 200);
      assert.equal((await tenantBPlans.json()).some((plan) => plan.id === tenantPlanBody.id), false);
    } finally {
      if (previous === undefined) delete process.env.AUTH_REQUIRED;
      else process.env.AUTH_REQUIRED = previous;
    }
  });

  it('rechaza una simulación sin cable', async () => {
    const response = await postSimulation({ severity: 'total' });
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /cableId/);
  });

  it('rechaza severidad desconocida y duración inválida', async () => {
    const invalidSeverity = await postSimulation({ cableId: 'seamewe3', severity: 'extrema' });
    assert.equal(invalidSeverity.status, 400);

    const invalidDuration = await postSimulation({ cableId: 'seamewe3', durationHours: 0 });
    assert.equal(invalidDuration.status, 400);
  });

  it('calcula una simulación válida', async () => {
    const response = await postSimulation({ cableId: 'seamewe3', severity: 'parcial', durationHours: 12 });
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.severity, 'parcial');
    assert.equal(result.durationHours, 12);
    assert.ok(result.affected.length > 0);
    assert.ok(result.totalUsdLoss > 0);
    assert.equal(result.evidence.evidenceClass, 'assumed');
    assert.equal(result.evidence.model.id, 'impact-cascade');
    assert.ok(result.affected.every((item) => item.evidenceClass === 'assumed'));
  });

  it('expone casos y registra cambios en la bitácora', async () => {
    const casesResponse = await fetch(`${baseUrl}/api/cases`);
    assert.equal(casesResponse.status, 200);
    const cases = await casesResponse.json();
    assert.ok(cases.some((item) => item.id === 'RS-0827'));

    const updateResponse = await patchCase('RS-0827', { humanValidation: 'validated', status: 'closed' });
    assert.equal(updateResponse.status, 200);
    assert.equal((await updateResponse.json()).status, 'closed');

    const auditResponse = await fetch(`${baseUrl}/api/cases/RS-0827/audit`);
    assert.equal(auditResponse.status, 200);
    assert.ok((await auditResponse.json()).some((item) => item.action === 'case_updated'));
    const decisionPackage = await fetch(`${baseUrl}/api/cases/RS-0827/decision-package`);
    assert.equal(decisionPackage.status, 200);
    const packageBody = await decisionPackage.json();
    assert.equal(packageBody.packageType, 'local-decision-package');
    assert.equal(packageBody.case.id, 'RS-0827');
    assert.ok(Array.isArray(packageBody.modelRegistry));
    assert.ok(packageBody.evidenceChain);
    assert.ok(Array.isArray(packageBody.evidenceChain.observedSourceIds));
    assert.ok(Number.isInteger(packageBody.evidenceChain.assumedScenarioCount));
    const markdownPackage = await fetch(`${baseUrl}/api/cases/RS-0827/decision-package?format=markdown`);
    assert.equal(markdownPackage.status, 200);
    const pilotMarkdown = await fetch(`${baseUrl}/api/pilots/package?format=markdown`);
    assert.equal(pilotMarkdown.status, 200);
    assert.equal(pilotMarkdown.headers.get('content-type'), 'text/markdown; charset=utf-8');
    assert.match(await pilotMarkdown.text(), /Paquete de preparaci/);
    assert.equal(markdownPackage.headers.get('content-type'), 'text/markdown; charset=utf-8');
    assert.match(await markdownPackage.text(), /Paquete de decisión/);
    const missingPackage = await fetch(`${baseUrl}/api/cases/RS-4040/decision-package`);
    assert.equal(missingPackage.status, 404);
    const invalidUpdate = await patchCase('RS-0827', { status: 'unknown' });
    assert.equal(invalidUpdate.status, 400);
  });

  it('exige validacion humana antes de cerrar y resuelve la alerta asociada', async () => {
    const invalidClose = await patchCase('RS-0825', { status: 'closed' });
    assert.equal(invalidClose.status, 400);
    const close = await patchCase('RS-0825', { humanValidation: 'validated', status: 'closed' });
    assert.equal(close.status, 200);
    const alert = await fetch(`${baseUrl}/api/alerts/INC-0825`);
    assert.equal(alert.status, 200);
    assert.equal((await alert.json()).status, 'resolved');
  });

  it('genera el brief ejecutivo desde el estado operativo', async () => {
    const response = await fetch(`${baseUrl}/api/briefs/latest`);
    assert.equal(response.status, 200);
    const brief = await response.json();
    assert.equal(brief.id, 'BRIEF-LATEST');
    assert.equal(brief.audience, 'executive');
    assert.ok(brief.materialEvents >= 1);
    assert.ok(brief.confidence > 0 && brief.confidence <= 1);
    assert.equal(brief.evidenceClass, 'assumed');

    const operatorResponse = await fetch(`${baseUrl}/api/briefs/latest?audience=operator`);
    const operatorBrief = await operatorResponse.json();
    assert.equal(operatorBrief.audience, 'operator');
    assert.ok(operatorBrief.operatorDetail.openCases);

    const csv = await fetch(`${baseUrl}/api/briefs/latest/export?format=csv`);
    assert.equal(csv.status, 200);
    assert.match(await csv.text(), /Resilience score/);
  });

  it('convierte una alerta en caso sin duplicarla', async () => {
    const first = await fetch(`${baseUrl}/api/alerts/INC-0819/convert-to-case`, { method: 'POST' });
    assert.equal(first.status, 201);
    const created = await first.json();
    assert.equal(created.created, true);
    assert.equal(created.case.alertId, 'INC-0819');

    const second = await fetch(`${baseUrl}/api/alerts/INC-0819/convert-to-case`, { method: 'POST' });
    assert.equal(second.status, 200);
    assert.equal((await second.json()).created, false);
  });

  it('valida y persiste escenarios creados por API', async () => {
    const invalid = await fetch(`${baseUrl}/api/scenarios`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Invalido', confidence: 2 }) });
    assert.equal(invalid.status, 400);

    const valid = await fetch(`${baseUrl}/api/scenarios`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Prueba de resiliencia', lossIfWaitUsd: 1000, mitigationCostUsd: 200, protectedValueUsd: 700, confidence: 0.75, horizonHours: 24 }) });
    assert.equal(valid.status, 201);
    const validBody = await valid.json();
    assert.equal(validBody.name, 'Prueba de resiliencia');
    assert.equal(validBody.evidenceClass, 'assumed');
    assert.equal(validBody.evidence.model.id, 'impact-cascade');

    const scenarios = await fetch(`${baseUrl}/api/scenarios`);
    const items = await scenarios.json();
    assert.ok(items.every((item) => ['observed', 'inferred', 'assumed'].includes(item.evidenceClass)));
    assert.ok(items.every((item) => item.evidence && item.evidence.model));
    const comparison = await fetch(`${baseUrl}/api/scenarios/compare?ids=${items[0].id},${items[1].id}`);
    assert.equal(comparison.status, 200);
    assert.equal((await comparison.json()).deltas.length, 2);
  });

  it('devuelve métricas operativas y filtros de alertas', async () => {
    const critical = await fetch(`${baseUrl}/api/alerts?severity=critical`);
    assert.equal(critical.status, 200);
    assert.ok((await critical.json()).every((item) => item.severity === 'critical'));

    const metrics = await fetch(`${baseUrl}/api/metrics/overview`);
    assert.equal(metrics.status, 200);
    const result = await metrics.json();
    assert.ok(result.openAlerts >= 1);
    assert.ok(result.monitoredSources >= 1);

    const semiconductors = await fetch(`${baseUrl}/api/metrics/overview?vertical=Semiconductores`);
    assert.equal(semiconductors.status, 200);
    assert.equal((await semiconductors.json()).openAlerts, 0);

    const oilCases = await fetch(`${baseUrl}/api/cases?vertical=Oil%20%26%20Gas`);
    assert.equal(oilCases.status, 200);
    assert.ok((await oilCases.json()).length >= 1);

    const searched = await fetch(`${baseUrl}/api/cases?q=SMW&limit=1&offset=0`);
    assert.equal(searched.status, 200);
    assert.equal((await searched.json()).length, 1);
    assert.ok(Number(searched.headers.get('x-total-count')) >= 1);
    const filtered = await fetch(`${baseUrl}/api/cases?status=open&priority=P2&owner=Maritime&sort=sla_urgent`);
    assert.equal(filtered.status, 200);
    const filteredItems = await filtered.json();
    assert.ok(filteredItems.every((item) => item.status === 'open' && item.priority === 'P2' && item.owner.includes('Maritime')));
    assert.ok(filteredItems.every((item) => item.sla?.status));
  });

  it('ingiere eventos, actualiza la fuente y deduplica externalId', async () => {
    const payload = { externalId: 'evt-test-001', sourceId: 'ais-demo', eventType: 'ais_gap', title: 'Evento de prueba AIS', severity: 'high', impactUsd: 125000, location: 'Ormuz' };
    const first = await fetch(`${baseUrl}/api/ingest/events`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    assert.equal(first.status, 201);
    const firstBody = await first.json();
    assert.equal(firstBody.created, true);
    assert.equal(firstBody.alert.evidenceClass, 'observed');

    const second = await fetch(`${baseUrl}/api/ingest/events`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    assert.equal(second.status, 200);
    assert.equal((await second.json()).created, false);

    const readiness = await fetch(`${baseUrl}/api/health/readiness`);
    assert.equal(readiness.status, 200);
    assert.ok((await readiness.json()).sources.some((source) => source.id === 'ais-demo' && source.lastEventAt));
  });

  it('exporta la auditoría operativa en JSON y CSV', async () => {
    const json = await fetch(`${baseUrl}/api/audit/export?entityId=RS-0827&format=json`);
    assert.equal(json.status, 200);
    assert.match(await json.text(), /RS-0827/);
    const csv = await fetch(`${baseUrl}/api/audit/export?entityId=RS-0827&format=csv`);
    assert.equal(csv.status, 200);
    assert.match(await csv.text(), /Entidad ID/);
    const snapshot = await fetch(`${baseUrl}/api/ops/snapshot`);
    assert.equal(snapshot.status, 200);
    assert.match(await snapshot.text(), /local-platform/);
    const integrity = await fetch(`${baseUrl}/api/audit/integrity`);
    assert.equal(integrity.status, 200);
    const integrityBody = await integrity.json();
    assert.equal(integrityBody.valid, true);
    assert.ok(integrityBody.entries > 0);
    assert.equal(integrityBody.mismatches.length, 0);
  });

  it('expone observabilidad local y restaura snapshots con validación', async () => {
    const metrics = await fetch(`${baseUrl}/api/ops/metrics`);
    assert.equal(metrics.status, 200);
    const metricsBody = await metrics.json();
    assert.ok(metricsBody.requests > 0);
    assert.ok(Array.isArray(metricsBody.routes));

    const snapshotResponse = await fetch(`${baseUrl}/api/ops/snapshot`);
    const snapshot = await snapshotResponse.json();
    assert.equal(snapshot.schemaVersion, 1);
    const restored = await fetch(`${baseUrl}/api/ops/restore`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(snapshot) });
    assert.equal(restored.status, 200);
    assert.equal((await restored.json()).restored, true);

    const invalid = await fetch(`${baseUrl}/api/ops/restore`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({}) });
    assert.equal(invalid.status, 400);

    const reset = await fetch(`${baseUrl}/api/ops/reset-demo`, { method: 'POST' });
    assert.equal(reset.status, 200);
    const resetBody = await reset.json();
    assert.equal(resetBody.mode, 'demo_local_only');
    assert.equal(resetBody.counts.alerts, 4);
    assert.equal(resetBody.counts.cases, 3);
  });
});
