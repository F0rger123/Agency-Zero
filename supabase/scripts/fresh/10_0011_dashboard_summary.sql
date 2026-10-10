-- Fresh install step 10: 0011_dashboard_summary. Run in the Supabase SQL editor. One transaction: all or nothing.
begin;
-- ═══════════════════════════════════════════════════════════════════════════
-- Agency Zero — 0011: dashboard summary read model
--
-- The production dashboard previously fanned out to eleven PostgREST requests
-- (four `count=exact` aggregates plus seven embedded selects) on every render.
-- A single failing request threw inside the page and replaced the whole
-- dashboard with the generic error boundary ("check that Supabase is
-- reachable…"). This migration replaces that fan-out with ONE authenticated
-- read model: `public.get_dashboard_summary(p_today date)`.
--
-- The function is:
--   * `security invoker` — the owner-only RLS policies from 0001–0007 decide
--     what is visible; it cannot read anything the caller could not select.
--   * `stable` — safe for PostgREST read caching.
--   * null/empty tolerant — every aggregate is coalesced, every date
--     comparison ignores NULL dates, and every list returns `[]` on an empty
--     database (empty DB, no active projects, no recurring services, null
--     deadlines/due dates are all supported).
--
-- Contents: KPI counts (tasks due today, overdue, open tasks, active
-- projects, clients), waiting-on-client tasks, upcoming deadlines
-- (projects + milestones, next 30 days), recent activity, and the recurring
-- revenue block (MRR, ARR, recurring clients, recurring services, breakdown).
--
-- NUMBERING NOTE: see 0010 — `0009` is reserved for the production-only
-- out-of-band migration `0009_sync_client_ready_sales`.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.get_dashboard_summary(p_today date default null)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $f0011x1$
declare
  v_today date := coalesce(p_today, current_date);
  v_horizon date := coalesce(p_today, current_date) + 30;
  v_currency text := 'USD';
  v_clients integer := 0;
  v_active_clients integer := 0;
  v_active_projects integer := 0;
  v_due_today integer := 0;
  v_overdue integer := 0;
  v_open_tasks integer := 0;
  v_waiting integer := 0;
  v_mrr_cents bigint := 0;
  v_recurring_clients integer := 0;
  v_recurring_services integer := 0;
  v_waiting_tasks jsonb := '[]'::jsonb;
  v_deadlines jsonb := '[]'::jsonb;
  v_activity jsonb := '[]'::jsonb;
  v_breakdown jsonb := '[]'::jsonb;
begin
  -- Workspace currency (settings is a single row created by the sign-up trigger).
  select coalesce(s.default_currency, 'USD') into v_currency
  from public.settings s where s.id = 1;
  v_currency := coalesce(v_currency, 'USD');

  -- ── KPI counts ───────────────────────────────────────────────────────────
  select count(*) into v_clients
  from public.clients c
  where c.deleted_at is null;

  select count(*) into v_active_clients
  from public.clients c
  where c.deleted_at is null and c.status = 'active';

  select count(*) into v_active_projects
  from public.projects p
  where p.deleted_at is null and p.status = 'active';

  select count(*) into v_open_tasks
  from public.tasks t
  where t.status not in ('done', 'cancelled');

  select
    count(*) filter (where t.due_date = v_today),
    count(*) filter (where t.due_date is not null and t.due_date < v_today),
    count(*) filter (where t.status = 'blocked_waiting_client')
  into v_due_today, v_overdue, v_waiting
  from public.tasks t
  where t.status not in ('done', 'cancelled');

  -- ── Waiting on client (top 8, earliest due first, NULL dates last) ───────
  select coalesce(jsonb_agg(entry order by entry_date asc nulls last), '[]'::jsonb)
  into v_waiting_tasks
  from (
    select
      jsonb_build_object(
        'id', t.id,
        'title', t.title,
        'due_date', t.due_date,
        'client_id', t.client_id,
        'client_name', c.name,
        'project_id', t.project_id,
        'project_name', p.name,
        'href', '/tasks/' || t.id::text
      ) as entry,
      t.due_date as entry_date
    from public.tasks t
    left join public.clients c on c.id = t.client_id
    left join public.projects p on p.id = t.project_id
    where t.status = 'blocked_waiting_client'
    order by t.due_date asc nulls last, t.title
    limit 8
  ) rows;

  -- ── Upcoming deadlines: projects and milestones in the next 30 days ──────
  select coalesce(jsonb_agg(entry order by entry_date asc), '[]'::jsonb)
  into v_deadlines
  from (
    select
      jsonb_build_object(
        'id', 'project-' || p.id::text,
        'kind', 'project',
        'name', p.name,
        'date', p.deadline,
        'context', 'Project · ' || coalesce(c.name, 'No client'),
        'href', '/projects/' || p.id::text
      ) as entry,
      p.deadline as entry_date
    from public.projects p
    left join public.clients c on c.id = p.client_id
    where p.deleted_at is null
      and p.deadline is not null
      and p.deadline >= v_today
      and p.deadline <= v_horizon

    union all

    select
      jsonb_build_object(
        'id', 'milestone-' || m.id::text,
        'kind', 'milestone',
        'name', m.name,
        'date', m.due_date,
        'context', 'Milestone · ' || coalesce(p.name, 'Project'),
        'href', '/projects/' || m.project_id::text
      ) as entry,
      m.due_date as entry_date
    from public.milestones m
    join public.projects p on p.id = m.project_id
    where m.completed_at is null
      and m.due_date is not null
      and m.due_date >= v_today
      and m.due_date <= v_horizon

    order by entry_date asc
    limit 8
  ) rows;

  -- ── Recent activity: clients, projects, tasks, and logged communication ──
  select coalesce(jsonb_agg(entry order by entry_at desc), '[]'::jsonb)
  into v_activity
  from (
    select
      jsonb_build_object(
        'id', 'client-' || c.id::text,
        'label', 'Client added: ' || c.name,
        'context', coalesce(nullif(c.company, ''), c.status::text),
        'occurred_at', c.created_at,
        'href', '/clients/' || c.id::text
      ) as entry,
      c.created_at as entry_at
    from public.clients c
    where c.deleted_at is null

    union all

    select
      jsonb_build_object(
        'id', 'project-' || p.id::text,
        'label', 'Project added: ' || p.name,
        'context', coalesce(cl.name, 'No client'),
        'occurred_at', p.created_at,
        'href', '/projects/' || p.id::text
      ),
      p.created_at
    from public.projects p
    left join public.clients cl on cl.id = p.client_id
    where p.deleted_at is null

    union all

    select
      jsonb_build_object(
        'id', 'task-' || t.id::text,
        'label', 'Task updated: ' || t.title,
        'context', coalesce(pr.name, cl.name, 'Unassigned'),
        'occurred_at', t.updated_at,
        'href', '/tasks/' || t.id::text
      ),
      t.updated_at
    from public.tasks t
    left join public.projects pr on pr.id = t.project_id
    left join public.clients cl on cl.id = t.client_id

    union all

    select
      jsonb_build_object(
        'id', 'communication-' || co.id::text,
        'label', 'Client activity: ' || left(co.summary, 140),
        'context', coalesce(cl.name, 'Client'),
        'occurred_at', co.occurred_at,
        'href', '/clients/' || co.client_id::text
      ),
      co.occurred_at
    from public.communications co
    left join public.clients cl on cl.id = co.client_id

    order by entry_at desc
    limit 10
  ) rows;

  -- ── Recurring revenue ────────────────────────────────────────────────────
  -- Definition (D-033): not deleted, not archived, at least one recurring
  -- client_service assignment. Amounts are normalised to a monthly figure.
  select
    coalesce(sum(coalesce(
      public.normalized_monthly_cents(cs.amount_cents, cs.billing_interval),
      cs.monthly_amount_cents,
      0
    )), 0),
    count(distinct cs.client_id),
    count(distinct cs.service_id)
  into v_mrr_cents, v_recurring_clients, v_recurring_services
  from public.client_services cs
  join public.clients c on c.id = cs.client_id
  where cs.billing = 'recurring'
    and c.deleted_at is null
    and c.status <> 'archived';

  select coalesce(jsonb_agg(entry order by entry_mrr desc, entry_name asc), '[]'::jsonb)
  into v_breakdown
  from (
    select
      jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'clients', count(distinct cs.client_id),
        'assignments', count(*),
        'mrr_cents', coalesce(sum(coalesce(
          public.normalized_monthly_cents(cs.amount_cents, cs.billing_interval),
          cs.monthly_amount_cents,
          0
        )), 0),
        'intervals', coalesce(jsonb_agg(distinct cs.billing_interval), '[]'::jsonb),
        'service_active', s.active,
        'href', '/clients?billing=recurring&service=' || s.id::text
      ) as entry,
      coalesce(sum(coalesce(
        public.normalized_monthly_cents(cs.amount_cents, cs.billing_interval),
        cs.monthly_amount_cents,
        0
      )), 0) as entry_mrr,
      lower(s.name) as entry_name
    from public.client_services cs
    join public.clients c on c.id = cs.client_id
    join public.services s on s.id = cs.service_id
    where cs.billing = 'recurring'
      and c.deleted_at is null
      and c.status <> 'archived'
    group by s.id, s.name, s.active
  ) rows;

  return jsonb_build_object(
    'generated_on', v_today,
    'currency', v_currency,
    'tasks_due_today', v_due_today,
    'tasks_overdue', v_overdue,
    'tasks_open', v_open_tasks,
    'active_projects', v_active_projects,
    'clients', v_clients,
    'active_clients', v_active_clients,
    'waiting_on_client', v_waiting,
    'waiting_tasks', v_waiting_tasks,
    'upcoming_deadlines', v_deadlines,
    'recent_activity', v_activity,
    'recurring', jsonb_build_object(
      'mrr_cents', v_mrr_cents,
      'arr_cents', v_mrr_cents * 12,
      'recurring_client_count', v_recurring_clients,
      'recurring_service_count', v_recurring_services,
      'breakdown', v_breakdown
    )
  );
end;
$f0011x1$;

comment on function public.get_dashboard_summary(date) is
  'Single authenticated read model behind the dashboard: counts, waiting-on-client tasks, upcoming deadlines, recent activity, and recurring revenue.';

revoke execute on function public.get_dashboard_summary(date) from public, anon;
grant execute on function public.get_dashboard_summary(date) to authenticated;

commit;
