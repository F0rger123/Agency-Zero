-- ═══════════════════════════════════════════════════════════════════════════
-- Agency Zero — 0033: meetings as a workspace (notes, questions, whiteboard, files)
--
--   meetings.client_id   — may now be empty: a meeting can be noted first and saved to a customer later.
--   meetings.questions   — a list of questions to ask / that came up (same shape as action items).
--   whiteboards.meeting_id — a whiteboard used in a meeting (its notepad is that meeting's notes).
--   client_files.meeting_id — files uploaded from a meeting (photos of paper notes, exported boards), still filed
--                             under the customer.
-- Additive. Reversible: drop the three columns (and set client_id back to not null once every meeting has a client).
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.meetings alter column client_id drop not null;
alter table public.meetings
  add column if not exists questions jsonb not null default '[]'::jsonb check (jsonb_typeof(questions) = 'array');

alter table public.whiteboards
  add column if not exists meeting_id uuid references public.meetings (id) on delete set null;
create index if not exists whiteboards_meeting_idx on public.whiteboards (meeting_id);

alter table public.client_files
  add column if not exists meeting_id uuid references public.meetings (id) on delete set null;
create index if not exists client_files_meeting_idx on public.client_files (meeting_id);
