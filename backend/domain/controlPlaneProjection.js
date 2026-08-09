import { createHash } from 'node:crypto';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function stableUuid(namespace, localId) {
  const digest = createHash('sha256').update(`${namespace}:${localId}`).digest('hex');
  const version = `5${digest.slice(13, 16)}`;
  const variant = `${(parseInt(digest.slice(16, 18), 16) & 0x3f | 0x80).toString(16).padStart(2, '0')}${digest.slice(18, 20)}`;
  return `${digest.slice(0, 8)}-${digest.slice(8, 12)}-${version}-${variant}-${digest.slice(20, 32)}`;
}

function projectedId(table, organizationUuid, localId) {
  return stableUuid(`${table}:${organizationUuid}`, String(localId));
}

function scoped(items, organizationId) {
  return (items || []).filter((item) => (item.organizationId || 'nashadi-demo') === organizationId);
}

function isoOrNull(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function ensureObject(value) { return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }

/**
 * Converts local control-plane collections into Supabase-ready rows.
 * Local IDs are deterministic UUIDs inside each organization; the original
 * local ID remains in payload/metrics for reconciliation and backfill audits.
 */
export function buildControlPlaneProjection({ organizationId = 'nashadi-demo', organizationUuid, projectionTimestamp, notifications = [], webhooks = [], webhookDeliveries = [], jobRuns = [] } = {}) {
  if (!UUID_PATTERN.test(String(organizationUuid || ''))) throw new Error('organizationUuid debe ser un UUID real');
  const projectionAt = isoOrNull(projectionTimestamp) || new Date().toISOString();
  const tenantNotifications = scoped(notifications, organizationId);
  const tenantWebhooks = scoped(webhooks, organizationId);
  const tenantDeliveries = scoped(webhookDeliveries, organizationId);
  const tenantJobs = scoped(jobRuns, organizationId);
  const webhookIds = new Map(tenantWebhooks.map((item) => [String(item.id), projectedId('webhooks', organizationUuid, item.id)]));
  const caseIds = new Map();
  const sourceIds = new Map();

  const rows = {
    notifications: tenantNotifications.map((item) => ({
      id: projectedId('notifications', organizationUuid, item.id),
      organization_id: organizationUuid,
      notification_type: String(item.type || 'operational'),
      title: String(item.title || 'Notificación operativa'),
      message: String(item.message || ''),
      case_id: caseIds.get(String(item.caseId)) || null,
      source_id: sourceIds.get(String(item.sourceId)) || null,
      read_at: item.read ? (isoOrNull(item.readAt) || projectionAt) : null,
      payload: { ...ensureObject(item.payload), local_id: item.id },
      created_at: isoOrNull(item.createdAt) || projectionAt,
    })),
    webhooks: tenantWebhooks.map((item) => ({
      id: webhookIds.get(String(item.id)),
      organization_id: organizationUuid,
      endpoint_url: String(item.url || ''),
      event_types: Array.isArray(item.events) ? item.events : [],
      active: item.active !== false,
      secret_ref: `local-secret:${item.id}`,
      secret_fingerprint: item.secretFingerprint || null,
      created_by: null,
      created_at: isoOrNull(item.createdAt) || projectionAt,
      updated_at: isoOrNull(item.updatedAt) || isoOrNull(item.createdAt) || projectionAt,
    })),
    webhook_deliveries: tenantDeliveries.flatMap((item) => {
      const webhookId = webhookIds.get(String(item.webhookId));
      if (!webhookId) return [];
      return [{
        id: projectedId('webhook_deliveries', organizationUuid, item.id),
        organization_id: organizationUuid,
        webhook_id: webhookId,
        event_type: String(item.eventType || 'operational.event'),
        status: String(item.status || 'queued'),
        attempt: Number(item.attempt) || 0,
        response_code: Number.isFinite(Number(item.responseCode)) ? Number(item.responseCode) : null,
        payload: ensureObject(item.payload),
        headers: ensureObject(item.headers),
        last_error: item.lastError || null,
        next_attempt_at: isoOrNull(item.nextAttemptAt),
        processed_at: isoOrNull(item.processedAt),
        created_at: isoOrNull(item.createdAt) || projectionAt,
      }];
    }),
    job_runs: tenantJobs.map((item) => ({
      id: projectedId('job_runs', organizationUuid, item.id),
      organization_id: organizationUuid,
      job_type: String(item.type || 'operational_job'),
      status: String(item.status || 'unknown'),
      started_at: isoOrNull(item.startedAt) || projectionAt,
      finished_at: isoOrNull(item.finishedAt),
      metrics: { ...ensureObject(item.metrics), eventsReceived: item.eventsReceived ?? null, alertsCreated: item.alertsCreated ?? null, local_id: item.id },
      error_message: item.error || item.lastError || null,
      created_by: null,
      created_at: isoOrNull(item.startedAt) || projectionAt,
    })),
  };

  return { organizationId, organizationUuid, tables: rows, counts: Object.fromEntries(Object.entries(rows).map(([name, values]) => [name, values.length])), reconciliation: { ignoredDeliveriesWithoutWebhook: tenantDeliveries.length - rows.webhook_deliveries.length, secretPlaintextProjected: false } };
}

export function validateControlPlaneProjection(projection) {
  const tables = projection?.tables || {};
  const expectedOrganization = projection?.organizationUuid;
  const checks = [
    { id: 'organization_uuid', pass: UUID_PATTERN.test(String(expectedOrganization || '')) },
    ...Object.entries(tables).map(([table, rows]) => ({ id: `${table}_tenant_scope`, pass: rows.every((row) => row.organization_id === expectedOrganization) })),
    { id: 'webhook_delivery_foreign_keys', pass: (tables.webhook_deliveries || []).every((row) => (tables.webhooks || []).some((webhook) => webhook.id === row.webhook_id)) },
    { id: 'no_webhook_secrets', pass: !(tables.webhooks || []).some((row) => Object.prototype.hasOwnProperty.call(row, 'secret')) },
  ];
  return { valid: checks.every((check) => check.pass), checks };
}
