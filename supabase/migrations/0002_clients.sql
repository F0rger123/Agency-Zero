-- ═══════════════════════════════════════════════════════════════════════════
-- Agency Zero — 0002: clients (DATABASE_PLAN.md §3, MASTER_SPEC §4.1)
-- The clients table only; contacts, notes, files, communications, and
-- client_services land with Phase 2 migrations.
-- ═══════════════════════════════════════════════════════════════════════════

create type public.client_status as enum ('lead', 'active', 'past', 'archived');

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status public.client_status not null default 'lead',
  company text,
  email text check (email is null or position('@' in email) > 1),
  phone text,
  website text,
  notes_summary text,
  source text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.clients is
  'Agency clients. Soft delete (deleted_at) preserves history for projects/invoices.';

create index clients_status_idx on public.clients (status) where deleted_at is null;

alter table public.clients enable row level security;

-- Private single-owner app: any authenticated user is the owner (D-003, D-014).
create policy "Owner manages clients"
  on public.clients
  for all
  to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();
