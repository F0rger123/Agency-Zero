-- Fresh install step 26: 0026_passkeys. Run in the Supabase SQL editor. One transaction: all or nothing.
begin;
-- ═══════════════════════════════════════════════════════════════════════════
-- Agency Zero — 0026: passkeys (WebAuthn) for CRM sign-in
--
-- Passkeys let an authorised CRM user sign in with the device's own unlock (fingerprint, face unlock, Windows Hello,
-- device PIN). The device does the biometric check; Agency Zero stores only the WebAuthn *public* credential:
-- never a fingerprint, a face template or a private key. Passwords keep working.
--
--   passkeys           — one row per registered passkey. The owner can see, rename and remove their own; rows are
--                        created ONLY by the server after it has verified a real WebAuthn attestation (no insert
--                        grant for browsers), and sign-in updates (counter, last_used_at) are made server-side.
--   passkey_challenges — short-lived, single-use challenges for registration and sign-in. Server only (no policies,
--                        no grants): the app reaches it with the service-role key.
--
-- Signing in with a passkey does NOT grant access by itself: the server still requires the account to be in
-- app_owner / app_team (the same rule as is_owner()) before it starts a session.
-- Reversible: `drop table public.passkey_challenges, public.passkeys;` (passwords are unaffected).
-- ═══════════════════════════════════════════════════════════════════════════

create table public.passkeys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  credential_id text not null unique,
  public_key text not null,
  counter bigint not null default 0 check (counter >= 0),
  transports text[] not null default '{}',
  device_type text,
  backed_up boolean not null default false,
  name text not null check (length(trim(name)) between 1 and 80),
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);
create index passkeys_user_idx on public.passkeys (user_id);

alter table public.passkeys enable row level security;

create policy "Owner sees own passkeys"
  on public.passkeys for select to authenticated
  using (user_id = (select auth.uid()) and public.is_owner());
create policy "Owner renames own passkeys"
  on public.passkeys for update to authenticated
  using (user_id = (select auth.uid()) and public.is_owner())
  with check (user_id = (select auth.uid()) and public.is_owner());
create policy "Owner removes own passkeys"
  on public.passkeys for delete to authenticated
  using (user_id = (select auth.uid()) and public.is_owner());

-- Browsers can read, rename and delete; they can never insert or change keys/counters.
revoke all on public.passkeys from anon, authenticated;
grant select, delete on public.passkeys to authenticated;
grant update (name) on public.passkeys to authenticated;

create table public.passkey_challenges (
  id uuid primary key default gen_random_uuid(),
  challenge text not null,
  purpose text not null check (purpose in ('register', 'login')),
  user_id uuid references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index passkey_challenges_created_idx on public.passkey_challenges (created_at);

alter table public.passkey_challenges enable row level security;
revoke all on public.passkey_challenges from anon, authenticated;

commit;
