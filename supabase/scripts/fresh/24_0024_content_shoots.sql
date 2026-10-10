-- Fresh install step 24: 0024_content_shoots. Run in the Supabase SQL editor. One transaction: all or nothing.
begin;
-- ═══════════════════════════════════════════════════════════════════════════
-- Agency Zero — 0024: recurring content shoot schedules
--
-- A client on a content plan gets a shoot every week / every other week / the
-- Nth weekday of the month. A *schedule* is the recurring rule; a *shoot* is one
-- dated occurrence (with its own status, location, notes and checklist).
--
--   shoot_schedules — the rule (frequency, weekday, start time, duration,
--                     location, checklist template, active, start/end dates).
--   shoots          — occurrences. Unique per (schedule, date), so generating
--                     twice never creates duplicates.
--   generate_shoots()      — materialises occurrences up to a horizon
--                            (default 90 days, max 366). Idempotent. Explicit:
--                            nothing is generated on page render.
--   get_shoots_overview()  — one read model for the Shoots page and client tab.
--
-- Times are wall-clock (`shoot_date` + `start_time`, no time zone): a 10:00
-- shoot is 10:00 where the shoot is. Dates are plain `date`s.
-- ═══════════════════════════════════════════════════════════════════════════

create type public.shoot_frequency as enum ('weekly', 'biweekly', 'monthly');
create type public.shoot_status as enum ('planned', 'confirmed', 'shot', 'rescheduled', 'cancelled');

create table public.shoot_schedules (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  project_id uuid references public.projects (id) on delete set null,
  title text not null check (length(trim(title)) between 1 and 160),
  frequency public.shoot_frequency not null default 'monthly',
  weekday smallint not null check (weekday between 0 and 6),            -- 0 = Sunday
  week_of_month smallint check (week_of_month between 1 and 5),         -- 5 = last (monthly only)
  start_time time,
  duration_minutes integer not null default 120 check (duration_minutes between 15 and 1440),
  location text check (location is null or length(location) <= 300),
  checklist jsonb not null default '[]'::jsonb check (jsonb_typeof(checklist) = 'array'),
  notes text check (notes is null or length(notes) <= 2000),
  starts_on date not null default current_date,
  ends_on date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (frequency <> 'monthly' or week_of_month is not null),
  check (ends_on is null or ends_on >= starts_on)
);
create index shoot_schedules_client_idx on public.shoot_schedules (client_id, active);

