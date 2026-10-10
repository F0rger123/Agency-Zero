-- Fresh install step 11: 0012_client_workspace. Run in the Supabase SQL editor. One transaction: all or nothing.
begin;
-- ═══════════════════════════════════════════════════════════════════════════
-- Agency Zero — 0012: client directory + client workspace read models
--
-- The clients section is re-optimised around two single-round-trip read
-- models (both `security invoker`, so owner-only RLS still applies):
--
--   * `public.get_client_directory()` — one row per client with the numbers
--     the directory needs: active services, MRR, outstanding invoice balance,
--     active projects, waiting-on-client tasks, and last activity. Search,
--     status/billing filters, and sorting run in the browser on this payload,
--     so the directory never issues a query per keystroke.
--
--   * `public.get_client_workspace(p_client_id uuid)` — everything the tabbed
--     client workspace renders (overview stats, contacts, projects, tasks,
--     services + catalogue, quotes, contracts, invoices + payments, notes,
--     activity, files). Returns NULL for an unknown client so the page can
--     call `notFound()`.
--
-- NUMBERING NOTE: see 0010 — `0009` is reserved for the production-only
-- out-of-band migration `0009_sync_client_ready_sales`.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Client directory ───────────────────────────────────────────────────────
create or replace function public.get_client_directory()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $f0012x1$
  select coalesce(jsonb_agg(entry order by name_sort), '[]'::jsonb)
  from (
    select
      jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'company', c.company,
        'email', c.email,
        'phone', c.phone,
        'website', c.website,
        'status', c.status,
        'source', c.source,
        'notes_summary', c.notes_summary,
        'created_at', c.created_at,
        'updated_at', c.updated_at,
        'active_services', (
          select count(*)
          from public.client_services cs
          where cs.client_id = c.id
        ),
        'recurring_services', (
          select count(*)
          from public.client_services cs
          where cs.client_id = c.id and cs.billing = 'recurring'
        ),
        'service_names', (
          select coalesce(jsonb_agg(s.name order by s.name), '[]'::jsonb)
          from public.client_services cs
          join public.services s on s.id = cs.service_id
          where cs.client_id = c.id
        ),
        'mrr_cents', (
          select coalesce(sum(coalesce(
            public.normalized_monthly_cents(cs.amount_cents, cs.billing_interval),
            cs.monthly_amount_cents,
            0
          )), 0)
          from public.client_services cs
          where cs.client_id = c.id and cs.billing = 'recurring'
        ),
        'outstanding_cents', (
          select coalesce(sum(i.balance_cents), 0)
          from public.invoices i
          where i.client_id = c.id and i.status not in ('paid', 'void')
        ),
        'active_projects', (
          select count(*)
          from public.projects p
          where p.client_id = c.id and p.deleted_at is null and p.status = 'active'
        ),
        'total_projects', (
          select count(*)
          from public.projects p
          where p.client_id = c.id and p.deleted_at is null
        ),
        'waiting_tasks', (
          select count(*)
          from public.tasks t
          where t.client_id = c.id and t.status = 'blocked_waiting_client'
        ),
        'open_tasks', (
          select count(*)
          from public.tasks t
          where t.client_id = c.id and t.status not in ('done', 'cancelled')
        ),
        'last_activity_at', greatest(
          c.updated_at,
          coalesce((select max(co.occurred_at) from public.communications co where co.client_id = c.id), c.created_at),
          coalesce((select max(p.updated_at) from public.projects p where p.client_id = c.id and p.deleted_at is null), c.created_at),
          coalesce((select max(t.updated_at) from public.tasks t where t.client_id = c.id), c.created_at)
        )
      ) as entry,
      lower(c.name) as name_sort
    from public.clients c
    where c.deleted_at is null
  ) rows;
$f0012x1$;

comment on function public.get_client_directory() is
  'One row per active client with services, MRR, outstanding balance, active projects, waiting tasks, and last activity.';

revoke execute on function public.get_client_directory() from public, anon;
grant execute on function public.get_client_directory() to authenticated;

-- ── Client workspace ───────────────────────────────────────────────────────
create or replace function public.get_client_workspace(p_client_id uuid)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $f0012x2$
declare
  v_client public.clients%rowtype;
