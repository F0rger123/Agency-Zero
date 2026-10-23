-- Agency Zero: updates 0027 + 0028 + 0029 in one paste. Run in the project your website uses. Safe to run once; each part is all-or-nothing.
begin;
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
alter table public.quotes
  add column kind text not null default 'quote' check (kind in ('quote', 'estimate'));
alter table public.clients
  add column portal_token text unique,
  add column portal_token_hash text unique,
  add column portal_enabled boolean not null default false;
create or replace function public.get_public_quote(p_token_hash text)
returns jsonb
language sql
security definer
set search_path = public
as $f0027x1$
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
$f0027x1$;
create or replace function public.get_public_portal(p_token_hash text)
returns jsonb
language sql
security definer
set search_path = public
as $f0027x2$
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
$f0027x2$;
revoke execute on function public.get_public_portal(text) from public;
grant execute on function public.get_public_portal(text) to anon, authenticated;
commit;

begin;
alter table public.leads alter column email drop not null;
alter table public.leads drop constraint if exists leads_email_check;
alter table public.leads add constraint leads_email_check check (email is null or (length(email) <= 254 and position('@' in email) > 1));
alter table public.leads add constraint leads_reach_check check (email is not null or phone is not null);
create or replace function public.submit_lead(
  p_name text,
  p_business text,
  p_email text,
  p_phone text,
  p_services text[],
  p_budget text,
  p_details text,
  p_submitter_hash text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $f0028x1$
declare
  v_id uuid;
  v_name text := trim(coalesce(p_name, ''));
  v_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
  v_phone text := nullif(left(trim(coalesce(p_phone, '')), 40), '');
  v_digits integer := length(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g'));
  v_allowed text[] := array['software', 'websites', 'seo', 'meta-ads', 'social', 'content', 'not-sure'];
  v_services text[] := coalesce(p_services, '{}');
begin
  if length(v_name) < 1 or length(v_name) > 160 then raise exception 'Please enter your name'; end if;
  if v_email is not null and (length(v_email) > 254 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then
    raise exception 'Please enter a valid email address';
  end if;
  if v_phone is not null and (v_digits < 7 or v_digits > 15) then
    raise exception 'Please enter a valid phone number';
  end if;
  if v_email is null and v_phone is null then
    raise exception 'Please enter a phone number or an email address';
  end if;
  if length(coalesce(p_details, '')) > 4000 then raise exception 'Project details are too long'; end if;
  if cardinality(v_services) > 8 or not (v_services <@ v_allowed) then raise exception 'Invalid service selection'; end if;
  -- Rate limits: protect the inbox and the database from floods.
  if v_email is not null
     and (select count(*) from public.leads l where lower(l.email) = v_email and l.created_at > now() - interval '1 hour') >= 3 then
    raise exception 'Too many requests, please try again later';
  end if;
  if v_email is null
     and (select count(*) from public.leads l where l.phone = v_phone and l.created_at > now() - interval '1 hour') >= 3 then
    raise exception 'Too many requests, please try again later';
  end if;
  if p_submitter_hash is not null
     and (select count(*) from public.leads l where l.submitter_hash = p_submitter_hash and l.created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Too many requests, please try again later';
  end if;
  if (select count(*) from public.leads l where l.created_at > now() - interval '1 hour') >= 200 then
    raise exception 'Too many requests, please try again later';
  end if;
  insert into public.leads (name, business, email, phone, services, budget, details, submitter_hash)
  values (
    v_name,
    nullif(left(trim(coalesce(p_business, '')), 200), ''),
    v_email,
    v_phone,
    v_services,
    nullif(left(trim(coalesce(p_budget, '')), 60), ''),
    nullif(trim(coalesce(p_details, '')), ''),
    left(p_submitter_hash, 128)
  )
  returning id into v_id;
  return v_id;
end;
$f0028x1$;
revoke execute on function public.submit_lead(text, text, text, text, text[], text, text, text) from public;
grant execute on function public.submit_lead(text, text, text, text, text[], text, text, text) to anon, authenticated;
commit;

begin;
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
commit;

