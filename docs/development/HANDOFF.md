# Handoff log (newest first)

## 2026-09-28 — Claude — audit & doc system
**Did**: full audit of main (see AUDIT.md); created AGENTS.md and docs/development/
(VISION, ROADMAP, ACTIVE, BUGS, IDEAS [moved from docs/IDEAS_BACKLOG.md], HANDOFF,
AUDIT); added CI workflow; fixed doc links to IDEAS.
**Verified**: `npm ci`, eslint, `tsc --noEmit`, `next build` pass on main.
**Not verified**: live Supabase, prod sign-up setting, Cloudflare deploy, browser UX.
**Migrations/deploy required**: none. (Next migration number is 0014.)
**Next**: owner reviews AUDIT.md/ROADMAP.md; then P0 (owner-only RLS, 0009 drift).
Do not refactor before that review.
