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
