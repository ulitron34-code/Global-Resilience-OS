-- GLOBAL RESILIENCE OS - CONSOLIDATED SUPABASE SCHEMA (001 - 005)
-- Generado automáticamente: 2026-08-16T17:52:33.149Z

-- ==========================================
-- SECCIÓN: 001_initial_schema.sql
-- ==========================================

-- Global Resilience OS - esquema inicial para Supabase/Postgres
-- Los datos de la demo no se migran como datos productivos.

create extension if not exists pgcrypto;

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'risk_analyst', 'viewer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.alert_severity AS ENUM ('critical', 'high', 'medium', 'low');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.workflow_status AS ENUM ('open', 'in_progress', 'closed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role public.app_role not null default 'viewer',
  created_at timestamptz not null default now()
);

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null,
  status text not null default 'connected',
  latency_seconds integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  severity public.alert_severity not null,
  title text not null,
  location text,
  impact_usd numeric(18,2) not null default 0,
  status public.workflow_status not null default 'open',
  source_ids uuid[] not null default '{}',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  alert_id uuid references public.alerts(id),
  title text not null,
  owner_id uuid references public.profiles(id),
  priority text not null default 'P2',
  status public.workflow_status not null default 'open',
  human_validation text not null default 'pending',
  sla_minutes integer,
  impact_usd numeric(18,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scenarios (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'draft',
  loss_if_wait_usd numeric(18,2) not null default 0,
  mitigation_cost_usd numeric(18,2) not null default 0,
  protected_value_usd numeric(18,2) not null default 0,
  confidence numeric(5,4),
  horizon_hours integer,
  assumptions jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  actor_id uuid references public.profiles(id),
  message text,
  changes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists alerts_status_idx on public.alerts(status, severity);
create index if not exists cases_status_idx on public.cases(status, priority);
create index if not exists audit_entity_idx on public.audit_log(entity_type, entity_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.sources enable row level security;
alter table public.alerts enable row level security;
alter table public.cases enable row level security;
alter table public.scenarios enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists "authenticated can read sources" on public.sources;
drop policy if exists "authenticated can read alerts" on public.alerts;
drop policy if exists "authenticated can read cases" on public.cases;
drop policy if exists "authenticated can read scenarios" on public.scenarios;
drop policy if exists "authenticated can read audit" on public.audit_log;

create policy "authenticated can read sources" on public.sources for select to authenticated using (true);
create policy "authenticated can read alerts" on public.alerts for select to authenticated using (true);
create policy "authenticated can read cases" on public.cases for select to authenticated using (true);
create policy "authenticated can read scenarios" on public.scenarios for select to authenticated using (true);
create policy "authenticated can read audit" on public.audit_log for select to authenticated using (true);


-- ==========================================
-- SECCIÓN: 002_enterprise_extensions.sql
-- ==========================================

-- Global Resilience OS - extensiones enterprise preparadas para Supabase
-- No ejecutar sobre producción sin revisar nombres, migraciones y claims JWT.

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists organization_id uuid references public.organizations(id);
alter table public.sources add column if not exists organization_id uuid references public.organizations(id);
alter table public.alerts add column if not exists organization_id uuid references public.organizations(id);
alter table public.cases add column if not exists organization_id uuid references public.organizations(id);
alter table public.scenarios add column if not exists organization_id uuid references public.organizations(id);
alter table public.audit_log add column if not exists organization_id uuid references public.organizations(id);

create table if not exists public.graph_nodes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id),
  external_id text not null,
  node_type text not null,
  label text not null,
  attributes jsonb not null default '{}'::jsonb,
  confidence numeric(5,4),
  provenance jsonb not null default '[]'::jsonb,
  valid_from timestamptz not null default now(),
  valid_to timestamptz,
  review_status text not null default 'unreviewed',
  created_at timestamptz not null default now(),
  unique (organization_id, external_id, valid_from)
);

create table if not exists public.graph_edges (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id),
  from_node_id uuid not null references public.graph_nodes(id) on delete cascade,
  to_node_id uuid not null references public.graph_nodes(id) on delete cascade,
  relation text not null,
  weight numeric(8,6),
  confidence numeric(5,4),
  provenance jsonb not null default '[]'::jsonb,
  valid_from timestamptz not null default now(),
  valid_to timestamptz,
  review_status text not null default 'unreviewed'
);

