-- ═══════════════════════════════════════════════════════════════════════════
-- Agency Zero — 0025: project phases and templates per service type
--
-- Phases are the ordered stages of a project (Discovery → Design → Build → QA → Launch). Tasks can belong to a
-- phase. A template is a reusable list of phases with starter tasks per service type; applying one to a project
-- creates its phases and tasks in one transaction.
--
--   project_phases     — ordered stages per project (upcoming / active / done)
--   tasks.phase_id     — optional link from a task to its phase
--   project_templates  — owner-editable templates (phases jsonb), seeded with one per service
--   apply_project_template() — atomic: phases + tasks, with due dates counted from a start date
--   move_project_phase()     — swap a phase with its neighbour (reorder)
--   get_project_phases()     — one read model for the Phases tab
-- ═══════════════════════════════════════════════════════════════════════════

create type public.phase_status as enum ('upcoming', 'active', 'done');

create table public.project_phases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 120),
  sort_order integer not null default 0,
  status public.phase_status not null default 'upcoming',
  starts_on date,
  due_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (due_on is null or starts_on is null or due_on >= starts_on)
);
create index project_phases_project_idx on public.project_phases (project_id, sort_order);

alter table public.tasks add column phase_id uuid references public.project_phases (id) on delete set null;
create index tasks_phase_idx on public.tasks (phase_id) where phase_id is not null;

create table public.project_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) between 1 and 120),
  service_kind text not null default 'other' check (service_kind in ('software', 'websites', 'seo', 'meta_ads', 'social', 'content', 'other')),
  description text check (description is null or length(description) <= 500),
  phases jsonb not null default '[]'::jsonb check (jsonb_typeof(phases) = 'array'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.project_phases enable row level security;
alter table public.project_templates enable row level security;

create policy "Owner manages project phases"
  on public.project_phases for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create policy "Owner manages project templates"
  on public.project_templates for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

create trigger project_phases_set_updated_at
  before update on public.project_phases
  for each row execute function public.set_updated_at();
create trigger project_templates_set_updated_at
  before update on public.project_templates
  for each row execute function public.set_updated_at();

grant select, insert, update, delete on public.project_phases to authenticated;
grant select, insert, update, delete on public.project_templates to authenticated;

-- Template format: [{"name": "Discovery", "tasks": [{"title": "Kickoff call", "priority": "high", "day": 0}]}]
-- `day` = days after the start date the task is due (optional).
create or replace function public.apply_project_template(p_project_id uuid, p_template_id uuid, p_start date default null)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_project public.projects%rowtype;
  v_template public.project_templates%rowtype;
  v_phase jsonb;
  v_task jsonb;
  v_phase_id uuid;
  v_order integer := 0;
  v_phases integer := 0;
  v_tasks integer := 0;
  v_priority text;
begin
  select * into v_project from public.projects where id = p_project_id and deleted_at is null;
  if not found then
    raise exception 'Project not found';
  end if;
  select * into v_template from public.project_templates where id = p_template_id and active;
  if not found then
    raise exception 'Template not found';
  end if;
  if exists (select 1 from public.project_phases where project_id = p_project_id) then
    raise exception 'This project already has phases';
  end if;
  if jsonb_array_length(v_template.phases) = 0 then
    raise exception 'That template has no phases';
  end if;

  for v_phase in select value from jsonb_array_elements(v_template.phases) loop
    insert into public.project_phases (project_id, name, sort_order, status)
    values (p_project_id, left(trim(v_phase ->> 'name'), 120), v_order, case when v_order = 0 then 'active'::public.phase_status else 'upcoming'::public.phase_status end)
    returning id into v_phase_id;
    v_order := v_order + 1;
    v_phases := v_phases + 1;

    for v_task in select value from jsonb_array_elements(coalesce(v_phase -> 'tasks', '[]'::jsonb)) loop
      v_priority := coalesce(v_task ->> 'priority', 'medium');
      if v_priority not in ('low', 'medium', 'high', 'urgent') then
        v_priority := 'medium';
      end if;
      insert into public.tasks (project_id, client_id, phase_id, title, priority, due_date)
      values (
        p_project_id, v_project.client_id, v_phase_id, left(trim(v_task ->> 'title'), 240), v_priority::public.task_priority,
        case when p_start is not null and (v_task ->> 'day') ~ '^\d{1,4}$' then p_start + (v_task ->> 'day')::integer else null end
      );
      v_tasks := v_tasks + 1;
    end loop;
  end loop;

  return jsonb_build_object('phases', v_phases, 'tasks', v_tasks);
end;
$$;

revoke execute on function public.apply_project_template(uuid, uuid, date) from public, anon;
grant execute on function public.apply_project_template(uuid, uuid, date) to authenticated;

-- Move a phase up (-1) or down (+1) by swapping sort_order with its neighbour.
create or replace function public.move_project_phase(p_phase_id uuid, p_direction integer)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_phase public.project_phases%rowtype;
  v_other public.project_phases%rowtype;
begin
  select * into v_phase from public.project_phases where id = p_phase_id;
  if not found then
    raise exception 'Phase not found';
  end if;
  if p_direction < 0 then
    select * into v_other from public.project_phases
    where project_id = v_phase.project_id and (sort_order, id::text) < (v_phase.sort_order, v_phase.id::text)
    order by sort_order desc, id::text desc limit 1;
  else
    select * into v_other from public.project_phases
    where project_id = v_phase.project_id and (sort_order, id::text) > (v_phase.sort_order, v_phase.id::text)
    order by sort_order, id::text limit 1;
  end if;
  if not found then
    return;
  end if;
  if v_other.sort_order = v_phase.sort_order then
    -- equal sort values: nudge so the swap is visible
    update public.project_phases set sort_order = v_phase.sort_order + (case when p_direction < 0 then -1 else 1 end) where id = v_phase.id;
  else
    update public.project_phases set sort_order = v_other.sort_order where id = v_phase.id;
    update public.project_phases set sort_order = v_phase.sort_order where id = v_other.id;
  end if;
end;
$$;

revoke execute on function public.move_project_phase(uuid, integer) from public, anon;
grant execute on function public.move_project_phase(uuid, integer) to authenticated;

create or replace function public.get_project_phases(p_project_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'phases', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ph.id, 'name', ph.name, 'sort_order', ph.sort_order, 'status', ph.status,
        'starts_on', ph.starts_on, 'due_on', ph.due_on,
        'total_tasks', (select count(*) from public.tasks t where t.phase_id = ph.id),
        'open_tasks', (select count(*) from public.tasks t where t.phase_id = ph.id and t.status not in ('done', 'cancelled'))
      ) order by ph.sort_order, ph.created_at)
      from public.project_phases ph where ph.project_id = p_project_id
    ), '[]'::jsonb),
    'task_phases', coalesce((
      select jsonb_agg(jsonb_build_object('id', t.id, 'phase_id', t.phase_id))
      from public.tasks t where t.project_id = p_project_id and t.phase_id is not null
    ), '[]'::jsonb),
    'templates', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', pt.id, 'name', pt.name, 'service_kind', pt.service_kind, 'description', pt.description,
        'phase_count', jsonb_array_length(pt.phases),
        'task_count', (select coalesce(sum(jsonb_array_length(coalesce(p -> 'tasks', '[]'::jsonb))), 0) from jsonb_array_elements(pt.phases) p)
      ) order by pt.service_kind, pt.name)
      from public.project_templates pt where pt.active
    ), '[]'::jsonb)
  );