begin
  select * into v_client from public.clients c where c.id = p_client_id;
  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'client', to_jsonb(v_client),
    'stats', jsonb_build_object(
      'mrr_cents', (
        select coalesce(sum(coalesce(
          public.normalized_monthly_cents(cs.amount_cents, cs.billing_interval),
          cs.monthly_amount_cents,
          0
        )), 0)
        from public.client_services cs
        where cs.client_id = p_client_id and cs.billing = 'recurring'
      ),
      'active_services', (select count(*) from public.client_services cs where cs.client_id = p_client_id),
      'outstanding_cents', (
        select coalesce(sum(i.balance_cents), 0)
        from public.invoices i
        where i.client_id = p_client_id and i.status not in ('paid', 'void')
      ),
      'paid_cents', (
        select coalesce(sum(i.paid_cents), 0)
        from public.invoices i
        where i.client_id = p_client_id
      ),
      'invoiced_cents', (
        select coalesce(sum(i.total_cents), 0)
        from public.invoices i
        where i.client_id = p_client_id and i.status <> 'void'
      ),
      'active_projects', (
        select count(*) from public.projects p
        where p.client_id = p_client_id and p.deleted_at is null and p.status = 'active'
      ),
      'total_projects', (
        select count(*) from public.projects p
        where p.client_id = p_client_id and p.deleted_at is null
      ),
      'open_tasks', (
        select count(*) from public.tasks t
        where t.client_id = p_client_id and t.status not in ('done', 'cancelled')
      ),
      'waiting_tasks', (
        select count(*) from public.tasks t
        where t.client_id = p_client_id and t.status = 'blocked_waiting_client'
      ),
      'quotes_awaiting', (
        select count(*) from public.quotes q
        where q.client_id = p_client_id and q.status in ('sent', 'viewed')
      ),
      'contracts_unsigned', (
        select count(*) from public.contracts k
        where k.client_id = p_client_id and k.status in ('draft', 'sent')
      ),
      'last_activity_at', greatest(
        v_client.updated_at,
        coalesce((select max(co.occurred_at) from public.communications co where co.client_id = p_client_id), v_client.created_at),
        coalesce((select max(p.updated_at) from public.projects p where p.client_id = p_client_id and p.deleted_at is null), v_client.created_at),
        coalesce((select max(t.updated_at) from public.tasks t where t.client_id = p_client_id), v_client.created_at)
      )
    ),
    'contacts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ct.id, 'name', ct.name, 'role', ct.role, 'email', ct.email,
        'phone', ct.phone, 'is_primary', ct.is_primary, 'created_at', ct.created_at
      ) order by ct.is_primary desc, ct.name)
      from public.contacts ct where ct.client_id = p_client_id
    ), '[]'::jsonb),
    'projects', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'name', p.name, 'status', p.status, 'deadline', p.deadline,
        'progress', p.progress, 'value_cents', p.value_cents, 'currency', p.currency,
        'estimated_minutes', p.estimated_minutes, 'actual_minutes', p.actual_minutes,
        'open_tasks', (
          select count(*) from public.tasks t
          where t.project_id = p.id and t.status not in ('done', 'cancelled')
        ),
        'href', '/projects/' || p.id::text
      ) order by p.deadline asc nulls last, p.name)
      from public.projects p
      where p.client_id = p_client_id and p.deleted_at is null
    ), '[]'::jsonb),
    'tasks', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id, 'title', t.title, 'status', t.status, 'priority', t.priority,
        'due_date', t.due_date, 'scheduled_date', t.scheduled_date,
        'estimated_minutes', t.estimated_minutes, 'actual_minutes', t.actual_minutes,
        'project_id', t.project_id, 'project_name', p.name, 'updated_at', t.updated_at,
        'href', '/tasks/' || t.id::text
      ) order by t.due_date asc nulls last, t.title)
      from public.tasks t
      left join public.projects p on p.id = t.project_id
      where t.client_id = p_client_id
    ), '[]'::jsonb),
    'services', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', cs.id,
        'service_id', cs.service_id,
        'service_name', s.name,
        'billing', cs.billing,
        'billing_interval', cs.billing_interval,
        'amount_cents', cs.amount_cents,
        'monthly_amount_cents', coalesce(
          public.normalized_monthly_cents(cs.amount_cents, cs.billing_interval),
          cs.monthly_amount_cents
        ),
        'started_on', cs.started_on,
        'default_estimated_minutes', s.default_estimated_minutes
      ) order by cs.billing desc, s.name)
      from public.client_services cs
      join public.services s on s.id = cs.service_id
      where cs.client_id = p_client_id
    ), '[]'::jsonb),
    'service_catalog', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'name', s.name, 'default_billing', s.default_billing,
        'default_price_cents', s.default_price_cents,
        'billing_interval', s.billing_interval,
        'default_estimated_minutes', s.default_estimated_minutes
      ) order by lower(s.name))
      from public.services s where s.active
    ), '[]'::jsonb),
    'quotes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', q.id, 'number', q.number, 'title', q.title, 'status', q.status,
        'issued_on', q.issued_on, 'valid_until', q.valid_until,
        'total_cents', q.total_cents, 'currency', q.currency,
        'is_recurring', (
          select coalesce(bool_or(li.is_recurring), false)
          from public.quote_line_items li where li.quote_id = q.id
        ),
        'accepted_at', q.accepted_at, 'updated_at', q.updated_at,
        'href', '/quotes/' || q.id::text
      ) order by q.issued_on desc, q.number desc)
      from public.quotes q where q.client_id = p_client_id
    ), '[]'::jsonb),
    'contracts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', k.id, 'title', k.title, 'status', k.status, 'version', k.version,
        'signed_at', k.signed_at, 'quote_id', k.quote_id, 'project_id', k.project_id,
        'updated_at', k.updated_at, 'href', '/contracts/' || k.id::text
      ) order by k.created_at desc)
      from public.contracts k where k.client_id = p_client_id
    ), '[]'::jsonb),
    'invoices', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id, 'number', i.number, 'title', i.title, 'status', i.status,
        'issued_on', i.issued_on, 'due_on', i.due_on, 'currency', i.currency,
        'total_cents', i.total_cents, 'paid_cents', i.paid_cents,
        'balance_cents', i.balance_cents, 'project_id', i.project_id,
        'href', '/invoices/' || i.id::text
      ) order by i.issued_on desc, i.number desc)
      from public.invoices i where i.client_id = p_client_id
    ), '[]'::jsonb),
    'payments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', pm.id, 'invoice_id', pm.invoice_id, 'invoice_number', i.number,
        'amount_cents', pm.amount_cents, 'paid_on', pm.paid_on,
        'method', pm.method, 'kind', pm.kind, 'reference', pm.reference
      ) order by pm.paid_on desc)
      from public.payments pm
      join public.invoices i on i.id = pm.invoice_id
      where i.client_id = p_client_id
    ), '[]'::jsonb),
    'notes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', n.id, 'body', n.body, 'pinned', n.pinned, 'created_at', n.created_at
      ) order by n.pinned desc, n.created_at desc)
      from public.client_notes n where n.client_id = p_client_id
    ), '[]'::jsonb),
    'communications', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', co.id, 'channel', co.channel, 'direction', co.direction,
        'summary', co.summary, 'occurred_at', co.occurred_at,
        'contact_id', co.contact_id, 'contact_name', ct.name
      ) order by co.occurred_at desc)
      from public.communications co
      left join public.contacts ct on ct.id = co.contact_id
      where co.client_id = p_client_id
    ), '[]'::jsonb),
    'files', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', f.id, 'file_name', f.file_name, 'storage_path', f.storage_path,
        'mime_type', f.mime_type, 'size_bytes', f.size_bytes, 'created_at', f.created_at
      ) order by f.created_at desc)
      from public.client_files f where f.client_id = p_client_id
    ), '[]'::jsonb)
  );
end;
$f0012x2$;

comment on function public.get_client_workspace(uuid) is
  'Everything the tabbed client workspace needs in one round trip; NULL when the client does not exist.';

revoke execute on function public.get_client_workspace(uuid) from public, anon;
grant execute on function public.get_client_workspace(uuid) to authenticated;

commit;
