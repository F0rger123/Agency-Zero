-- Fresh install step 12: 0013_project_workspace. Run in the Supabase SQL editor. One transaction: all or nothing.
begin;
-- ═══════════════════════════════════════════════════════════════════════════
-- Agency Zero — 0013: project workspace (notes, files, one-round-trip read model)
--
-- A project is meant to be manageable almost entirely from inside the
-- project, so this migration adds the two missing record types plus a single
-- read model for the tabbed workspace:
--
--   A. `project_notes` — persistent project context (same shape as
--      `client_notes`, scoped to the project).
--   B. `project_files` — private file metadata for the project. Bytes live in
--      the existing private `client-files` Storage bucket under a
--      `projects/<project_id>/…` prefix, so the bucket policies from 0005
--      apply unchanged and the workspace uses expiring signed URLs (D-021).
--   C. `public.get_project_workspace(p_project_id uuid)` — project, client,
--      tasks (+subtask links), milestones, time entries, notes, files, linked
--      quotes/contracts/invoices/payments, recurring services, financial
--      totals, and recent activity in one round trip. Returns NULL for an
--      unknown project so the page can `notFound()`.
--
-- Both new tables follow the D-014 pattern: RLS enabled, single owner policy,
-- `set_updated_at()` trigger (search_path already pinned in 0008).
--
-- NUMBERING NOTE: see 0010 — `0009` is reserved for the production-only
-- out-of-band migration `0009_sync_client_ready_sales`.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── A. project notes ───────────────────────────────────────────────────────
create table if not exists public.project_notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  body text not null check (length(trim(body)) > 0),
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_notes_project_id_idx
  on public.project_notes (project_id);

comment on table public.project_notes is
  'Persistent project notes, managed inside the project workspace.';

alter table public.project_notes enable row level security;

do $f0013x1$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_notes' and policyname = 'Owner manages project notes') then
    create policy "Owner manages project notes"
      on public.project_notes for all to authenticated
      using ((select auth.uid()) is not null)
      with check ((select auth.uid()) is not null);
  end if;
end
$f0013x1$;

do $f0013x2$
begin
  if not exists (select 1 from pg_trigger where tgname = 'project_notes_set_updated_at') then
    create trigger project_notes_set_updated_at
      before update on public.project_notes
      for each row execute function public.set_updated_at();
  end if;
end
$f0013x2$;

-- ── B. project files ───────────────────────────────────────────────────────
create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  file_name text not null,
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_files_project_id_idx
  on public.project_files (project_id);

comment on table public.project_files is
  'Private project files. Bytes live in the client-files Storage bucket under projects/<project_id>/… (D-021).';

alter table public.project_files enable row level security;

do $f0013x3$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_files' and policyname = 'Owner manages project files') then
    create policy "Owner manages project files"
      on public.project_files for all to authenticated
      using ((select auth.uid()) is not null)
      with check ((select auth.uid()) is not null);
  end if;
end
$f0013x3$;

do $f0013x4$
begin
  if not exists (select 1 from pg_trigger where tgname = 'project_files_set_updated_at') then
    create trigger project_files_set_updated_at
      before update on public.project_files
      for each row execute function public.set_updated_at();
  end if;
end
$f0013x4$;

-- ── C. Project workspace read model ────────────────────────────────────────
create or replace function public.get_project_workspace(p_project_id uuid)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $f0013x5$
declare
  v_project public.projects%rowtype;
  v_client_id uuid;