$$;

revoke execute on function public.get_project_phases(uuid) from public, anon;
grant execute on function public.get_project_phases(uuid) to authenticated;

-- Default templates (editable in the app).
insert into public.project_templates (name, service_kind, description, phases) values
  ('Software build', 'software', 'Custom software, CRM or internal tool: discovery to launch.', '[{"name": "Discovery", "tasks": [{"title": "Kickoff call and goals", "priority": "high", "day": 0}, {"title": "Map the current workflow", "priority": "medium", "day": 3}, {"title": "Agree scope and success measures", "priority": "high", "day": 7}]}, {"name": "Design", "tasks": [{"title": "Data model and key screens", "priority": "medium", "day": 14}, {"title": "Client review of designs", "priority": "high", "day": 18}]}, {"name": "Build", "tasks": [{"title": "Core build: first usable slice", "priority": "medium", "day": 35}, {"title": "Integrations (payments, email, calendar)", "priority": "medium", "day": 45}, {"title": "Automations", "priority": "medium", "day": 55}]}, {"name": "QA & fixes", "tasks": [{"title": "Test every workflow end to end", "priority": "high", "day": 62}, {"title": "Fix bugs from testing", "priority": "medium", "day": 66}, {"title": "Security and permissions check", "priority": "medium", "day": 68}]}, {"name": "Launch & handover", "tasks": [{"title": "Migrate data", "priority": "medium", "day": 72}, {"title": "Train the team", "priority": "medium", "day": 75}, {"title": "Go live and monitor", "priority": "high", "day": 77}, {"title": "Handover notes and support plan", "priority": "medium", "day": 80}]}]'::jsonb),
  ('Website build', 'websites', 'A custom website from first call to launch.', '[{"name": "Discovery & content", "tasks": [{"title": "Kickoff call and goals", "priority": "high", "day": 0}, {"title": "Collect logo, brand and photos", "priority": "medium", "day": 5}, {"title": "Write or approve page copy", "priority": "medium", "day": 10}]}, {"name": "Design", "tasks": [{"title": "Homepage design", "priority": "high", "day": 14}, {"title": "Inner page designs", "priority": "medium", "day": 21}, {"title": "Client design approval", "priority": "high", "day": 25}]}, {"name": "Build", "tasks": [{"title": "Build pages", "priority": "medium", "day": 35}, {"title": "Forms, tracking and SEO basics", "priority": "medium", "day": 40}, {"title": "Mobile and speed checks", "priority": "medium", "day": 43}]}, {"name": "Review & revisions", "tasks": [{"title": "Client review round", "priority": "high", "day": 47}, {"title": "Revisions", "priority": "medium", "day": 52}]}, {"name": "Launch", "tasks": [{"title": "Domain, hosting and redirects", "priority": "medium", "day": 55}, {"title": "Go live", "priority": "high", "day": 57}, {"title": "Post-launch check and handover", "priority": "medium", "day": 62}]}]'::jsonb),
  ('SEO retainer', 'seo', 'Monthly SEO: audit, fix, publish, report.', '[{"name": "Audit", "tasks": [{"title": "Technical audit", "priority": "high", "day": 0}, {"title": "Keyword and competitor research", "priority": "medium", "day": 5}, {"title": "Google Business Profile review", "priority": "medium", "day": 7}]}, {"name": "Fix foundations", "tasks": [{"title": "Fix technical issues", "priority": "medium", "day": 14}, {"title": "Titles, descriptions and headings", "priority": "medium", "day": 18}, {"title": "Local listings and citations", "priority": "medium", "day": 24}]}, {"name": "Publish & optimize", "tasks": [{"title": "Publish priority pages and content", "priority": "medium", "day": 35}, {"title": "Internal links and schema", "priority": "medium", "day": 40}]}, {"name": "Monthly reporting", "tasks": [{"title": "Report: what changed and why", "priority": "high", "day": 60}, {"title": "Plan next month", "priority": "medium", "day": 62}]}]'::jsonb),
  ('Meta ads campaign', 'meta_ads', 'Facebook and Instagram ads: set up, launch, optimize.', '[{"name": "Strategy & tracking", "tasks": [{"title": "Goals, budget and offer", "priority": "high", "day": 0}, {"title": "Pixel and conversion tracking", "priority": "high", "day": 4}, {"title": "Audience plan", "priority": "medium", "day": 6}]}, {"name": "Creative", "tasks": [{"title": "Ad creative: images and video", "priority": "medium", "day": 12}, {"title": "Ad copy and landing page", "priority": "medium", "day": 14}, {"title": "Client approval", "priority": "high", "day": 17}]}, {"name": "Launch", "tasks": [{"title": "Build campaign and ad sets", "priority": "medium", "day": 19}, {"title": "Go live", "priority": "high", "day": 21}]}, {"name": "Optimize", "tasks": [{"title": "Review results at day 7", "priority": "medium", "day": 28}, {"title": "Pause losers, scale winners", "priority": "medium", "day": 35}]}, {"name": "Report", "tasks": [{"title": "Monthly results report", "priority": "high", "day": 50}]}]'::jsonb),
  ('Social media month', 'social', 'One month of social media management.', '[{"name": "Strategy", "tasks": [{"title": "Content pillars and tone", "priority": "medium", "day": 0}, {"title": "Posting calendar", "priority": "high", "day": 3}]}, {"name": "Content batch", "tasks": [{"title": "Write captions", "priority": "medium", "day": 7}, {"title": "Create graphics and clips", "priority": "medium", "day": 10}, {"title": "Client approval", "priority": "high", "day": 13}]}, {"name": "Schedule & post", "tasks": [{"title": "Schedule posts", "priority": "medium", "day": 15}, {"title": "Reply to comments and messages", "priority": "medium", "day": 30}]}, {"name": "Report", "tasks": [{"title": "Monthly social report", "priority": "high", "day": 30}]}]'::jsonb),
  ('Video content package', 'content', 'Short-form video from planning to delivery.', '[{"name": "Pre-production", "tasks": [{"title": "Concepts and shot list", "priority": "high", "day": 0}, {"title": "Book shoot date and location", "priority": "medium", "day": 3}, {"title": "Confirm props and release forms", "priority": "medium", "day": 6}]}, {"name": "Shoot", "tasks": [{"title": "Shoot day", "priority": "high", "day": 10}]}, {"name": "Edit", "tasks": [{"title": "First cut", "priority": "medium", "day": 14}, {"title": "Captions, music and branding", "priority": "medium", "day": 16}]}, {"name": "Approval & delivery", "tasks": [{"title": "Client review", "priority": "high", "day": 18}, {"title": "Revisions", "priority": "medium", "day": 21}, {"title": "Deliver final files and schedule posting", "priority": "medium", "day": 23}]}]'::jsonb)
on conflict (name) do nothing;