create table if not exists public.action_playbooks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id),
  slug text not null,
  name text not null,
  category text not null,
  owner_role text not null,
  default_sla_minutes integer,
  triggers jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table if not exists public.action_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id),
  case_id uuid references public.cases(id),
  playbook_id uuid references public.action_playbooks(id),
  status text not null default 'draft_for_human_approval',
  decision text,
  economics jsonb not null default '{}'::jsonb,
  confidence numeric(5,4),
  assumptions jsonb not null default '[]'::jsonb,
  evidence_requirements jsonb not null default '[]'::jsonb,
  human_approval text not null default 'pending',
  owner_id uuid references public.profiles(id),
  outcome jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.provenance_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id),
  entity_type text not null,
  entity_id uuid,
  source_id uuid references public.sources(id),
  model_id text,
  source_uri text,
  license_ref text,
  retrieved_at timestamptz,
  transformation jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.data_catalog (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id),
  source_key text not null,
  domain text not null,
  coverage text,
  source_class text,
  license_status text not null default 'verification_required',
  refresh_sla_hours integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (organization_id, source_key)
);

create index if not exists graph_nodes_org_type_idx on public.graph_nodes(organization_id, node_type);
create index if not exists graph_edges_org_relation_idx on public.graph_edges(organization_id, relation);
create index if not exists action_plans_org_status_idx on public.action_plans(organization_id, status, created_at desc);
create index if not exists provenance_entity_idx on public.provenance_records(organization_id, entity_type, entity_id);
create index if not exists data_catalog_license_idx on public.data_catalog(organization_id, license_status);

alter table public.organizations enable row level security;
alter table public.graph_nodes enable row level security;
alter table public.graph_edges enable row level security;
alter table public.action_playbooks enable row level security;
alter table public.action_plans enable row level security;
alter table public.provenance_records enable row level security;
alter table public.data_catalog enable row level security;

-- La aplicación debe incluir organization_id en app_metadata del JWT.
create or replace function public.current_organization_id()
returns uuid
language sql
stable
as $$
  select nullif((auth.jwt() -> 'app_metadata' ->> 'organization_id'), '')::uuid
$$;

drop policy if exists "members can read organization" on public.organizations;
drop policy if exists "members can read graph nodes" on public.graph_nodes;
drop policy if exists "members can read graph edges" on public.graph_edges;
drop policy if exists "members can read playbooks" on public.action_playbooks;
drop policy if exists "members can read action plans" on public.action_plans;
drop policy if exists "members can read provenance" on public.provenance_records;
drop policy if exists "members can read data catalog" on public.data_catalog;
drop policy if exists "members can read sources" on public.sources;
drop policy if exists "members can read alerts" on public.alerts;
drop policy if exists "members can read cases" on public.cases;
drop policy if exists "members can read scenarios" on public.scenarios;
drop policy if exists "members can read audit" on public.audit_log;

create policy "members can read organization" on public.organizations for select to authenticated using (id = public.current_organization_id());
create policy "members can read graph nodes" on public.graph_nodes for select to authenticated using (organization_id = public.current_organization_id());
create policy "members can read graph edges" on public.graph_edges for select to authenticated using (organization_id = public.current_organization_id());
create policy "members can read playbooks" on public.action_playbooks for select to authenticated using (organization_id = public.current_organization_id() or organization_id is null);
create policy "members can read action plans" on public.action_plans for select to authenticated using (organization_id = public.current_organization_id());
create policy "members can read provenance" on public.provenance_records for select to authenticated using (organization_id = public.current_organization_id());
create policy "members can read data catalog" on public.data_catalog for select to authenticated using (organization_id = public.current_organization_id());

