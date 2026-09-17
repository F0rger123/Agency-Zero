-- Agency Zero — 0005: CRM core (clients, projects, and tasks)
-- MASTER_SPEC §§4.1–4.3. This migration completes the Phase 2/3 data model.
-- All durations remain integer minutes (D-015). All internal tables use the
-- owner-only authenticated RLS pattern (D-014).

-- ── Service catalogue and client relationships ─────────────────────────────
create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  default_billing text not null default 'one_off'
    check (default_billing in ('one_off', 'recurring')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.services (name, default_billing)
values
  ('Software development', 'one_off'),
  ('Custom CRMs and software', 'one_off'),
  ('Websites', 'one_off'),
  ('SEO', 'recurring'),
  ('Meta ads', 'recurring'),
  ('Social media management', 'recurring'),
  ('Social video creation', 'one_off')
on conflict (name) do nothing;

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null,
  role text,
  email text check (email is null or position('@' in email) > 1),
  phone text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index contacts_client_id_idx on public.contacts (client_id);

create table public.client_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  body text not null check (length(trim(body)) > 0),
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index client_notes_client_id_idx on public.client_notes (client_id);

create table public.client_files (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  file_name text not null,
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint check (size_bytes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index client_files_client_id_idx on public.client_files (client_id);

create type public.comm_channel as enum ('call', 'email', 'meeting', 'message', 'other');

create table public.communications (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  contact_id uuid references public.contacts (id) on delete set null,
  channel public.comm_channel not null default 'other',
  direction text not null default 'out' check (direction in ('in', 'out')),
  summary text not null check (length(trim(summary)) > 0),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index communications_client_occurred_idx
  on public.communications (client_id, occurred_at desc);

create table public.client_services (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete restrict,
  billing text not null default 'one_off'
    check (billing in ('one_off', 'recurring')),
  monthly_amount_cents integer check (monthly_amount_cents is null or monthly_amount_cents >= 0),
  started_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, service_id)
);

create index client_services_client_id_idx on public.client_services (client_id);

-- ── Projects and task extensions ───────────────────────────────────────────
create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  due_date date,
  completed_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index milestones_project_id_idx on public.milestones (project_id, sort_order, due_date);

alter table public.tasks
  add column client_id uuid references public.clients (id) on delete set null,
  add column milestone_id uuid references public.milestones (id) on delete set null;

create index tasks_client_id_idx on public.tasks (client_id);
create index tasks_milestone_id_idx on public.tasks (milestone_id);

create table public.task_dependencies (
  task_id uuid not null references public.tasks (id) on delete cascade,
  depends_on_task_id uuid not null references public.tasks (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (task_id, depends_on_task_id),
  check (task_id <> depends_on_task_id)
);

create table public.recurring_tasks (
  id uuid primary key default gen_random_uuid(),
  template jsonb not null default '{}'::jsonb,
  recurrence_rule text not null,
  next_run date not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.time_entries (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  minutes integer not null check (minutes > 0),
  worked_on date not null default current_date,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (task_id is not null or project_id is not null)
);

create index time_entries_task_id_idx on public.time_entries (task_id);
create index time_entries_project_id_idx on public.time_entries (project_id);

-- ── updated_at triggers ────────────────────────────────────────────────────
create trigger services_set_updated_at
  before update on public.services for each row execute function public.set_updated_at();
create trigger contacts_set_updated_at
  before update on public.contacts for each row execute function public.set_updated_at();
create trigger client_notes_set_updated_at
  before update on public.client_notes for each row execute function public.set_updated_at();
create trigger client_files_set_updated_at
  before update on public.client_files for each row execute function public.set_updated_at();
create trigger communications_set_updated_at
  before update on public.communications for each row execute function public.set_updated_at();
create trigger client_services_set_updated_at
  before update on public.client_services for each row execute function public.set_updated_at();
create trigger milestones_set_updated_at
  before update on public.milestones for each row execute function public.set_updated_at();
create trigger recurring_tasks_set_updated_at
  before update on public.recurring_tasks for each row execute function public.set_updated_at();
create trigger time_entries_set_updated_at
  before update on public.time_entries for each row execute function public.set_updated_at();

-- ── RLS: every internal table is owner-only ────────────────────────────────
alter table public.services enable row level security;
alter table public.contacts enable row level security;
alter table public.client_notes enable row level security;
alter table public.client_files enable row level security;
alter table public.communications enable row level security;
alter table public.client_services enable row level security;
alter table public.milestones enable row level security;
alter table public.task_dependencies enable row level security;
alter table public.recurring_tasks enable row level security;
alter table public.time_entries enable row level security;

create policy "Owner manages services" on public.services for all to authenticated
  using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);
create policy "Owner manages contacts" on public.contacts for all to authenticated
  using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);
create policy "Owner manages client notes" on public.client_notes for all to authenticated
  using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);
create policy "Owner manages client files" on public.client_files for all to authenticated
  using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);
create policy "Owner manages communications" on public.communications for all to authenticated
  using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);
create policy "Owner manages client services" on public.client_services for all to authenticated
  using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);
create policy "Owner manages milestones" on public.milestones for all to authenticated
  using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);
create policy "Owner manages task dependencies" on public.task_dependencies for all to authenticated
  using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);
create policy "Owner manages recurring tasks" on public.recurring_tasks for all to authenticated
  using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);
create policy "Owner manages time entries" on public.time_entries for all to authenticated
  using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);

-- ── Supabase Storage: private client-files bucket ──────────────────────────
-- The UI still reports a setup error if an existing project has not applied
-- this section. Files are never public; the app uses authenticated access.
insert into storage.buckets (id, name, public)
values ('client-files', 'client-files', false)
on conflict (id) do nothing;

create policy "Owner reads client files"
  on storage.objects for select to authenticated
  using (bucket_id = 'client-files');
create policy "Owner uploads client files"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'client-files');
create policy "Owner updates client files"
  on storage.objects for update to authenticated
  using (bucket_id = 'client-files') with check (bucket_id = 'client-files');
create policy "Owner deletes client files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'client-files');
