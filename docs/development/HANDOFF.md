# Handoff log (newest first)

## 2026-10-01 — Claude — P0 hardening
**Did**: migrations `0014` (owner-only RLS via `app_owner`/`is_owner()`, incl. Storage) and `0015`
(`save_quote`/`save_invoice` atomic RPCs, payments RESTRICT, non-draft invoices undeletable);
`src/lib/actions.ts` shared layer + all action files moved onto it, reformatted, affected-row checks;
file delete resolves path from DB; invoice/quote create/update use the RPCs; public "viewed" now
via `ViewBeacon`; vitest (14 tests) + `supabase/tests` SQL suite + CI (app + database jobs);
`supabase/scripts/check-schema-drift.sh`.
**Verified**: lint, tsc, `npm test`, `next build`, and `supabase/tests/run.sh` (fresh Postgres 16 +
Supabase stub) all pass. NOT verified: against real Supabase, in a browser (forms posting to the
new RPCs, public pages beacon), or Cloudflare build.
**Migration/deploy requirements** (in order, only after `0001–0008,0010–0013` are in prod):
1. Check owner is oldest profile: `select id, full_name, created_at from public.profiles order by created_at;`
2. Apply `0014`, then `0015` (backup first). If login breaks: `update public.app_owner set user_id='<owner id>' where id=1;`
3. Deploy the app (it calls `save_quote`/`save_invoice`, so deploy AFTER 0015).
4. Smoke test: create+edit a quote and an invoice, record a payment, try deleting a sent invoice (should refuse),
   open a public quote link and confirm it flips to "viewed" after a few seconds.
5. Still disable public sign-ups in Supabase Auth.
**Blocked on owner**: prod schema dump for the missing `0009` (B-002) — run
`supabase db dump --linked --schema public -f prod.sql` then `supabase/scripts/check-schema-drift.sh prod.sql`.
Unknown risk: `0009` may contain objects/columns 0014/0015 interact with (e.g. extra policies — 0014 rewrites ALL
matching policies dynamically, which should cover them).
**Next**: P1 (work-item model with bugs/feature requests, phases) starting at migration `0016`.

## 2026-09-28 — Claude — audit & doc system
**Did**: full audit of main (see AUDIT.md); created AGENTS.md and docs/development/
(VISION, ROADMAP, ACTIVE, BUGS, IDEAS [moved from docs/IDEAS_BACKLOG.md], HANDOFF,
AUDIT); added CI workflow; fixed doc links to IDEAS.
**Verified**: `npm ci`, eslint, `tsc --noEmit`, `next build` pass on main.
**Not verified**: live Supabase, prod sign-up setting, Cloudflare deploy, browser UX.
**Migrations/deploy required**: none. (Next migration number is 0014.)
**Next**: owner reviews AUDIT.md/ROADMAP.md; then P0 (owner-only RLS, 0009 drift).
Do not refactor before that review.
