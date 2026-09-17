# Agency Zero — Build Progress & Roadmap

Tracks **what is built, what is being built, and what comes next**.
Update the phase tables and the change log as work completes. Requirements live in
[MASTER_SPEC.md](./MASTER_SPEC.md); this file tracks execution.

Legend: `[ ]` not started · `[~]` in progress · `[x]` done

---

## Current status

| | |
|---|---|
| **Current phase** | Phase 1 — App scaffold, Auth & Design system *(code complete — pending first live Supabase login)* |
| **Next up** | Phase 2 — Clients & Contacts |
| **Blocked by** | Nothing in code. Owner action: provision a Supabase project, apply migrations, create the owner user (see `supabase/README.md`). |

---

## Phased roadmap

### Phase 0 — Foundation & Documentation `DONE`

Goal: lock in requirements and architecture before any code.

- [x] Create /docs/MASTER_SPEC.md (source of truth)
- [x] Create /docs/DECISIONS.md
- [x] Create /docs/IDEAS_BACKLOG.md
- [x] Create /docs/BUILD_PROGRESS.md (this file)
- [x] Create /docs/DATABASE_PLAN.md
- [x] Write root README explaining Agency Zero

### Phase 1 — App scaffold, Auth & Design system `IN PROGRESS` — code complete, verify against live Supabase

Goal: a running Next.js + TypeScript + Tailwind + Supabase skeleton with the monochrome design system and owner login.

- [x] Next.js (TypeScript) project scaffold with Tailwind — Next.js 16 (App Router, src dir), Tailwind v4, ESLint 9
- [x] Supabase project wiring (Postgres, Auth, Storage) + environment config — `@supabase/supabase-js` + `@supabase/ssr`; server/browser client helpers; `src/proxy.ts` (Next 16 middleware) refreshes sessions and protects all routes; `.env.example` template
- [x] Supabase Auth: owner login (email/password to start) — `/login` form, `/auth/callback` code exchange, sign-out server action; no sign-up page by design (owner created in Supabase — D-003)
- [x] First migrations for core tables from DATABASE_PLAN.md — `supabase/migrations/0001–0004`: profiles + settings (with auto-create trigger), clients, projects, tasks; enums, indexes, `updated_at` triggers, RLS on every table. (Clients/projects/tasks schema pulled forward from Phases 2–3 per owner instruction — see D-017; CRUD UIs still land in Phases 2–3.)
- [x] Monochrome design tokens: grayscale palette, typography scale, spacing, minimal card/border styles — Tailwind v4 `@theme` tokens (background / foreground / muted / border / muted-foreground / faint-foreground / inverted), hairline dividers instead of cards, system font stack (D-016)
- [x] App shell: sidebar/navigation, empty dashboard page, desktop-first responsive layout — fixed sidebar ≥ lg, slide-over drawer on mobile, 11 nav sections (Dashboard, Clients, Projects, Tasks, Calendar, Quotes, Contracts, Invoices, Social, Marketing, Settings), working sign-out
- [x] Useful empty/loading/error states — honest per-phase empty states (no dead buttons), grayscale loading skeletons, `error.tsx` boundaries (app + root), `not-found.tsx`, "Supabase not configured" and "migrations not applied" setup states, dashboard shows real DB counts (zeros while empty)
- [x] `npm run lint`, `npx tsc --noEmit`, `npm run build` all pass; routes smoke-tested (unauthenticated → redirected to `/login`; unconfigured → setup states, zero server errors)

> **To close Phase 1:** apply migrations to a real Supabase project, create the owner user, verify sign-in end-to-end, disable public sign-ups (steps in `supabase/README.md`).

### Phase 2 — Clients & Contacts `NOT STARTED`

Goal: the CRM core.

- [ ] Clients CRUD with status
- [ ] Contacts per client
- [ ] Client notes
- [ ] Client files (Supabase Storage)
- [ ] Communication history log
- [ ] Services being provided per client

### Phase 3 — Projects & Tasks `NOT STARTED`

Goal: delivery engine.

- [ ] Projects CRUD (per client, status, value, deadlines, estimated/actual hours, progress)
- [ ] Milestones
- [ ] Tasks & subtasks with priorities, due dates, estimated/actual time
- [ ] Task dependencies
- [ ] Blocked / waiting-on-client status
- [ ] Recurring tasks
- [ ] Task reminders

