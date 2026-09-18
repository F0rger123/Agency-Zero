-- ═══════════════════════════════════════════════════════════════════════════
-- Agency Zero — 0001: profiles & settings (DATABASE_PLAN.md §2)
-- Owner profile attached to Supabase Auth + single-row workspace settings.
-- Conventions (DATABASE_PLAN.md §1): uuid PKs, timestamptz in UTC,
-- durations in minutes (DECISIONS.md D-015), money in minor units (D-012).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── updated_at helper (applied to every table across migrations) ──────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── profiles: the agency owner (one per auth user; this is a private app) ─
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  timezone text not null default 'UTC',
  currency text not null default 'USD',
  default_daily_capacity_minutes integer
    not null default 480
    check (default_daily_capacity_minutes between 0 and 1440),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Agency owner profile; extends Supabase Auth users (private single-owner app, D-003).';

alter table public.profiles enable row level security;

create policy "Owner can view own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Owner can update own profile"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Insert happens via the security definer trigger below; delete via cascade.

-- ── settings: single row of workspace defaults ─────────────────────────────
create table public.settings (
  id integer primary key default 1 check (id = 1),
  business_name text,
  address text,
  tax_id text,
  default_currency text not null default 'USD',
  default_tax_rate numeric not null default 0 check (default_tax_rate >= 0),
  quote_prefix text not null default 'Q-',
  invoice_prefix text not null default 'INV-',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.settings is
  'Single-row workspace defaults (enforced by id = 1 check).';

alter table public.settings enable row level security;

-- Any authenticated user is the owner in this private app (D-003, D-014).
create policy "Owner manages settings"
  on public.settings
  for all
  to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

-- ── auto-create profile + settings row on sign-up ─────────────────────────
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

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── updated_at triggers ─────────────────────────────────────────────────────
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();
