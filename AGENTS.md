# AGENTS.md — Agency Zero

Instructions for every coding agent (Claude, Arena, or human) working in this repo.
Agency Zero is the owner's **private operating system for running an agency**
(CRM/software, websites, SEO, Meta ads, social, video). Production, single owner.

## Do NOT trust previous agent reports
Verify claims against the code and migrations in `main`. `docs/development/AUDIT.md`
records what was verified and when.

## Session protocol (every session)
1. **Read**, in order: this file → `docs/development/VISION.md` → `ACTIVE.md` →
   `HANDOFF.md` → `ROADMAP.md` → `BUGS.md`. Skim `AUDIT.md`. For requirements
   consult `docs/MASTER_SPEC.md` (source of truth, additive-only) and
   `docs/DECISIONS.md`.
2. **Claim work** in `ACTIVE.md` (one line: what, branch, migrations touched).
3. **Implement** on your designated branch. Small, reviewable commits.
4. **Test**: `npm run lint && npx tsc --noEmit && npm test && npm run build` must pass
   (CI runs the same). For SQL changes also run `npm run test:db`
   (`supabase/tests/run.sh`, needs local Postgres via PG* env) and add a case to
   `supabase/tests/*.test.sql` (owner / stranger / anon).
5. **Update docs**: ACTIVE (move to done), ROADMAP (tick), BUGS/IDEAS (add what you found),
   `docs/DATABASE_PLAN.md` migration table, `docs/DECISIONS.md` for any new decision.
6. **Leave a handoff** in `HANDOFF.md` (top entry, newest first): what changed,
   what's unverified, next step.
7. **State migration/deployment requirements** explicitly in the handoff:
   which migration numbers must be applied, in what order, and any env/config change.

## Doc map
| File | Purpose |
|---|---|
| `docs/development/VISION.md` | Customer-first product vision + design rules |
| `docs/development/ROADMAP.md` | Prioritized plan (supersedes phase list in `docs/BUILD_PROGRESS.md`) |
| `docs/development/ACTIVE.md` | Work in flight right now |
| `docs/development/BUGS.md` | Known defects |
| `docs/development/IDEAS.md` | Unscheduled ideas (was `docs/IDEAS_BACKLOG.md`) |
| `docs/development/HANDOFF.md` | Session-to-session notes, newest first |
| `docs/development/AUDIT.md` | Latest verified audit of main |
| `docs/development/DESIGN_SYSTEM.md` | Public-site design system, primitives, sources, performance rules |
| `docs/development/SITE_CONTENT.md` | Placeholder content/assets the owner must supply |
| `docs/BUILD_PROGRESS.md` | Historical change log (append-only; no longer the roadmap) |
| `docs/MASTER_SPEC.md`, `DECISIONS.md`, `DATABASE_PLAN.md`, `DEPLOYMENT.md` | Reference |

## Branching: always finish on `main`
Owner standing instruction (2026-10-03): when work is complete and checks pass, **push it to `main`** (fast-forward; do not leave finished work
only on a feature branch). Verify `git fetch` shows `main` is an ancestor first; never force-push.

## ⚠ A push is a deploy
Cloudflare Workers Builds builds (and may publish) every push, including feature branches. Never assume "I'll tell the owner to apply
migrations before deploying" — by then it is already building. Code must tolerate the production database being **behind** (see
`src/lib/access.ts` "legacy" state, `get_revenue_summary` / `leads` degrading gracefully). Details: `docs/DEPLOYMENT.md`.

## Two products, one repo
- **Public marketing site** — `src/app/(site)`, `src/components/site`, `src/content`, dark design system
  (`docs/development/DESIGN_SYSTEM.md`). Public, static, no login. Content to replace: `docs/development/SITE_CONTENT.md`.
- **CRM** — `src/app/app/**` (URL `/app/**`), light system. Protected by proxy + `is_owner()` layout + RLS.
  All in-app links use `appPath()` / `crmHref()` from `src/lib/routes.ts`.
- Never import site components into the CRM or the reverse. Public pages must never read CRM tables (only the
  narrow anonymous RPCs `submit_lead`, `get_public_*`, `respond_public_quote`, `sign_public_contract`).

## Engineering rules
- **Customer-first**: work belongs inside `Client → Project → …` workspaces. Global
  pages (`/tasks`, `/invoices`…) are cross-cutting views, not the primary place to work.
- **Migrations are append-only.** Never edit an applied migration. Next number is
  **0026**. `0009` is intentionally missing (see AUDIT.md §Migrations).
- **RLS on every table.** Policies must use the owner check, not just "authenticated"
  (see ROADMAP P0). New `security definer` functions need `set search_path`, an
  explicit `revoke ... from public` and targeted grants.
- **Money = integer minor units.** Durations = minutes. Dates in UTC / `date`.
- **No writes on render** (including "mark viewed" — see BUGS).
- **One read model per workspace page** (RPC returning jsonb) instead of N queries;
  always bound list queries (`limit`/pagination).
- **Server actions**: import from `src/lib/actions.ts` (`getUserClient`, parsers,
  `notFoundWhenNoRows` with `{ count: "exact" }`); never paste another `getUserClient`;
  multi-row writes go through an RPC (atomic); never hard-delete financial records.
- **No fake UI**: unbuilt features show honest "planned" states.
- **AI is later.** AI never mutates records without an explicit confirmation step.
- Match existing code style; no minified one-liners.
- Never commit secrets; `.env.example` lists required variables.
