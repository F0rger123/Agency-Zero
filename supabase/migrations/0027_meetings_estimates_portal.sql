-- ═══════════════════════════════════════════════════════════════════════════
-- Agency Zero — 0027: meeting notes, estimates, client portal
--
--   meetings          — notes taken during (or before/after) a meeting, kept on the customer: agenda, attendees,
--                       free-form notes, decisions and an action-item checklist. Owner-only (RLS).
--   quotes.kind       — 'quote' or 'estimate'. Same document, same link, same accept/decline flow; only the wording
--                       differs. Existing rows stay 'quote'.
--   clients.portal_*  — an optional private link per client (/p/<token>) listing what they can act on: proposals and
--                       estimates to accept, contracts to sign, invoices to see. The portal never shows draft or
--                       internal records, and acting on a document uses the existing /q and /c links, so every
--                       acceptance or signature lands in the CRM exactly as before.
--   get_public_portal — the one anonymous read for the portal (security definer, token hash lookup, enabled only).
--   get_public_quote  — re-created to also return `kind`.
--
-- Additive and reversible: `drop table public.meetings; alter table public.quotes drop column kind;
-- alter table public.clients drop column portal_token, drop column portal_token_hash, drop column portal_enabled;
-- drop function public.get_public_portal(text);` (re-run 0008's get_public_quote to restore the old shape).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── meetings ───────────────────────────────────────────────────────────────
create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  project_id uuid references public.projects (id) on delete set null,
  title text not null default 'Meeting' check (length(trim(title)) > 0),
  meeting_at timestamptz not null default now(),
  location text,
  attendees text,
  agenda text,
  notes text not null default '',
  decisions text,
  action_items jsonb not null default '[]'::jsonb check (jsonb_typeof(action_items) = 'array'),
  status text not null default 'in_progress' check (status in ('scheduled', 'in_progress', 'done')),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index meetings_client_idx on public.meetings (client_id, meeting_at desc);
create index meetings_status_idx on public.meetings (status, meeting_at desc);

alter table public.meetings enable row level security;
create policy "Owner manages meetings"
  on public.meetings for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create trigger meetings_set_updated_at
  before update on public.meetings
  for each row execute function public.set_updated_at();
grant select, insert, update, delete on public.meetings to authenticated;

-- ── estimates ──────────────────────────────────────────────────────────────
alter table public.quotes
  add column kind text not null default 'quote' check (kind in ('quote', 'estimate'));

-- ── portal columns ─────────────────────────────────────────────────────────
alter table public.clients
  add column portal_token text unique,
  add column portal_token_hash text unique,
  add column portal_enabled boolean not null default false;

-- ── public quote read: now includes the kind ───────────────────────────────
create or replace function public.get_public_quote(p_token_hash text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', q.id, 'number', q.number, 'title', q.title, 'notes', q.notes,
    'kind', q.kind,
    'status', q.status,
    'issued_on', q.issued_on, 'valid_until', q.valid_until, 'currency', q.currency,
    'subtotal_cents', q.subtotal_cents, 'discount_cents', q.discount_cents,
    'tax_rate', q.tax_rate, 'tax_cents', q.tax_cents, 'total_cents', q.total_cents,
    'viewed_at', q.viewed_at, 'accepted_at', q.accepted_at, 'rejected_at', q.rejected_at,
    'responded_by', q.responded_by,
    'selected_item_ids', q.selected_item_ids,
    'accepted_subtotal_cents', q.accepted_subtotal_cents,
    'accepted_total_cents', q.accepted_total_cents,
    'client_name', c.name, 'company', c.company,
    'business_name', (select s.business_name from public.settings s where s.id = 1),
    'line_items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', li.id, 'sort_order', li.sort_order,
        'description', li.description, 'details', li.details,
        'qty', li.qty, 'unit_amount_cents', li.unit_amount_cents,
        'is_recurring', li.is_recurring, 'billing_period', li.billing_period,
        'amount_cents', li.amount_cents,
        'option_group', li.option_group, 'selection', li.selection
      ) order by li.sort_order)
      from public.quote_line_items li where li.quote_id = q.id
    ), '[]'::jsonb)
  )
  from public.quotes q
  join public.clients c on c.id = q.client_id
  where q.public_token_hash = p_token_hash
    and q.status in ('sent', 'viewed', 'accepted', 'rejected')
    and (q.token_expires_at is null or q.token_expires_at > now());
$$;

-- ── the client portal read ─────────────────────────────────────────────────
-- Returns null for an unknown, disabled or archived link. Otherwise only what a client may see: sent/answered
-- proposals and estimates, sent/signed contracts and issued invoices. Each document carries its own existing
-- public token so the portal can link to /q/<token> and /c/<token>; expired document links are left out.
create or replace function public.get_public_portal(p_token_hash text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'client_name', c.name,
    'company', c.company,
    'business_name', (select s.business_name from public.settings s where s.id = 1),
    'quotes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'number', q.number, 'title', q.title, 'kind', q.kind, 'status', q.status,
        'total_cents', q.total_cents, 'currency', q.currency, 'valid_until', q.valid_until,
        'issued_on', q.issued_on, 'accepted_at', q.accepted_at, 'rejected_at', q.rejected_at,
        'token', q.public_token
      ) order by q.issued_on desc, q.created_at desc)
      from public.quotes q
      where q.client_id = c.id
        and q.status in ('sent', 'viewed', 'accepted', 'rejected')
        and (q.token_expires_at is null or q.token_expires_at > now())
    ), '[]'::jsonb),
    'contracts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'title', k.title, 'status', k.status, 'signed_at', k.signed_at, 'token', k.public_token
      ) order by k.created_at desc)
      from public.contracts k
      where k.client_id = c.id
        and k.status in ('sent', 'signed')
        and (k.token_expires_at is null or k.token_expires_at > now())
    ), '[]'::jsonb),
    'invoices', coalesce((
      select jsonb_agg(jsonb_build_object(
        'number', i.number, 'title', i.title, 'status', i.status, 'due_on', i.due_on,
        'total_cents', i.total_cents, 'balance_cents', i.balance_cents, 'currency', i.currency
      ) order by i.due_on desc)
      from public.invoices i
      where i.client_id = c.id
        and i.status in ('sent', 'partially_paid', 'paid', 'overdue')
    ), '[]'::jsonb)
  )
  from public.clients c
  where c.portal_token_hash = p_token_hash
    and c.portal_enabled
    and c.deleted_at is null;
$$;

revoke execute on function public.get_public_portal(text) from public;
grant execute on function public.get_public_portal(text) to anon, authenticated;
