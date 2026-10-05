-- ═══════════════════════════════════════════════════════════════════════════
-- Agency Zero — 0023: unified work items (tasks, bugs, feature requests)
--
-- One table, three kinds. Bugs and feature requests are `tasks` rows with a
-- `kind`, so they inherit status, priority, due date, time tracking, milestones
-- and calendar scheduling for free. Bug-only fields: `severity`. Both new kinds:
-- `requester_contact_id` (who asked), `source` (where it came from) and
-- `resolution` (what was done / why declined). Existing rows become kind 'task'.
--
-- Status vocabulary is shared (todo / in_progress / blocked_* / done / cancelled);
-- the UI labels it per kind (bug: Open → Fixed / Won't fix; feature: Requested →
-- Shipped / Declined).
--
-- `get_project_work_items()` is a separate read model (rather than patching
-- get_project_workspace) so a production database that has drifted from the repo
-- cannot make this migration fail.
-- ═══════════════════════════════════════════════════════════════════════════

create type public.work_item_kind as enum ('task', 'bug', 'feature_request');
create type public.bug_severity as enum ('low', 'medium', 'high', 'critical');

alter table public.tasks
  add column kind public.work_item_kind not null default 'task',
  add column severity public.bug_severity,
  add column requester_contact_id uuid references public.contacts (id) on delete set null,
  add column source text not null default 'internal',
  add column resolution text;

alter table public.tasks
  add constraint tasks_source_check check (source in ('internal', 'client', 'website', 'message', 'other')),
  add constraint tasks_resolution_length check (resolution is null or length(resolution) <= 2000),
  add constraint tasks_severity_only_for_bugs check (severity is null or kind = 'bug');

create index tasks_kind_status_idx on public.tasks (kind, status);
create index tasks_requester_idx on public.tasks (requester_contact_id) where requester_contact_id is not null;

comment on column public.tasks.kind is 'task | bug | feature_request (unified work items).';

create or replace function public.get_project_work_items(p_project_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'items', coalesce((
      select jsonb_agg(row_to_json(w)::jsonb order by w.open_rank, w.severity_rank, w.due_date nulls last, w.created_at desc)
      from (
        select
          t.id, t.kind, t.title, t.description, t.status, t.priority, t.severity,
          t.due_date, t.source, t.resolution, t.requester_contact_id,
          c.name as requester_name, t.milestone_id, t.created_at, t.updated_at,
          t.scheduled_date, t.estimated_minutes, t.actual_minutes, t.parent_task_id, t.depends_on_task_id, t.recurrence_rule,
          '/tasks/' || t.id::text as href,
          case when t.status in ('done', 'cancelled') then 1 else 0 end as open_rank,
          case t.severity when 'critical' then 0 when 'high' then 1 when 'medium' then 2 when 'low' then 3 else 4 end as severity_rank
        from public.tasks t
        left join public.contacts c on c.id = t.requester_contact_id
        where t.project_id = p_project_id and t.kind <> 'task'
        order by open_rank, severity_rank, t.due_date nulls last, t.created_at desc
        limit 300
      ) w
    ), '[]'::jsonb),
    'open_bugs', (select count(*) from public.tasks t where t.project_id = p_project_id and t.kind = 'bug' and t.status not in ('done', 'cancelled')),
    'open_critical', (select count(*) from public.tasks t where t.project_id = p_project_id and t.kind = 'bug' and t.severity = 'critical' and t.status not in ('done', 'cancelled')),
    'open_feature_requests', (select count(*) from public.tasks t where t.project_id = p_project_id and t.kind = 'feature_request' and t.status not in ('done', 'cancelled')),
    'contacts', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'role', c.role) order by c.is_primary desc, c.name)
      from public.contacts c
      join public.projects p on p.client_id = c.client_id
      where p.id = p_project_id
    ), '[]'::jsonb)
  );
$$;

revoke execute on function public.get_project_work_items(uuid) from public, anon;
grant execute on function public.get_project_work_items(uuid) to authenticated;
