import { getEnvironmentContract } from '../backend/config/environmentContract.js';
import { evaluateProductiveSource } from '../backend/domain/sourceReadiness.js';
import { buildControlPlaneProjection, validateControlPlaneProjection } from '../backend/domain/controlPlaneProjection.js';

const checks = [];
function check(id, pass, evidence) { checks.push({ id, status: pass ? 'pass' : 'fail', evidence }); }

const safeProduction = getEnvironmentContract({
  APP_MODE: 'production', DATA_MODE: 'licensed', AUTH_REQUIRED: 'true', AUTH_SECRET: 'x'.repeat(48),
  CORS_ORIGIN: 'https://app.example', ALLOW_EXTERNAL_ACTIONS: 'false', DATA_FILE: 'supabase',
  PERSISTENCE_MODE: 'supabase', SUPABASE_SERVICE_ROLE_KEY: 'server-key-placeholder', SUPABASE_ORGANIZATION_SLUG: 'pilot-org',
});
const unsafeProduction = getEnvironmentContract({ APP_MODE: 'production', DATA_MODE: 'illustrative', AUTH_REQUIRED: 'false', ALLOW_EXTERNAL_ACTIONS: 'false' });
check('production-config-accepts-complete-controls', safeProduction.ready, 'complete production contract is accepted');
check('production-config-rejects-incomplete-controls', !unsafeProduction.ready, 'incomplete or illustrative production contract is rejected');

const license = { contractRef: 'contract-preflight', territory: ['global'], allowedFields: ['externalId', 'observedAt'], retentionDays: 180, redistribution: 'internal_only', attribution: 'Provider', renewalContact: 'legal@example.com' };
const illustrative = evaluateProductiveSource({ id: 'ais-demo', status: 'connected', licenseStatus: 'active' }, { id: 'ais-demo', coverage: 'illustrative_events', license });
const productive = evaluateProductiveSource({ id: 'licensed-feed', status: 'connected', licenseStatus: 'active' }, { id: 'licensed-feed', coverage: 'authorized_events', license });
check('source-gate-rejects-illustrative', !illustrative.ready, 'illustrative source cannot enter production');
check('source-gate-accepts-complete-productive', productive.ready, 'connected source with complete license metadata can enter quality gate');

const sourceRows = [
  { id: 'WH-A', organizationId: 'tenant-a', url: 'https://example.com/a', events: ['alert.created'] },
  { id: 'WH-B', organizationId: 'tenant-b', url: 'https://example.com/b', events: ['alert.created'] },
];
const notifications = [{ id: 'N-A', organizationId: 'tenant-a', type: 'new_alert', title: 'A' }, { id: 'N-B', organizationId: 'tenant-b', type: 'new_alert', title: 'B' }];
const deliveries = [{ id: 'D-A', organizationId: 'tenant-a', webhookId: 'WH-A', eventType: 'alert.created' }, { id: 'D-B', organizationId: 'tenant-b', webhookId: 'WH-B', eventType: 'alert.created' }];
const jobs = [{ id: 'J-A', organizationId: 'tenant-a', type: 'sweep' }, { id: 'J-B', organizationId: 'tenant-b', type: 'sweep' }];
const uuidA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const uuidB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const projectionA = buildControlPlaneProjection({ organizationId: 'tenant-a', organizationUuid: uuidA, notifications, webhooks: sourceRows, webhookDeliveries: deliveries, jobRuns: jobs });
const projectionB = buildControlPlaneProjection({ organizationId: 'tenant-b', organizationUuid: uuidB, notifications, webhooks: sourceRows, webhookDeliveries: deliveries, jobRuns: jobs });
const validA = validateControlPlaneProjection(projectionA);
const validB = validateControlPlaneProjection(projectionB);
check('tenant-projection-validates', validA.valid && validB.valid, 'both projected tenants pass organization and foreign-key checks');
check('tenant-projection-isolates-rows', projectionA.tables.notifications.length === 1 && projectionB.tables.notifications.length === 1 && projectionA.tables.webhooks[0].id !== projectionB.tables.webhooks[0].id, 'each tenant receives only its rows with tenant-specific deterministic IDs');
check('tenant-projection-hides-secrets', validA.checks.find((item) => item.id === 'no_webhook_secrets')?.pass === true && validB.checks.find((item) => item.id === 'no_webhook_secrets')?.pass === true, 'projection does not carry plaintext webhook secrets');

const failed = checks.filter((item) => item.status === 'fail');
console.log(JSON.stringify({ schemaVersion: '1.0.0-local-production-preflight', checkedAt: new Date().toISOString(), gate: failed.length ? 'FAIL' : 'PASS', checks, externalVerificationStillRequired: ['Supabase RLS with two real organizations', 'managed secrets and deployed runtime', 'licensed sources and pilot evidence'], disclaimer: 'Preflight local determinista; no conecta ni modifica servicios externos.' }, null, 2));
if (failed.length) process.exitCode = 1;
