-- ═══════════════════════════════════════════════════════════════════════════
-- Agency Zero — 0031: general to-do list
--
-- A quick list for things that are not tied to a client or project: "call the accountant", "renew the domain".
-- The app adds to it from the To-do page and from inside Lock In. Owner-only (RLS). Done items are kept (done_at) so
-- "Clear done" is the only thing that removes them.
-- Additive and reversible: `drop table public.todos;`
-- ═══════════════════════════════════════════════════════════════════════════

create table public.todos (
  id uuid primary key default gen_random_uuid(),
  text text not null check (length(btrim(text)) between 1 and 300),
  done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index todos_open_idx on public.todos (done, created_at desc);

alter table public.todos enable row level security;
create policy "Owner manages todos"
  on public.todos for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create trigger todos_set_updated_at
  before update on public.todos
  for each row execute function public.set_updated_at();
grant select, insert, update, delete on public.todos to authenticated;
