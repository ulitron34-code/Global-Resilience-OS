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
