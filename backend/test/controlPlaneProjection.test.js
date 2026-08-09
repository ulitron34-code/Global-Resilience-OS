import test from 'node:test';
import assert from 'node:assert/strict';
import { buildControlPlaneProjection, validateControlPlaneProjection } from '../domain/controlPlaneProjection.js';

const organizationUuid = '11111111-1111-4111-8111-111111111111';

test('control plane projection is deterministic and tenant scoped', () => {
  const input = {
    organizationId: 'tenant-a-demo',
    organizationUuid,
    projectionTimestamp: '2026-08-09T00:00:00Z',
    notifications: [
      { id: 'NOT-A', organizationId: 'tenant-a-demo', type: 'new_alert', title: 'A', message: 'Signal', read: false, createdAt: '2026-08-09T00:00:00Z' },
      { id: 'NOT-B', organizationId: 'tenant-b-demo', type: 'new_alert', title: 'B', message: 'Other', read: false },
    ],
    webhooks: [{ id: 'WH-A', organizationId: 'tenant-a-demo', url: 'https://example.com/hook', events: ['alert.created'], secret: 'must-never-project' }],
    webhookDeliveries: [{ id: 'DEL-A', organizationId: 'tenant-a-demo', webhookId: 'WH-A', eventType: 'alert.created', status: 'queued_local', attempt: 1, payload: { ok: true } }],
    jobRuns: [{ id: 'JOB-A', organizationId: 'tenant-a-demo', type: 'demo_ingestion', status: 'completed', eventsReceived: 2, alertsCreated: 1 }],
  };
  const first = buildControlPlaneProjection(input);
  const second = buildControlPlaneProjection(input);
  assert.deepEqual(first, second);
  assert.equal(first.counts.notifications, 1);
  assert.equal(first.counts.webhooks, 1);
  assert.equal(first.counts.webhook_deliveries, 1);
  assert.equal(first.tables.webhooks[0].secret, undefined);
  assert.equal(first.tables.webhook_deliveries[0].webhook_id, first.tables.webhooks[0].id);
  assert.deepEqual(validateControlPlaneProjection(first), { valid: true, checks: [
    { id: 'organization_uuid', pass: true },
    { id: 'notifications_tenant_scope', pass: true },
    { id: 'webhooks_tenant_scope', pass: true },
    { id: 'webhook_deliveries_tenant_scope', pass: true },
    { id: 'job_runs_tenant_scope', pass: true },
    { id: 'webhook_delivery_foreign_keys', pass: true },
    { id: 'no_webhook_secrets', pass: true },
  ] });
});

test('control plane projection rejects an invalid organization UUID', () => {
  assert.throws(() => buildControlPlaneProjection({ organizationUuid: 'tenant-a-demo' }), /organizationUuid/);
});
