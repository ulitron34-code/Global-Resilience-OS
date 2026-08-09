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
