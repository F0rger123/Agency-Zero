-- Migration 0021_marketing_and_social — run in the Supabase SQL editor. Wrapped in a transaction: all or nothing.
begin;
-- ═══════════════════════════════════════════════════════════════════════════
-- Agency Zero — 0021: marketing campaigns and social content
--
-- Two small owner-only tables so the Marketing and Social sections of the CRM
-- are real working tools (before the ad-platform integrations exist):
--   * marketing_campaigns — paid/organic campaigns per client, with budget,
--     spend and results entered by hand.
--   * social_posts — a content calendar per client and platform.
-- Both follow the repo rules: RLS via is_owner(), integer minor units for money.
-- ═══════════════════════════════════════════════════════════════════════════

create type public.campaign_channel as enum ('meta_ads', 'google_ads', 'seo', 'email', 'other');
create type public.campaign_status as enum ('planned', 'active', 'paused', 'completed');

create table public.marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  name text not null check (length(trim(name)) between 1 and 160),
  channel public.campaign_channel not null default 'meta_ads',
  status public.campaign_status not null default 'planned',
  objective text check (objective is null or length(objective) <= 500),
  starts_on date,
  ends_on date,
  budget_cents integer check (budget_cents is null or budget_cents >= 0),
  spend_cents integer not null default 0 check (spend_cents >= 0),
  leads_count integer not null default 0 check (leads_count >= 0),
  results_note text check (results_note is null or length(results_note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);
create index marketing_campaigns_client_idx on public.marketing_campaigns (client_id, created_at desc);
create index marketing_campaigns_status_idx on public.marketing_campaigns (status, starts_on);

create type public.social_platform as enum ('instagram', 'facebook', 'tiktok', 'linkedin', 'youtube', 'x', 'other');
create type public.social_format as enum ('post', 'reel', 'story', 'carousel', 'video');
create type public.social_status as enum ('idea', 'drafting', 'scheduled', 'posted');

create table public.social_posts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  platform public.social_platform not null default 'instagram',
  format public.social_format not null default 'post',
  status public.social_status not null default 'idea',
  caption text check (caption is null or length(caption) <= 4000),
  scheduled_for timestamptz,
  post_url text check (post_url is null or length(post_url) <= 500),
  notes text check (notes is null or length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index social_posts_client_idx on public.social_posts (client_id, scheduled_for);
create index social_posts_status_idx on public.social_posts (status, scheduled_for);

alter table public.marketing_campaigns enable row level security;
alter table public.social_posts enable row level security;

create policy "Owner manages campaigns"
  on public.marketing_campaigns for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create policy "Owner manages social posts"
  on public.social_posts for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

create trigger marketing_campaigns_set_updated_at
  before update on public.marketing_campaigns
  for each row execute function public.set_updated_at();
create trigger social_posts_set_updated_at
  before update on public.social_posts
  for each row execute function public.set_updated_at();

grant select, insert, update, delete on public.marketing_campaigns to authenticated;
grant select, insert, update, delete on public.social_posts to authenticated;

commit;
