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