-- Reemplazar las políticas demo de lectura amplia del esquema inicial.
drop policy if exists "authenticated can read sources" on public.sources;
drop policy if exists "authenticated can read alerts" on public.alerts;
drop policy if exists "authenticated can read cases" on public.cases;
drop policy if exists "authenticated can read scenarios" on public.scenarios;
drop policy if exists "authenticated can read audit" on public.audit_log;
create policy "members can read sources" on public.sources for select to authenticated using (organization_id = public.current_organization_id());
create policy "members can read alerts" on public.alerts for select to authenticated using (organization_id = public.current_organization_id());
create policy "members can read cases" on public.cases for select to authenticated using (organization_id = public.current_organization_id());
create policy "members can read scenarios" on public.scenarios for select to authenticated using (organization_id = public.current_organization_id());
create policy "members can read audit" on public.audit_log for select to authenticated using (organization_id = public.current_organization_id());


-- ==========================================
-- SECCIÓN: 003_platform_snapshots.sql
-- ==========================================

-- Persistencia transaccional inicial del estado operativo.
-- Un snapshot por organizacion; las proyecciones normalizadas quedan para
-- una migracion posterior.

create table if not exists public.platform_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_key text not null default 'primary',
  state jsonb not null default '{}'::jsonb,
  audit_log jsonb not null default '[]'::jsonb,
  notifications jsonb not null default '[]'::jsonb,
  comments jsonb not null default '[]'::jsonb,
  webhooks jsonb not null default '[]'::jsonb,
  webhook_deliveries jsonb not null default '[]'::jsonb,
  job_runs jsonb not null default '[]'::jsonb,
  version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, snapshot_key)
);

create index if not exists platform_snapshots_org_idx on public.platform_snapshots(organization_id, updated_at desc);
alter table public.platform_snapshots enable row level security;

drop policy if exists "members can read platform snapshots" on public.platform_snapshots;
drop policy if exists "members can insert platform snapshots" on public.platform_snapshots;
drop policy if exists "members can update platform snapshots" on public.platform_snapshots;
create policy "members can read platform snapshots" on public.platform_snapshots for select to authenticated using (organization_id = public.current_organization_id());
create policy "members can insert platform snapshots" on public.platform_snapshots for insert to authenticated with check (organization_id = public.current_organization_id());
create policy "members can update platform snapshots" on public.platform_snapshots for update to authenticated using (organization_id = public.current_organization_id()) with check (organization_id = public.current_organization_id());


-- ==========================================
-- SECCIÓN: 004_operational_extensions.sql
-- ==========================================

-- Global Resilience OS - extensiones operativas normalizadas
-- Preparadas para staging; no reemplazan el snapshot hasta validar migracion.

create table if not exists public.action_plan_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  action_plan_id uuid not null references public.action_plans(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  actor_id uuid references public.profiles(id),
  actor_label text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.decision_shares (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  access_count integer not null default 0,
  last_accessed_at timestamptz,
  scope jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.source_intake_reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source_key text not null,
  decision_status text not null default 'pending_review',
  activation_status text not null default 'blocked_external',
  checks jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  decision_note text,
  decided_by uuid references public.profiles(id),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.calibration_fixtures (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  model_id text not null,
  event_key text not null,
  observed_at timestamptz,
  expected_impact numeric(18,2),
  actual_impact numeric(18,2),
  outcome jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  completeness text not null default 'incomplete',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (organization_id, model_id, event_key)
);

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  external_id text,
  title text not null,
  severity public.alert_severity not null default 'medium',
  status text not null default 'open',
  detected_at timestamptz,
  resolved_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, external_id)
);

create or replace function public.current_app_role()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'viewer')
$$;

create index if not exists action_plan_events_org_plan_idx on public.action_plan_events(organization_id, action_plan_id, created_at desc);
create index if not exists decision_shares_org_case_idx on public.decision_shares(organization_id, case_id, created_at desc);
create index if not exists source_intake_reviews_org_status_idx on public.source_intake_reviews(organization_id, decision_status, updated_at desc);
create index if not exists calibration_fixtures_org_model_idx on public.calibration_fixtures(organization_id, model_id, observed_at desc);
create index if not exists incidents_org_status_idx on public.incidents(organization_id, status, severity, created_at desc);

