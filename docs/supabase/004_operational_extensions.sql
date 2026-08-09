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