create table public.shoots (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid references public.shoot_schedules (id) on delete set null,
  client_id uuid not null references public.clients (id) on delete restrict,
  project_id uuid references public.projects (id) on delete set null,
  title text not null check (length(trim(title)) between 1 and 160),
  shoot_date date not null,
  start_time time,
  duration_minutes integer not null default 120 check (duration_minutes between 15 and 1440),
  location text check (location is null or length(location) <= 300),
  status public.shoot_status not null default 'planned',
  checklist jsonb not null default '[]'::jsonb check (jsonb_typeof(checklist) = 'array'),
  notes text check (notes is null or length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index shoots_schedule_date_uidx on public.shoots (schedule_id, shoot_date) where schedule_id is not null;
create index shoots_date_idx on public.shoots (shoot_date, status);
create index shoots_client_idx on public.shoots (client_id, shoot_date);

alter table public.shoot_schedules enable row level security;
alter table public.shoots enable row level security;

create policy "Owner manages shoot schedules"
  on public.shoot_schedules for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create policy "Owner manages shoots"
  on public.shoots for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

create trigger shoot_schedules_set_updated_at
  before update on public.shoot_schedules
  for each row execute function public.set_updated_at();
create trigger shoots_set_updated_at
  before update on public.shoots
  for each row execute function public.set_updated_at();

grant select, insert, update, delete on public.shoot_schedules to authenticated;
grant select, insert, update, delete on public.shoots to authenticated;

-- ── generation ─────────────────────────────────────────────────────────────
-- Creates the schedule's occurrences from p_from (default today, never before the schedule starts)
-- through p_until (default +90 days; capped at +366 days and at ends_on). Returns how many were created.
-- p_reset first removes this schedule's FUTURE shoots that are still 'planned' (use after changing the rule);
-- confirmed / shot / cancelled shoots are never touched.
create or replace function public.generate_shoots(
  p_schedule_id uuid,
  p_until date default null,
  p_reset boolean default false,
  p_from date default null
)
returns integer
language plpgsql
security invoker
set search_path = public
as $f0024x1$
declare
  s public.shoot_schedules%rowtype;
  v_today date := coalesce(p_from, current_date);
  v_from date;
  v_until date;
  v_anchor date;
  v_day date;
  v_count integer := 0;
  v_rows integer;
  v_checklist jsonb;
begin
  select * into s from public.shoot_schedules where id = p_schedule_id;
  if not found then
    raise exception 'Schedule not found';
  end if;

  if p_reset then
    delete from public.shoots
    where schedule_id = s.id and status = 'planned' and shoot_date >= v_today;
  end if;
  if not s.active then
    return 0;
  end if;

  v_from := greatest(s.starts_on, v_today);
  v_until := least(coalesce(p_until, v_today + 90), v_today + 366, coalesce(s.ends_on, date '9999-12-31'));
  if v_until < v_from then
    return 0;
  end if;

  -- First date on/after starts_on that falls on the chosen weekday: the anchor for "every other week".
  v_anchor := s.starts_on + ((s.weekday - extract(dow from s.starts_on)::int + 7) % 7);

  select coalesce(jsonb_agg(jsonb_build_object('text', item, 'done', false)), '[]'::jsonb)
    into v_checklist
  from jsonb_array_elements_text(s.checklist) as item;

  for v_day in select g::date from generate_series(v_from, v_until, interval '1 day') as g loop
    continue when extract(dow from v_day)::int <> s.weekday;
    if s.frequency = 'biweekly' and ((v_day - v_anchor) / 7) % 2 <> 0 then
      continue;
    end if;
    if s.frequency = 'monthly' then
      if s.week_of_month = 5 then
        continue when extract(month from v_day + 7) = extract(month from v_day);   -- not the last one of the month
      else
        continue when ceil(extract(day from v_day) / 7.0)::int <> s.week_of_month;
      end if;
    end if;

    insert into public.shoots (schedule_id, client_id, project_id, title, shoot_date, start_time, duration_minutes, location, checklist, notes)
    values (s.id, s.client_id, s.project_id, s.title, v_day, s.start_time, s.duration_minutes, s.location, v_checklist, s.notes)
    on conflict (schedule_id, shoot_date) where schedule_id is not null do nothing;
    get diagnostics v_rows = row_count;
    v_count := v_count + v_rows;
  end loop;

  return v_count;
end;
$f0024x1$;

revoke execute on function public.generate_shoots(uuid, date, boolean, date) from public, anon;
grant execute on function public.generate_shoots(uuid, date, boolean, date) to authenticated;

-- ── atomic save ────────────────────────────────────────────────────────────
-- Create (p_id null) or update a schedule and (re)generate its upcoming shoots in ONE transaction.
-- On update, future shoots that are still 'planned' are rebuilt from the new rule; confirmed / shot / cancelled are kept.
-- Pausing (active = false) therefore also clears the upcoming planned shoots. Returns {id, created, shoots_created}.
create or replace function public.save_shoot_schedule(p_id uuid, p_data jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $f0024x2$
declare
  v_id uuid := p_id;
  v_created integer;
begin
  if p_id is null then
    insert into public.shoot_schedules (
      client_id, project_id, title, frequency, weekday, week_of_month, start_time, duration_minutes,
      location, checklist, notes, starts_on, ends_on, active
    ) values (
      (p_data ->> 'client_id')::uuid,
      nullif(p_data ->> 'project_id', '')::uuid,
      p_data ->> 'title',
      (p_data ->> 'frequency')::public.shoot_frequency,
      (p_data ->> 'weekday')::smallint,
      nullif(p_data ->> 'week_of_month', '')::smallint,
      nullif(p_data ->> 'start_time', '')::time,
      coalesce(nullif(p_data ->> 'duration_minutes', '')::integer, 120),
      nullif(p_data ->> 'location', ''),
      coalesce(p_data -> 'checklist', '[]'::jsonb),
      nullif(p_data ->> 'notes', ''),
      coalesce(nullif(p_data ->> 'starts_on', '')::date, current_date),
      nullif(p_data ->> 'ends_on', '')::date,
      coalesce((p_data ->> 'active')::boolean, true)
    ) returning id into v_id;
  else
    update public.shoot_schedules set
      client_id = (p_data ->> 'client_id')::uuid,
      project_id = nullif(p_data ->> 'project_id', '')::uuid,
      title = p_data ->> 'title',
      frequency = (p_data ->> 'frequency')::public.shoot_frequency,
      weekday = (p_data ->> 'weekday')::smallint,
      week_of_month = nullif(p_data ->> 'week_of_month', '')::smallint,
      start_time = nullif(p_data ->> 'start_time', '')::time,
      duration_minutes = coalesce(nullif(p_data ->> 'duration_minutes', '')::integer, 120),
      location = nullif(p_data ->> 'location', ''),
      checklist = coalesce(p_data -> 'checklist', '[]'::jsonb),
      notes = nullif(p_data ->> 'notes', ''),
      starts_on = coalesce(nullif(p_data ->> 'starts_on', '')::date, starts_on),
      ends_on = nullif(p_data ->> 'ends_on', '')::date,
      active = coalesce((p_data ->> 'active')::boolean, active)
    where id = p_id;
    if not found then
      raise exception 'Schedule not found';
    end if;
  end if;

  v_created := public.generate_shoots(v_id, null, p_id is not null);
  return jsonb_build_object('id', v_id, 'created', p_id is null, 'shoots_created', v_created);
end;
$f0024x2$;

revoke execute on function public.save_shoot_schedule(uuid, jsonb) from public, anon;
grant execute on function public.save_shoot_schedule(uuid, jsonb) to authenticated;

-- ── read model ─────────────────────────────────────────────────────────────
create or replace function public.get_shoots_overview(p_client_id uuid default null, p_today date default null)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $f0024x3$
  with params as (select coalesce(p_today, current_date) as today)
  select jsonb_build_object(
    'schedules', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'client_id', s.client_id, 'client_name', c.name, 'project_id', s.project_id,
        'title', s.title, 'frequency', s.frequency, 'weekday', s.weekday, 'week_of_month', s.week_of_month,
        'start_time', s.start_time, 'duration_minutes', s.duration_minutes, 'location', s.location,
        'checklist', s.checklist, 'notes', s.notes, 'starts_on', s.starts_on, 'ends_on', s.ends_on, 'active', s.active,
        'next_shoot', (select min(h.shoot_date) from public.shoots h, params p
                        where h.schedule_id = s.id and h.shoot_date >= p.today and h.status in ('planned', 'confirmed')),
        'generated_through', (select max(h.shoot_date) from public.shoots h where h.schedule_id = s.id)
      ) order by s.active desc, lower(c.name), s.title)
      from public.shoot_schedules s
      join public.clients c on c.id = s.client_id
      where p_client_id is null or s.client_id = p_client_id
    ), '[]'::jsonb),
    'upcoming', coalesce((
      select jsonb_agg(row_to_json(u)::jsonb order by u.shoot_date, u.start_time nulls last)
      from (
        select h.id, h.schedule_id, h.client_id, c.name as client_name, h.project_id, h.title, h.shoot_date, h.start_time,
               h.duration_minutes, h.location, h.status, h.checklist, h.notes
        from public.shoots h
        join public.clients c on c.id = h.client_id, params p
        where h.shoot_date >= p.today and h.status in ('planned', 'confirmed')
          and (p_client_id is null or h.client_id = p_client_id)
        order by h.shoot_date, h.start_time nulls last
        limit 150
      ) u
    ), '[]'::jsonb),
    'recent', coalesce((
      select jsonb_agg(row_to_json(r)::jsonb order by r.shoot_date desc)
      from (
        select h.id, h.client_id, c.name as client_name, h.title, h.shoot_date, h.start_time, h.location, h.status, h.notes
        from public.shoots h
        join public.clients c on c.id = h.client_id, params p
        where (h.shoot_date < p.today or h.status in ('shot', 'cancelled', 'rescheduled'))
          and (p_client_id is null or h.client_id = p_client_id)
        order by h.shoot_date desc
        limit 30
      ) r
    ), '[]'::jsonb),
    'client_options', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name) order by lower(c.name))
      from public.clients c where c.deleted_at is null and (p_client_id is null or c.id = p_client_id)
    ), '[]'::jsonb),
    'project_options', coalesce((
      select jsonb_agg(jsonb_build_object('id', pr.id, 'name', pr.name, 'client_id', pr.client_id) order by lower(pr.name))
      from public.projects pr where pr.deleted_at is null and (p_client_id is null or pr.client_id = p_client_id)
    ), '[]'::jsonb)
  );
$f0024x3$;

revoke execute on function public.get_shoots_overview(uuid, date) from public, anon;
grant execute on function public.get_shoots_overview(uuid, date) to authenticated;

commit;