alter table public.action_plan_events enable row level security;
alter table public.decision_shares enable row level security;
alter table public.source_intake_reviews enable row level security;
alter table public.calibration_fixtures enable row level security;
alter table public.incidents enable row level security;

drop policy if exists "members can read action plan events" on public.action_plan_events;
drop policy if exists "members can read decision shares" on public.decision_shares;
drop policy if exists "members can read source intake reviews" on public.source_intake_reviews;
drop policy if exists "members can read calibration fixtures" on public.calibration_fixtures;
drop policy if exists "members can read incidents" on public.incidents;

create policy "members can read action plan events" on public.action_plan_events for select to authenticated using (organization_id = public.current_organization_id());
create policy "members can read decision shares" on public.decision_shares for select to authenticated using (organization_id = public.current_organization_id());
create policy "members can read source intake reviews" on public.source_intake_reviews for select to authenticated using (organization_id = public.current_organization_id());
create policy "members can read calibration fixtures" on public.calibration_fixtures for select to authenticated using (organization_id = public.current_organization_id());
create policy "members can read incidents" on public.incidents for select to authenticated using (organization_id = public.current_organization_id());

create policy "analysts can insert action plan events" on public.action_plan_events for insert to authenticated with check (organization_id = public.current_organization_id() and public.current_app_role() in ('admin', 'risk_analyst'));
create policy "analysts can insert decision shares" on public.decision_shares for insert to authenticated with check (organization_id = public.current_organization_id() and public.current_app_role() in ('admin', 'risk_analyst'));
create policy "analysts can update decision shares" on public.decision_shares for update to authenticated using (organization_id = public.current_organization_id() and public.current_app_role() in ('admin', 'risk_analyst')) with check (organization_id = public.current_organization_id() and public.current_app_role() in ('admin', 'risk_analyst'));
create policy "analysts can insert source intake reviews" on public.source_intake_reviews for insert to authenticated with check (organization_id = public.current_organization_id() and public.current_app_role() in ('admin', 'risk_analyst'));
create policy "analysts can update source intake reviews" on public.source_intake_reviews for update to authenticated using (organization_id = public.current_organization_id() and public.current_app_role() in ('admin', 'risk_analyst')) with check (organization_id = public.current_organization_id() and public.current_app_role() in ('admin', 'risk_analyst'));
create policy "analysts can insert calibration fixtures" on public.calibration_fixtures for insert to authenticated with check (organization_id = public.current_organization_id() and public.current_app_role() in ('admin', 'risk_analyst'));
create policy "analysts can update calibration fixtures" on public.calibration_fixtures for update to authenticated using (organization_id = public.current_organization_id() and public.current_app_role() in ('admin', 'risk_analyst')) with check (organization_id = public.current_organization_id() and public.current_app_role() in ('admin', 'risk_analyst'));
create policy "analysts can insert incidents" on public.incidents for insert to authenticated with check (organization_id = public.current_organization_id() and public.current_app_role() in ('admin', 'risk_analyst'));
create policy "analysts can update incidents" on public.incidents for update to authenticated using (organization_id = public.current_organization_id() and public.current_app_role() in ('admin', 'risk_analyst')) with check (organization_id = public.current_organization_id() and public.current_app_role() in ('admin', 'risk_analyst'));


-- ==========================================
-- SECCIÓN: 005_control_plane_extensions.sql
-- ==========================================

