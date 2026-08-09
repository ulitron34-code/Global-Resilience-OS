import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const files = [
  'docs/supabase/001_initial_schema.sql',
  'docs/supabase/002_enterprise_extensions.sql',
  'docs/supabase/003_platform_snapshots.sql',
  'docs/supabase/004_operational_extensions.sql',
];
const sql = files.map((file) => readFileSync(join(root, file), 'utf8')).join('\n').toLowerCase();
const checks = [];
const check = (id, pass, evidence) => checks.push({ id, status: pass ? 'pass' : 'fail', evidence });
const tables = ['organizations', 'profiles', 'sources', 'alerts', 'cases', 'scenarios', 'audit_log', 'graph_nodes', 'graph_edges', 'action_playbooks', 'action_plans', 'provenance_records', 'data_catalog', 'platform_snapshots', 'action_plan_events', 'decision_shares', 'source_intake_reviews', 'calibration_fixtures', 'incidents'];
for (const table of tables) check(`table:${table}`, new RegExp(`create table if not exists public\\.${table}\\b`).test(sql), 'table declaration present');
for (const table of tables) check(`rls:${table}`, new RegExp(`alter table public\\.${table} enable row level security`).test(sql), 'RLS enabled');
check('tenant-function', sql.includes('create or replace function public.current_organization_id()'), 'JWT organization claim helper present');
check('role-function', sql.includes('create or replace function public.current_app_role()'), 'JWT app role helper present');
const policyNames = { organizations: 'organization', sources: 'sources', alerts: 'alerts', cases: 'cases', scenarios: 'scenarios', audit_log: 'audit', graph_nodes: 'graph nodes', graph_edges: 'graph edges', action_playbooks: 'playbooks', action_plans: 'action plans', provenance_records: 'provenance', data_catalog: 'data catalog', action_plan_events: 'action plan events', decision_shares: 'decision shares', source_intake_reviews: 'source intake reviews', calibration_fixtures: 'calibration fixtures', incidents: 'incidents' };
for (const [table, policyName] of Object.entries(policyNames)) check(`policy:${table}`, sql.includes(`members can read ${policyName}`), 'organization-scoped read policy present');
const tenantTables = tables.filter((table) => table !== 'organizations');
check('organization-columns', tenantTables.every((table) => new RegExp(`alter table public\\.${table} add column if not exists organization_id uuid`).test(sql) || new RegExp(`create table if not exists public\\.${table}\\s*\\([\\s\\S]*?organization_id uuid`).test(sql)), 'organization_id represented in enterprise schema');
check('demo-policies-removed', ['sources', 'alerts', 'cases', 'scenarios', 'audit'].every((name) => sql.includes(`drop policy if exists "authenticated can read ${name}"`)), 'broad demo policies explicitly dropped');
check('snapshot-policies', ['members can read platform snapshots', 'members can insert platform snapshots', 'members can update platform snapshots'].every((name) => sql.includes(`create policy "${name}"`)), 'snapshot read/write policies are organization-scoped');
const writePolicies = ['analysts can insert action plan events', 'analysts can insert decision shares', 'analysts can update decision shares', 'analysts can insert source intake reviews', 'analysts can update source intake reviews', 'analysts can insert calibration fixtures', 'analysts can update calibration fixtures', 'analysts can insert incidents', 'analysts can update incidents'];
check('operational-write-policies', writePolicies.every((name) => sql.includes(`create policy "${name}"`)), 'normalized operational writes require analyst or admin role and tenant match');
const policyBody = (name) => {
  const start = sql.indexOf(`create policy "${name}"`);
  if (start < 0) return '';
  const next = sql.indexOf('create policy "', start + 1);
  return sql.slice(start, next < 0 ? undefined : next);
};
check('operational-write-policy-scope', writePolicies.every((name) => {
  const body = policyBody(name);
  return body.includes('organization_id = public.current_organization_id()') && body.includes("public.current_app_role() in ('admin', 'risk_analyst')");
}), 'every normalized write policy checks tenant and allowed app role');
const failed = checks.filter((item) => item.status === 'fail');
console.log(JSON.stringify({ schemaVersion: '1.2.0-local', checkedAt: new Date().toISOString(), gate: failed.length ? 'FAIL' : 'PASS', files, checks, disclaimer: 'Textual local audit; run it again in Supabase staging before production.' }, null, 2));
if (failed.length) process.exitCode = 1;
