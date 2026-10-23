-- ═══════════════════════════════════════════════════════════════════════════
-- Agency Zero — 0030: service categories
--
-- The Services page groups the catalogue (Websites, SEO, Paid ads, Social and content, Software, Branding and design,
-- Care plans, Consulting). One nullable text column on `services`; nothing else changes, existing services stay
-- uncategorised until you pick one. The app works without it (grouping simply falls back to "Other").
-- Additive and reversible: `alter table public.services drop column category;`
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.services
  add column if not exists category text check (category is null or length(category) between 1 and 80);

comment on column public.services.category is
  'Optional grouping label for the catalogue (free text, max 80 characters).';