-- Global Resilience OS - control plane operativo normalizado
-- La migracion conserva el snapshot como respaldo, pero permite proyectar
-- notificaciones, webhooks y jobs con tenant y RLS propios.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  notification_type text not null,
  title text not null,
  message text not null,
  case_id uuid references public.cases(id) on delete set null,
  source_id uuid references public.sources(id) on delete set null,
  read_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.webhooks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  endpoint_url text not null,
  event_types jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  secret_ref text,
  secret_fingerprint text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  webhook_id uuid not null references public.webhooks(id) on delete cascade,
  event_type text not null,
  status text not null default 'queued',
  attempt integer not null default 0,
  response_code integer,
  payload jsonb not null default '{}'::jsonb,
  headers jsonb not null default '{}'::jsonb,
  last_error text,
  next_attempt_at timestamptz,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.job_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  job_type text not null,
  status text not null default 'running',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  metrics jsonb not null default '{}'::jsonb,
  error_message text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists notifications_org_unread_idx on public.notifications(organization_id, read_at, created_at desc);
create index if not exists webhooks_org_active_idx on public.webhooks(organization_id, active, updated_at desc);
create index if not exists webhook_deliveries_org_status_idx on public.webhook_deliveries(organization_id, status, next_attempt_at, created_at);
create index if not exists webhook_deliveries_webhook_idx on public.webhook_deliveries(webhook_id, created_at desc);
create index if not exists job_runs_org_started_idx on public.job_runs(organization_id, started_at desc);

alter table public.notifications enable row level security;
alter table public.webhooks enable row level security;
alter table public.webhook_deliveries enable row level security;
alter table public.job_runs enable row level security;

drop policy if exists "members can read notifications" on public.notifications;
drop policy if exists "members can update notifications" on public.notifications;
drop policy if exists "members can read webhooks" on public.webhooks;
drop policy if exists "admins can insert webhooks" on public.webhooks;
drop policy if exists "admins can update webhooks" on public.webhooks;
drop policy if exists "members can read webhook deliveries" on public.webhook_deliveries;
drop policy if exists "analysts can insert webhook deliveries" on public.webhook_deliveries;
drop policy if exists "analysts can update webhook deliveries" on public.webhook_deliveries;
drop policy if exists "members can read job runs" on public.job_runs;
drop policy if exists "analysts can insert job runs" on public.job_runs;
drop policy if exists "analysts can update job runs" on public.job_runs;

create policy "members can read notifications" on public.notifications for select to authenticated using (organization_id = public.current_organization_id());
create policy "members can update notifications" on public.notifications for update to authenticated using (organization_id = public.current_organization_id()) with check (organization_id = public.current_organization_id());
create policy "members can read webhooks" on public.webhooks for select to authenticated using (organization_id = public.current_organization_id());
create policy "admins can insert webhooks" on public.webhooks for insert to authenticated with check (organization_id = public.current_organization_id() and public.current_app_role() = 'admin');
create policy "admins can update webhooks" on public.webhooks for update to authenticated using (organization_id = public.current_organization_id() and public.current_app_role() = 'admin') with check (organization_id = public.current_organization_id() and public.current_app_role() = 'admin');
create policy "members can read webhook deliveries" on public.webhook_deliveries for select to authenticated using (organization_id = public.current_organization_id());
create policy "analysts can insert webhook deliveries" on public.webhook_deliveries for insert to authenticated with check (organization_id = public.current_organization_id() and public.current_app_role() in ('admin', 'risk_analyst'));
create policy "analysts can update webhook deliveries" on public.webhook_deliveries for update to authenticated using (organization_id = public.current_organization_id() and public.current_app_role() in ('admin', 'risk_analyst')) with check (organization_id = public.current_organization_id() and public.current_app_role() in ('admin', 'risk_analyst'));
create policy "members can read job runs" on public.job_runs for select to authenticated using (organization_id = public.current_organization_id());
create policy "analysts can insert job runs" on public.job_runs for insert to authenticated with check (organization_id = public.current_organization_id() and public.current_app_role() in ('admin', 'risk_analyst'));
create policy "analysts can update job runs" on public.job_runs for update to authenticated using (organization_id = public.current_organization_id() and public.current_app_role() in ('admin', 'risk_analyst')) with check (organization_id = public.current_organization_id() and public.current_app_role() in ('admin', 'risk_analyst'));


