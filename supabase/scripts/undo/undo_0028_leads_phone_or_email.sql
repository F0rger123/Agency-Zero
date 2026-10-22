-- UNDO 0028 (phone-or-email inquiries). Safe only while no inquiry exists without an email.
begin;
do $u28a$
begin
  if exists (select 1 from public.leads where email is null) then
    raise exception 'Some inquiries have no email (phone-only). Delete or fill them in first, then run this again.';
  end if;
end
$u28a$;
alter table public.leads drop constraint if exists leads_reach_check;
alter table public.leads drop constraint if exists leads_email_check;
alter table public.leads alter column email set not null;
alter table public.leads add constraint leads_email_check check (length(email) <= 254 and position('@' in email) > 1);

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
as $u28b$
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
$u28b$;

revoke execute on function public.submit_lead(text, text, text, text, text[], text, text, text) from public;
grant execute on function public.submit_lead(text, text, text, text, text[], text, text, text) to anon, authenticated;
commit;
