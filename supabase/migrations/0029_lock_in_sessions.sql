-- ═══════════════════════════════════════════════════════════════════════════
-- Agency Zero — 0029: Lock In sessions are saved to the database
--
-- Lock In is now a running timer (it counts up) with a checklist. Until now a session lived only in the browser, so
-- clearing site data, switching device or a browser crash could lose it. The app now also saves every session here
-- (on every change, every 30 seconds while it runs, and when it ends), and lists past sessions.
--   lock_in_sessions — one row per session; the id is created by the browser, so saving is an upsert and can be repeated
--                      safely. Owner-only (RLS).
-- Additive and reversible: `drop table public.lock_in_sessions;` (Lock In keeps working from the browser alone).
-- ═══════════════════════════════════════════════════════════════════════════

create table public.lock_in_sessions (
  id uuid primary key,
  started_at timestamptz not null,
  ended_at timestamptz,
  elapsed_seconds integer not null default 0 check (elapsed_seconds >= 0),
  goal_seconds integer check (goal_seconds is null or goal_seconds > 0),
  status text not null default 'running' check (status in ('running', 'paused', 'done')),
  items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array'),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index lock_in_sessions_started_idx on public.lock_in_sessions (started_at desc);

alter table public.lock_in_sessions enable row level security;
create policy "Owner manages lock in sessions"
  on public.lock_in_sessions for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create trigger lock_in_sessions_set_updated_at
  before update on public.lock_in_sessions
  for each row execute function public.set_updated_at();
grant select, insert, update, delete on public.lock_in_sessions to authenticated;
