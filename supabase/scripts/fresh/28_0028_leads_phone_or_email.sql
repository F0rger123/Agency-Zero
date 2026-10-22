-- Fresh install step 28: 0028_leads_phone_or_email. Run in the Supabase SQL editor. One transaction: all or nothing.
begin;
-- ═══════════════════════════════════════════════════════════════════════════
-- Agency Zero — 0028: website inquiries can be reached by phone, email, or both
--
-- The contact form now asks "How can I reach you?" with Phone / Email / Both. Until now `leads.email` was required, so a
-- phone-only inquiry could not be saved.
--   leads.email     — now nullable; a lead must still have an email OR a phone (check constraint).
--   submit_lead()   — email optional when a usable phone number (7–15 digits) is given; any email given must still be valid.
--                     Rate limits: per email when there is one, per phone otherwise (plus the existing fingerprint and global limits).
--   convert_lead_to_client() — unchanged: clients/contacts already allow a null email.
-- Additive and reversible only while no phone-only lead exists:
--   alter table public.leads drop constraint leads_reach_check; alter table public.leads alter column email set not null;
-- ═══════════════════════════════════════════════════════════════════════════

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
