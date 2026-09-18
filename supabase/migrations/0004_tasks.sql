-- ═══════════════════════════════════════════════════════════════════════════
-- Agency Zero — 0004: tasks (DATABASE_PLAN.md §4, MASTER_SPEC §4.3)
-- Subtasks via parent_task_id; simple dependency chain via depends_on_task_id.
-- Deferred to Phase 3 migrations: milestone_id (needs milestones table),
-- task_dependencies (many-to-many), recurring_tasks, time_entries.
-- ═══════════════════════════════════════════════════════════════════════════

create type public.task_status as enum
  ('todo', 'in_progress', 'blocked_waiting_client', 'blocked_other', 'done', 'cancelled');

create type public.task_priority as enum ('low', 'medium', 'high', 'urgent');

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects (id) on delete cascade,
  parent_task_id uuid references public.tasks (id) on delete cascade,
  title text not null,
  description text,
  status public.task_status not null default 'todo',
  priority public.task_priority not null default 'medium',
  due_date date,
  estimated_minutes integer check (estimated_minutes >= 0),
  actual_minutes integer check (actual_minutes >= 0),
  depends_on_task_id uuid references public.tasks (id) on delete set null,
  recurrence_rule jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.tasks is
  'Tasks and subtasks. blocked_waiting_client implements "waiting on client" (MASTER_SPEC §4.3).';

create index tasks_project_id_idx on public.tasks (project_id);
create index tasks_parent_task_id_idx on public.tasks (parent_task_id);
create index tasks_status_idx on public.tasks (status);
create index tasks_due_date_idx on public.tasks (due_date);

alter table public.tasks enable row level security;

create policy "Owner manages tasks"
  on public.tasks
  for all
  to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();
