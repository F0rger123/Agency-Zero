-- Agency Zero — 0007: planning, calendar, workload, reminders
-- MASTER_SPEC §§4.4, 4.5, 4.13. Google Calendar remains deferred.

create type public.calendar_event_type as enum ('meeting', 'work_block', 'other');
create type public.reminder_kind as enum (
  'task_due_soon', 'task_overdue', 'client_no_response',
  'quote_awaiting_response', 'contract_unsigned', 'invoice_due',
  'invoice_overdue', 'project_deadline_approaching', 'schedule_overloaded', 'custom'
);

alter table public.tasks add column scheduled_date date;
create index tasks_scheduled_date_idx on public.tasks (scheduled_date) where scheduled_date is not null;

create table public.workday_capacity (
  date date primary key,
  available_minutes integer not null check (available_minutes >= 0 and available_minutes <= 1440),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.weekly_capacity (
  weekday smallint primary key check (weekday between 0 and 6),
  available_minutes integer not null check (available_minutes >= 0 and available_minutes <= 1440),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  type public.calendar_event_type not null default 'meeting',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  client_id uuid references public.clients (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  task_id uuid references public.tasks (id) on delete set null,
  notes text,
  external_id text,
  provider text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index calendar_events_starts_at_idx on public.calendar_events (starts_at, ends_at);
create index calendar_events_task_id_idx on public.calendar_events (task_id);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  kind public.reminder_kind not null default 'custom',
  subject_type text,
  subject_id uuid,
  due_at timestamptz not null,
  done boolean not null default false,
  message text not null check (length(trim(message)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reminders_due_idx on public.reminders (done, due_at);
create index reminders_subject_idx on public.reminders (subject_type, subject_id);

create trigger workday_capacity_set_updated_at before update on public.workday_capacity for each row execute function public.set_updated_at();
create trigger weekly_capacity_set_updated_at before update on public.weekly_capacity for each row execute function public.set_updated_at();
create trigger calendar_events_set_updated_at before update on public.calendar_events for each row execute function public.set_updated_at();
create trigger reminders_set_updated_at before update on public.reminders for each row execute function public.set_updated_at();

alter table public.workday_capacity enable row level security;
alter table public.weekly_capacity enable row level security;
alter table public.calendar_events enable row level security;
alter table public.reminders enable row level security;

create policy "Owner manages workday capacity" on public.workday_capacity for all to authenticated
  using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);
create policy "Owner manages weekly capacity" on public.weekly_capacity for all to authenticated
  using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);
create policy "Owner manages calendar events" on public.calendar_events for all to authenticated
  using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);
create policy "Owner manages reminders" on public.reminders for all to authenticated
  using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);
