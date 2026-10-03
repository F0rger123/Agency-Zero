-- Migration 0019_website_leads — run in the Supabase SQL editor. Wrapped in a transaction: all or nothing.
begin;
-- ═══════════════════════════════════════════════════════════════════════════
-- Agency Zero — 0019: website leads (public contact form → CRM)
--
-- The public site's project-inquiry form lands here. Design:
--   * `public.leads` is owner-only (RLS via is_owner()): nobody but the owner /
--     authorised team can read, edit or delete leads through the API.
--   * Anonymous visitors can ONLY call `public.submit_lead(...)` — a narrow
--     SECURITY DEFINER function that validates every field, whitelists the
--     service list, and rate-limits by a hashed submitter fingerprint and by
--     email (no raw IP is stored). It returns only the new id.
--   * `public.convert_lead_to_client(lead_id)` (security invoker, owner only)
--     turns a lead into a client + primary contact in one transaction.
-- ═══════════════════════════════════════════════════════════════════════════

create type public.lead_status as enum ('new', 'contacted', 'converted', 'dismissed');

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 160),
  business text check (business is null or length(business) <= 200),
  email text not null check (length(email) <= 254 and position('@' in email) > 1),
  phone text check (phone is null or length(phone) <= 40),
  services text[] not null default '{}',
  budget text check (budget is null or length(budget) <= 60),
  details text check (details is null or length(details) <= 4000),
  source text not null default 'website',
  status public.lead_status not null default 'new',
  client_id uuid references public.clients (id) on delete set null,
  submitter_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.leads is
  'Inbound project inquiries from the public website. Owner-only; written by submit_lead().';

create index leads_status_created_idx on public.leads (status, created_at desc);
create index leads_submitter_idx on public.leads (submitter_hash, created_at desc);
create index leads_email_idx on public.leads (lower(email), created_at desc);

alter table public.leads enable row level security;

create policy "Owner manages leads"
  on public.leads for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

-- ── public submission ──────────────────────────────────────────────────────
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
as $m0019x1$
declare
  v_id uuid;
  v_name text := trim(coalesce(p_name, ''));
  v_email text := lower(trim(coalesce(p_email, '')));
  v_allowed text[] := array['software', 'websites', 'seo', 'meta-ads', 'social', 'content', 'not-sure'];
  v_services text[] := coalesce(p_services, '{}');
begin
  if length(v_name) < 1 or length(v_name) > 160 then raise exception 'Please enter your name'; end if;
  if length(v_email) > 254 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Please enter a valid email address';
  end if;
  if length(coalesce(p_details, '')) > 4000 then raise exception 'Project details are too long'; end if;
  if cardinality(v_services) > 8 or not (v_services <@ v_allowed) then raise exception 'Invalid service selection'; end if;

  -- Rate limits: protect the inbox and the database from floods.
  if (select count(*) from public.leads l where lower(l.email) = v_email and l.created_at > now() - interval '1 hour') >= 3 then
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
    nullif(left(trim(coalesce(p_phone, '')), 40), ''),
    v_services,
    nullif(left(trim(coalesce(p_budget, '')), 60), ''),
    nullif(trim(coalesce(p_details, '')), ''),
    left(p_submitter_hash, 128)
  )
  returning id into v_id;
  return v_id;
end;
$m0019x1$;

revoke execute on function public.submit_lead(text, text, text, text, text[], text, text, text) from public;
grant execute on function public.submit_lead(text, text, text, text, text[], text, text, text) to anon, authenticated;

-- ── lead → client ──────────────────────────────────────────────────────────
create or replace function public.convert_lead_to_client(p_lead_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public
as $m0019x2$
declare
  l public.leads%rowtype;
  v_client uuid;
begin
  select * into l from public.leads where id = p_lead_id for update;
  if not found then raise exception 'Lead not found'; end if;
  if l.client_id is not null then return l.client_id; end if;

  insert into public.clients (name, status, company, email, phone, source, notes_summary)
  values (
    coalesce(nullif(l.business, ''), l.name),
    'lead',
    nullif(l.business, ''),
    l.email,
    l.phone,
    'website',
    nullif(concat_ws(E'\n', 'Interested in: ' || nullif(array_to_string(l.services, ', '), ''), 'Budget: ' || l.budget, l.details), '')
  )
  returning id into v_client;

  insert into public.contacts (client_id, name, email, phone, is_primary)
  values (v_client, l.name, l.email, l.phone, true);

  update public.leads set status = 'converted', client_id = v_client where id = l.id;
  return v_client;
end;
$m0019x2$;

revoke execute on function public.convert_lead_to_client(uuid) from public, anon;
grant execute on function public.convert_lead_to_client(uuid) to authenticated;

commit;