begin
  select * into v_project from public.projects p where p.id = p_project_id;
  if not found then
    return null;
  end if;
  v_client_id := v_project.client_id;

  return jsonb_build_object(
    'project', to_jsonb(v_project),
    'client', (
      select jsonb_build_object(
        'id', c.id, 'name', c.name, 'company', c.company, 'status', c.status,
        'email', c.email, 'phone', c.phone,
        'href', '/clients/' || c.id::text
      )
      from public.clients c where c.id = v_client_id
    ),
    'totals', jsonb_build_object(
      'actual_minutes', coalesce((
        select sum(te.minutes) from public.time_entries te where te.project_id = p_project_id
      ), 0),
      'estimated_minutes', v_project.estimated_minutes,
      'open_tasks', (
        select count(*) from public.tasks t
        where t.project_id = p_project_id and t.status not in ('done', 'cancelled')
      ),
      'done_tasks', (
        select count(*) from public.tasks t
        where t.project_id = p_project_id and t.status = 'done'
      ),
      'milestones', (
        select count(*) from public.milestones m where m.project_id = p_project_id
      ),
      'milestones_done', (
        select count(*) from public.milestones m
        where m.project_id = p_project_id and m.completed_at is not null
      ),
      'invoiced_cents', (
        select coalesce(sum(i.total_cents), 0)
        from public.invoices i
        where i.project_id = p_project_id and i.status <> 'void'
      ),
      'paid_cents', (
        select coalesce(sum(i.paid_cents), 0)
        from public.invoices i
        where i.project_id = p_project_id
      ),
      'outstanding_cents', (
        select coalesce(sum(i.balance_cents), 0)
        from public.invoices i
        where i.project_id = p_project_id and i.status not in ('paid', 'void')
      ),
      'client_mrr_cents', (
        select coalesce(sum(coalesce(
          public.normalized_monthly_cents(cs.amount_cents, cs.billing_interval),
          cs.monthly_amount_cents,
          0
        )), 0)
        from public.client_services cs
        where cs.client_id = v_client_id and cs.billing = 'recurring'
      )
    ),
    'client_options', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'name', c.name, 'company', c.company
      ) order by lower(c.name))
      from public.clients c where c.deleted_at is null
    ), '[]'::jsonb),
    'tasks', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id, 'title', t.title, 'description', t.description,
        'status', t.status, 'priority', t.priority, 'due_date', t.due_date,
        'scheduled_date', t.scheduled_date, 'estimated_minutes', t.estimated_minutes,
        'actual_minutes', t.actual_minutes, 'milestone_id', t.milestone_id,
        'milestone_name', m.name,
        'parent_task_id', t.parent_task_id, 'parent_title', parent.title,
        'depends_on_task_id', t.depends_on_task_id,
        'recurrence_rule', t.recurrence_rule,
        'updated_at', t.updated_at,
        'href', '/tasks/' || t.id::text
      ) order by t.due_date asc nulls last, t.title)
      from public.tasks t
      left join public.milestones m on m.id = t.milestone_id
      left join public.tasks parent on parent.id = t.parent_task_id
      where t.project_id = p_project_id
    ), '[]'::jsonb),
    'milestones', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id, 'name', m.name, 'due_date', m.due_date,
        'completed_at', m.completed_at, 'sort_order', m.sort_order,
        'open_tasks', (
          select count(*) from public.tasks t
          where t.milestone_id = m.id and t.status not in ('done', 'cancelled')
        ),
        'total_tasks', (
          select count(*) from public.tasks t where t.milestone_id = m.id
        )
      ) order by m.sort_order, m.due_date asc nulls last, m.name)
      from public.milestones m where m.project_id = p_project_id
    ), '[]'::jsonb),
    'time_entries', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', te.id, 'minutes', te.minutes, 'worked_on', te.worked_on,
        'note', te.note, 'task_id', te.task_id, 'task_title', t.title,
        'created_at', te.created_at
      ) order by te.worked_on desc, te.created_at desc)
      from public.time_entries te
      left join public.tasks t on t.id = te.task_id
      where te.project_id = p_project_id
    ), '[]'::jsonb),
    'notes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', n.id, 'body', n.body, 'pinned', n.pinned, 'created_at', n.created_at
      ) order by n.pinned desc, n.created_at desc)
      from public.project_notes n where n.project_id = p_project_id
    ), '[]'::jsonb),
    'files', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', f.id, 'file_name', f.file_name, 'storage_path', f.storage_path,
        'mime_type', f.mime_type, 'size_bytes', f.size_bytes, 'created_at', f.created_at
      ) order by f.created_at desc)
      from public.project_files f where f.project_id = p_project_id
    ), '[]'::jsonb),
    'quotes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', q.id, 'number', q.number, 'title', q.title, 'status', q.status,
        'total_cents', q.total_cents, 'currency', q.currency,
        'issued_on', q.issued_on, 'accepted_at', q.accepted_at,
        'linked', (q.converted_project_id = p_project_id),
        'href', '/quotes/' || q.id::text
      ) order by q.issued_on desc)
      from public.quotes q where q.client_id = v_client_id
    ), '[]'::jsonb),
    'contracts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', k.id, 'title', k.title, 'status', k.status, 'version', k.version,
        'signed_at', k.signed_at, 'quote_id', k.quote_id,
        'linked', (k.project_id = p_project_id),
        'href', '/contracts/' || k.id::text
      ) order by k.created_at desc)
      from public.contracts k
      where k.client_id = v_client_id
        and (
          k.project_id = p_project_id
          or k.quote_id in (select q.id from public.quotes q where q.converted_project_id = p_project_id)
        )
    ), '[]'::jsonb),
    'invoices', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id, 'number', i.number, 'title', i.title, 'status', i.status,
        'issued_on', i.issued_on, 'due_on', i.due_on, 'currency', i.currency,
        'total_cents', i.total_cents, 'paid_cents', i.paid_cents,
        'balance_cents', i.balance_cents,
        'linked', (i.project_id = p_project_id),
        'href', '/invoices/' || i.id::text
      ) order by i.issued_on desc)
      from public.invoices i
      where i.client_id = v_client_id
        and (
          i.project_id = p_project_id
          or i.quote_id in (select q.id from public.quotes q where q.converted_project_id = p_project_id)
        )
    ), '[]'::jsonb),
    'payments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', pm.id, 'invoice_id', pm.invoice_id, 'invoice_number', i.number,
        'amount_cents', pm.amount_cents, 'paid_on', pm.paid_on,
        'method', pm.method, 'kind', pm.kind
      ) order by pm.paid_on desc)
      from public.payments pm
      join public.invoices i on i.id = pm.invoice_id
      where i.project_id = p_project_id
    ), '[]'::jsonb),
    'services', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', cs.id, 'service_name', s.name, 'billing', cs.billing,
        'billing_interval', cs.billing_interval, 'amount_cents', cs.amount_cents,
        'monthly_amount_cents', coalesce(
          public.normalized_monthly_cents(cs.amount_cents, cs.billing_interval),
          cs.monthly_amount_cents
        )
      ) order by s.name)
      from public.client_services cs
      join public.services s on s.id = cs.service_id
      where cs.client_id = v_client_id
    ), '[]'::jsonb),
    'activity', coalesce((
      select jsonb_agg(entry order by entry_at desc)
      from (
        select
          jsonb_build_object(
            'id', 'project-' || v_project.id::text,
            'label', 'Project updated: ' || v_project.name,
            'occurred_at', v_project.updated_at
          ) as entry,
          v_project.updated_at as entry_at

        union all

        select
          jsonb_build_object(
            'id', 'task-' || t.id::text,
            'label', 'Task updated: ' || t.title,
            'occurred_at', t.updated_at
          ),
          t.updated_at
        from public.tasks t
        where t.project_id = p_project_id

        union all

        select
          jsonb_build_object(
            'id', 'time-' || te.id::text,
            'label', 'Time logged: ' || round(te.minutes::numeric / 60, 2)::text || ' h',
            'occurred_at', te.created_at
          ),
          te.created_at
        from public.time_entries te
        where te.project_id = p_project_id

        union all

        select
          jsonb_build_object(
            'id', 'note-' || n.id::text,
            'label', 'Note added',
            'occurred_at', n.created_at
          ),
          n.created_at
        from public.project_notes n
        where n.project_id = p_project_id

        union all

        select
          jsonb_build_object(
            'id', 'milestone-' || m.id::text,
            'label', 'Milestone completed: ' || m.name,
            'occurred_at', m.completed_at
          ),
          m.completed_at
        from public.milestones m
        where m.project_id = p_project_id and m.completed_at is not null

        union all

        select
          jsonb_build_object(
            'id', 'communication-' || co.id::text,
            'label', 'Client activity: ' || left(co.summary, 140),
            'occurred_at', co.occurred_at
          ),
          co.occurred_at
        from public.communications co
        where co.client_id = v_client_id

        order by entry_at desc
        limit 12
      ) rows
    ), '[]'::jsonb)
  );
end;
$f0013x5$;

comment on function public.get_project_workspace(uuid) is
  'Everything the tabbed project workspace needs in one round trip; NULL when the project does not exist.';

revoke execute on function public.get_project_workspace(uuid) from public, anon;
grant execute on function public.get_project_workspace(uuid) to authenticated;

commit;
