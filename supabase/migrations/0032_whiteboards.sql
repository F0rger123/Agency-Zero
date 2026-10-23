-- ═══════════════════════════════════════════════════════════════════════════
-- Agency Zero — 0032: call whiteboards
--
-- A whiteboard for sales calls: four frames (their problem, what they need, how I help, the path forward) that the owner
-- draws on while the prospect watches, live, through a shareable link. The drawing itself travels live between the people on
-- the call (Supabase Realtime broadcast); this table is where the owner's board is kept between calls.
--   whiteboards — one row per board. `data` is the whole board as json (frames and their drawn elements).
--                 Owner-only (RLS). The share link token is random; only its hash is used for lookup.
--   get_public_whiteboard(token_hash) — anonymous read of one shared board (title, data, mode), so a guest opening the
--                 link sees the latest saved drawing at once. Returns nothing when sharing is off.
-- Additive and reversible: `drop function public.get_public_whiteboard(text); drop table public.whiteboards;`
-- ═══════════════════════════════════════════════════════════════════════════

create table public.whiteboards (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) between 1 and 200),
  client_id uuid references public.clients (id) on delete set null,
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'),
  public_token text not null unique,
  public_token_hash text not null unique,
  share_mode text not null default 'edit' check (share_mode in ('edit', 'view', 'off')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index whiteboards_updated_idx on public.whiteboards (updated_at desc);
create index whiteboards_client_idx on public.whiteboards (client_id);

alter table public.whiteboards enable row level security;
create policy "Owner manages whiteboards"
  on public.whiteboards for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create trigger whiteboards_set_updated_at
  before update on public.whiteboards
  for each row execute function public.set_updated_at();
grant select, insert, update, delete on public.whiteboards to authenticated;

create or replace function public.get_public_whiteboard(p_token_hash text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object('id', w.id, 'title', w.title, 'data', w.data, 'mode', w.share_mode)
  from public.whiteboards w
  where w.public_token_hash = p_token_hash
    and w.share_mode <> 'off'
  limit 1;
$$;

revoke all on function public.get_public_whiteboard(text) from public;
grant execute on function public.get_public_whiteboard(text) to anon, authenticated;