### Phase 4 — Workload, Calendar & Reminders `NOT STARTED`

Goal: the operator's day, planned.

- [ ] Available work hours per day
- [ ] Overloaded-day detection
- [ ] Daily & weekly planning views
- [ ] Calendar: deadlines, tasks, milestones, meetings, planned work blocks
- [ ] Reminder engine (due soon, overdue, client not responded, quote awaiting response, unsigned contract, invoice due/overdue, project deadline approaching, overloaded schedule)

### Phase 5 — Quotes, Contracts, Invoices & Payments `NOT STARTED`

Goal: get paid.

- [ ] Quotes: line items, discounts, recurring services, taxes
- [ ] Public secure quote links: view, accept/reject, viewed/accepted dates
- [ ] Convert accepted quote → project
- [ ] Contracts: linked to quotes/projects, templates, version history
- [ ] Public secure contract links: view + electronic sign; store signed timestamp & signed document
- [ ] Invoices: line items, deposits, partial payments, remaining balance, due dates
- [ ] Paid / unpaid / overdue status; manually record external payments
- [ ] Payment history per client; revenue tracking

### Phase 6 — AI Assistant v1 `NOT STARTED`

Goal: the assistant earns its place. (Respects D-008: never silently performs high-impact actions.)

- [ ] Daily briefing (overdue work, blocked work, upcoming deadlines)
- [ ] Client status summaries
- [ ] Workload scheduling help / rebalance suggestions
- [ ] Create tasks from natural language

### Phase 7 — Social Media Pipeline `NOT STARTED`

Goal: manage content delivery.

- [ ] Content pipeline: ideas → scripts → filming → editing → client approval → scheduled → published
- [ ] Social content calendar
- [ ] (Analytics deferred — see IDEAS_BACKLOG §3)

### Phase 8 — Profitability & Reporting `NOT STARTED`

Goal: know the numbers.

- [ ] Revenue by client/project
- [ ] Estimated vs actual hours
- [ ] Expenses
- [ ] Effective hourly rate
- [ ] Profitability views

### Phase 9 — Client Portal `NOT STARTED` — `Later phase`

Goal: clients self-serve (MASTER_SPEC §4.14).

- [ ] Client access & security model
- [ ] Projects, milestones, progress view
- [ ] Invoices, quotes, contracts view
- [ ] Files, approvals, waiting-on requests

### Phase 10 — External Integrations `NOT STARTED` — `Future integration`

Goal: wire the outside world, one provider at a time. (Deferred by design — D-007.)

- [ ] Stripe: pay invoices online, sync payment status
- [ ] Google Calendar: two-way sync
- [ ] Meta Ads: connect client ad accounts, pull campaign/ad-set/ad metrics (spend, CTR, CPC, CPM, leads, CPL, CPA, ROAS, frequency)

### Phase 11 — Marketing Intelligence & Advanced AI `NOT STARTED` — `Future integration`

Goal: AI on top of marketing data (respects the §4.10/§4.12 safety rules).

- [ ] SEO: Search Console + GA4 data (keywords/queries, pages, clicks/impressions, ranking opportunities, SEO task recommendations, client reports)
- [ ] AI ad analysis: problems, opportunities, recommendations
- [ ] Ad-change approval flow (AI proposes → user approves)
- [ ] Optional guarded automation (bounded, pre-approved rules)
- [ ] Marketing anomaly alerts

---

## Change log

| Date | Update |
|---|---|
| 2026-09-17 | Roadmap created. Phase 0 documentation completed (all 5 docs + README). |
| 2026-09-17 | **Phase 1 built:** Next.js 16 + TypeScript + Tailwind v4 scaffold; Supabase Auth (owner login, session proxy, sign-out, callback); monochrome design system; responsive app shell with all 11 nav sections; honest empty/loading/error states. Initial migrations 0001–0004 (profiles, settings, clients, projects, tasks) with RLS — clients/projects/tasks schema pulled forward from Phases 2–3 per owner instruction (D-017). Lint, typecheck, and build pass. Remaining: apply migrations to a live Supabase project + first real login. |
