-- ═══════════════════════════════════════════════════════════════════════════
-- Agency Zero — 0003: projects (DATABASE_PLAN.md §4, MASTER_SPEC §4.2)
-- Milestones, time_entries, and profitability tables land with Phase 3/8.
-- Note: `currency` column added per convention D-012 (money = integer minor
-- units + currency field).
-- ═══════════════════════════════════════════════════════════════════════════

create type public.project_status as enum
  ('planning', 'active', 'on_hold', 'completed', 'cancelled');

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null,
  description text,
  status public.project_status not null default 'planning',
  value_cents integer check (value_cents >= 0),
  currency text not null default 'USD',
  estimated_minutes integer check (estimated_minutes >= 0),
  actual_minutes integer check (actual_minutes >= 0),
  starts_on date,
  deadline date,
  progress integer not null default 0 check (progress between 0 and 100),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.projects is
  'Agency projects; multiple per client. Durations in minutes (D-015).';

create index projects_client_id_idx on public.projects (client_id);
create index projects_status_idx on public.projects (status) where deleted_at is null;
create index projects_deadline_idx on public.projects (deadline) where deleted_at is null;

alter table public.projects enable row level security;

create policy "Owner manages projects"
  on public.projects
  for all
  to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();
