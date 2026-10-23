-- ═══════════════════════════════════════════════════════════════════════════
-- Agency Zero — 0034: a separate copy/paste notepad per meeting
--
--   meetings.scratchpad — free text the owner pastes or types during a meeting (links, numbers, text copied from
--                         elsewhere), kept apart from `notes` (the typed/dictated meeting record).
-- Additive. Reversible: drop the column.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.meetings
  add column if not exists scratchpad text not null default '' check (length(scratchpad) <= 100000);
