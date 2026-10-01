-- ═══════════════════════════════════════════════════════════════════════════
-- Agency Zero — 0014: owner-only RLS (audit finding S1 / BUGS B-001)
--
-- Until now every policy was `auth.uid() is not null`, i.e. ANY authenticated
-- user was "the owner". That is only safe while Supabase public sign-ups are
-- disabled. This migration makes the database itself enforce single-owner
-- access, so an accidentally enabled sign-up (or an invited user) can no
-- longer read or write business data.
--
-- Design
--   * `public.app_owner` — singleton row holding the owner's auth user id.
--     RLS is enabled with NO policies: only the SECURITY DEFINER function
--     below can read it.
--   * Seeded from the oldest existing profile (the owner created first). On a
--     brand-new database the first user created becomes the owner
--     (`handle_new_user()` is updated accordingly).
--   * `public.is_owner()` — true when auth.uid() is the owner.
--   * Every policy that used the old "authenticated" predicate is rewritten to
--     `is_owner()`, including Storage policies for `client-files`.
--   * `profiles` keeps `id = auth.uid()` (a user can only see their own row).
--
-- !! BEFORE APPLYING TO PRODUCTION !!
--   Confirm the owner's profile is the OLDEST row in public.profiles:
--     select id, full_name, created_at from public.profiles order by created_at;
--   If not, fix the row after applying:
--     update public.app_owner set user_id = '<owner auth.users id>' where id = 1;
--   Applying this migration does not lock the owner out as long as that holds.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── owner registry ─────────────────────────────────────────────────────────
create table if not exists public.app_owner (
  id integer primary key default 1 check (id = 1),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.app_owner is
  'Singleton: the one auth user allowed to access business data. Read only via public.is_owner().';

alter table public.app_owner enable row level security;
-- Intentionally no policies: not readable or writable through the API.
revoke all on public.app_owner from anon, authenticated;

insert into public.app_owner (id, user_id)
select 1, p.id
from public.profiles p
order by p.created_at, p.id
limit 1
on conflict (id) do nothing;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_owner o where o.user_id = (select auth.uid())
  );
$$;

revoke execute on function public.is_owner() from public;
grant execute on function public.is_owner() to anon, authenticated;

-- First user on an empty database becomes the owner; later sign-ups get a
-- profile row (harmless: RLS hides everything) but never ownership.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(coalesce(new.email, 'owner'), '@', 1)
    )
  );

  insert into public.settings (id) values (1) on conflict (id) do nothing;
  insert into public.app_owner (id, user_id) values (1, new.id) on conflict (id) do nothing;

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ── rewrite every "any authenticated user" policy ─────────────────────────
do $$
declare
  pol record;
  using_clause text;
  check_clause text;
  rewritten integer := 0;
begin
  for pol in
    select schemaname, tablename, policyname, cmd
    from pg_policies
    where schemaname = 'public'
      and (coalesce(qual, '') ~* 'auth\.uid\(\).*is not null'
        or coalesce(with_check, '') ~* 'auth\.uid\(\).*is not null')
  loop
    using_clause := case when pol.cmd in ('ALL', 'SELECT', 'UPDATE', 'DELETE') then ' using (public.is_owner())' else '' end;
    check_clause := case when pol.cmd in ('ALL', 'INSERT', 'UPDATE') then ' with check (public.is_owner())' else '' end;
    execute format('alter policy %I on %I.%I%s%s',
      pol.policyname, pol.schemaname, pol.tablename, using_clause, check_clause);
    rewritten := rewritten + 1;
  end loop;
  raise notice '0014: rewrote % policies to is_owner()', rewritten;
end
$$;

-- ── Storage: client-files bucket ───────────────────────────────────────────
drop policy if exists "Owner reads client files" on storage.objects;
drop policy if exists "Owner uploads client files" on storage.objects;
drop policy if exists "Owner updates client files" on storage.objects;
drop policy if exists "Owner deletes client files" on storage.objects;

create policy "Owner reads client files"
  on storage.objects for select to authenticated
  using (bucket_id = 'client-files' and public.is_owner());
create policy "Owner uploads client files"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'client-files' and public.is_owner());
create policy "Owner updates client files"
  on storage.objects for update to authenticated
  using (bucket_id = 'client-files' and public.is_owner())
  with check (bucket_id = 'client-files' and public.is_owner());
create policy "Owner deletes client files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'client-files' and public.is_owner());

-- ── SECURITY DEFINER RPCs that previously only checked auth.uid() ──────────
-- These bypass RLS, so they need the owner check themselves.
create or replace function public.convert_quote_to_project(p_quote_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare q public.quotes%rowtype; project_uuid uuid;
begin
  if not public.is_owner() then raise exception 'Authentication required'; end if;
  select * into q from public.quotes where id = p_quote_id for update;
  if not found then raise exception 'Quote not found'; end if;
  if q.status <> 'accepted' then raise exception 'Only accepted quotes can become projects'; end if;
  if q.converted_project_id is not null then return q.converted_project_id; end if;
  insert into public.projects (client_id, name, description, status, value_cents, currency, progress)
  values (q.client_id, q.title, 'Created from accepted quote ' || q.number, 'planning', q.total_cents, q.currency, 0)
  returning id into project_uuid;
  update public.quotes set converted_project_id = project_uuid where id = q.id;
  return project_uuid;
end;
$$;

create or replace function public.refresh_invoice_statuses()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_owner() then raise exception 'Authentication required'; end if;
  update public.invoices
  set status = 'overdue'::invoice_status
  where status in ('sent', 'partially_paid') and due_on < current_date and paid_cents < total_cents;
end;
$$;

-- ── safety net: fail the migration if any open policy remains ──────────────
do $$
declare leftover integer;
begin
  select count(*) into leftover
  from pg_policies
  where schemaname in ('public', 'storage')
    and 'authenticated' = any (roles)
    and (coalesce(qual, '') ~* 'auth\.uid\(\).*is not null'
      or coalesce(with_check, '') ~* 'auth\.uid\(\).*is not null');
  if leftover > 0 then
    raise exception '0014: % policies still use the any-authenticated predicate', leftover;
  end if;
end
$$;
