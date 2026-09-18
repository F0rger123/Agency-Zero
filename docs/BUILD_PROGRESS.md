# Agency Zero — Build Progress & Roadmap

Tracks **what is built, what is being built, and what comes next**.
Update the phase tables and the change log as work completes. Requirements live in
[MASTER_SPEC.md](./MASTER_SPEC.md); this file tracks execution.

Legend: `[ ]` not started · `[~]` in progress · `[x]` done

---

## Current status

| | |
|---|---|
| **Current phase** | Phases 4–5 + production UX/sales hardening pass *(code complete — pending live Supabase verification)* |
| **Next up** | Phase 6 — AI Assistant v1 |
| **Blocked by** | Nothing in code. Owner action: provision a Supabase project, apply migrations `0001`–`0008`, create the owner user, and verify the core CRUD/public-link flows (see `supabase/README.md`). |

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
- [x] App shell: sidebar/navigation, empty dashboard page, desktop-first responsive layout — fixed sidebar ≥ lg, slide-over drawer on mobile, 13 nav sections (Dashboard, Clients, Projects, Tasks, Calendar, Workload, Reminders, Quotes, Contracts, Invoices, Social, Marketing, Settings), working sign-out
- [x] Useful empty/loading/error states — honest per-phase empty states (no dead buttons), grayscale loading skeletons, `error.tsx` boundaries (app + root), `not-found.tsx`, "Supabase not configured" and "migrations not applied" setup states, dashboard shows real DB counts (zeros while empty)
- [x] `npm run lint`, `npx tsc --noEmit`, `npm run build` all pass; routes smoke-tested (unauthenticated → redirected to `/login`; unconfigured → setup states, zero server errors)

> **To close Phase 1:** apply migrations to a real Supabase project, create the owner user, verify sign-in end-to-end, disable public sign-ups (steps in `supabase/README.md`).

### Phase 2 — Clients & Contacts `DONE` — code complete, verify against live Supabase

Goal: the CRM core.

- [x] Clients create/edit/archive CRUD with status and server-side validation
- [x] Contacts per client (multiple contacts, primary flag, remove)
- [x] Client notes (pinned notes, remove)
- [x] Client files via private Supabase Storage bucket with signed downloads (10 MB validation)
- [x] Communication history log (channel, direction, contact, timestamp, summary)
- [x] Services catalogue and services assigned to each client
- [x] Useful client detail route with projects and all CRM sections

### Phase 3 — Projects & Tasks `DONE` — code complete, verify against live Supabase

Goal: delivery engine.

- [x] Projects create/edit/archive CRUD per client with status, value, deadlines, estimated/actual hours, and progress
- [x] Milestones with due dates, completion, ordering, edit, and removal
- [x] Tasks create/edit/delete/complete with priorities, due dates, estimated/actual time
- [x] Subtasks via parent task nesting
- [x] Task assignment to client, project, and milestone
- [x] Task dependency chain plus many-to-many dependency table architecture
- [x] Blocked / waiting-on-client status
- [x] Recurring-task JSON rule architecture and recurring template table
- [x] Manual time entries for task/project actual-time history
- [x] Dashboard live views for due today, overdue, upcoming deadlines, active projects, waiting-on-client items, and recent activity

### Phase 4 — Workload, Calendar & Reminders `DONE` — code complete, verify against live Supabase

Goal: the operator's day, planned.

- [x] Weekly default and date-specific available work capacity
- [x] Overloaded-day detection with available vs scheduled time
- [x] Daily, weekly, and monthly calendar views
- [x] Calendar: deadlines, tasks, milestones, meetings, and planned work blocks
- [x] Meeting/work-block create, edit, delete, and task rescheduling
- [x] Reminder engine for due soon, overdue, waiting-on-client, client-no-response, quote response, unsigned contract, invoice due/overdue, project deadlines, overloaded schedule, and custom reminders

### Phase 5 — Quotes, Contracts, Invoices & Payments `DONE` — code complete, verify against live Supabase

Goal: get paid.

- [x] Quotes with line items, quantities, pricing, discounts, recurring services, and taxes
- [x] Quote lifecycle: draft, sent, viewed, accepted, rejected, expired
- [x] Secure hashed-token public quote links with viewed timestamp and accept/reject actions
- [x] Convert accepted quotes into planning projects
- [x] Contracts linked to clients, quotes, and/or projects
- [x] Contract templates, immutable version history, secure public links, electronic signature, signer name, timestamp, and preserved signed snapshot
- [x] Invoices with line items, deposits, partial payments, remaining balances, due dates, and lifecycle states
- [x] Manual external payments with method, reference, note, and payment history
- [x] Revenue and outstanding-balance tracking; Stripe remains deferred

### Deployment readiness pass `DONE` — external setup remains with the owner

- [x] Audited migrations `0001` through `0007` for numeric order, fresh-project dependencies, RLS coverage, Storage setup, and the narrow public RPC boundary; the Supabase CLI config now supports recorded migration history.
- [x] Audited environment usage; `.env.example` contains the three required application variables and no secrets are committed.
- [x] Added current Cloudflare OpenNext configuration: `open-next.config.ts`, `wrangler.jsonc`, generated `cloudflare-env.d.ts`, package scripts, and ignored build/local-secret output.
- [x] Verified the Next.js `16.3.5` OpenNext build and local Workers preview without Supabase credentials; no deployment or external account creation was attempted.
- [x] Documented production Auth URL/sign-up settings and exact Cloudflare build/runtime variable setup in `docs/DEPLOYMENT.md` and `supabase/README.md`.
- [ ] Owner applies migrations `0001`–`0008`, configures the Supabase project and Auth, supplies the three production variables to Cloudflare, deploys, and exercises real owner/customer flows.

### Production UX & sales hardening pass `DONE` — code complete, apply migration `0008`

Goal: close the remaining production blockers in Settings, navigation speed, and the client-facing sales documents; harden the database functions. (D-028 … D-032.)

- [x] Editable, persistent Settings: owner profile (name, timezone, currency, daily capacity) and workspace defaults (business name, address, tax ID, currency/tax defaults, quote/invoice prefixes) now save to `profiles` / `settings` through validated server actions.
- [x] Faster sidebar/page navigation: nav routes prefetched on hover/focus and during idle time after mount; client router cache holds dynamic pages for 30s (`staleTimes.dynamic`); server actions still revalidate after every mutation.
- [x] Larger Agency Zero wordmark (bold `text-xl`) with a subtle, pure-CSS monochrome glitch (two grayscale tear layers on a 7s cycle; disabled under `prefers-reduced-motion`).
- [x] Client-ready quotes: line items gain `details`, `option_group`, and `selection` (`fixed` included scope · `optional` add-on checkboxes · `choice` mutually exclusive package picks per option group); recurring pricing stays line-level with public per-period totals; proposal notes are shown publicly; public links can be rotated (old token revoked); customers select options and accept/reject with their name, with server-computed accepted totals.
- [x] Working editable contract templates: placeholder rendering on save (`{{business_name}}`, `{{client_name}}`, `{{client_company}}`, `{{contract_title}}`, `{{quote_number}}`, `{{date}}`), empty-body template fill, seeded "Standard services agreement", contract view tracking via `mark_public_contract_viewed`, signing-link rotation; the public signing flow records signer, timestamp, and immutable snapshot.
- [x] Immutability (migration `0008` triggers): accepted quotes, their line items, signed contracts, and `contract_versions` rows cannot be edited or deleted by any role; only bookkeeping columns (token rotation, `converted_project_id`, association links, `updated_at`) stay writable.
- [x] Migration `0008_security_hardening.sql`: pins `public.set_updated_at()` to `search_path = public`; revokes EXECUTE on `public.handle_new_user()` and `public.recalculate_invoice_payment()` from `public`, `anon`, `authenticated` (trigger invocation is unaffected); ships everything above. Migrations `0001`–`0007` are untouched.
- [x] Migration `0001`–`0008` apply cleanly against a fresh PostgreSQL instance, and the new triggers/RPCs were behaviourally verified (selection validation, accepted totals, immutability, token rotation, revokes).
- [x] `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npx opennextjs-cloudflare build`, `npx wrangler deploy --dry-run`, and `git diff --check` all pass.

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
| 2026-09-17 | **Phases 2–3 built:** migration `0005_crm_core.sql` adds services, contacts, notes, private files, communications, client services, milestones, task assignment fields, task dependencies, recurring-task architecture, and time entries — all with RLS. Added validated server actions and responsive CRUD/detail routes for clients, projects, milestones, tasks, subtasks, dependencies, and time entries; client files use private Storage with signed links. Dashboard now reads live due-today, overdue, deadline, active-project, waiting-on-client, and recent-activity data. Lint, typecheck, build, and unconfigured smoke tests pass. Remaining: apply migrations to a live Supabase project and exercise CRUD end-to-end. |
| 2026-09-17 | **Phases 4–5 built:** migrations `0006_sales.sql` and `0007_planning_and_reminders.sql` add owner-only sales, calendar, capacity, and reminder tables plus narrow hashed-token public quote/contract functions. Added validated sales CRUD/detail routes, customer quote acceptance/rejection, quote-to-project conversion, electronic contract signing with immutable versions and snapshots, manual invoice payments and derived balances, daily/weekly/monthly calendar views, workload capacity/overload calculations, task rescheduling, and dynamic/custom reminders. Added `/q/[token]` and `/c/[token]` public surfaces without fake integrations. Lint, typecheck, build, and unconfigured smoke tests pass. Remaining: apply migrations to a live Supabase project and exercise owner/customer flows end-to-end. |
| 2026-09-17 | **Deployment readiness pass:** audited fresh-project migration order/dependencies and RLS coverage; added Supabase CLI config, `.env.example` coverage, Cloudflare OpenNext/Wrangler configuration for Next.js `16.3.5`, generated binding types, and exact production Auth/Cloudflare setup docs. `npx opennextjs-cloudflare build` and a no-credentials Workers preview pass; no deployment or external account creation was attempted. |
| 2026-09-18 | **Production UX & sales hardening pass:** editable persistent Settings; prefetched navigation with a 30s dynamic router cache; larger wordmark with a CSS-only monochrome glitch; client-ready quotes (packages/options, optional add-ons, recurring pricing, link rotation, customer selection + accept/reject with server-computed snapshots); placeholder-rendering contract templates plus a seeded standard agreement, contract view tracking, and signing-link rotation; trigger-enforced immutability for accepted quotes, their line items, signed contracts, and contract versions; migration `0008_security_hardening.sql` (pinned `set_updated_at()` search_path, EXECUTE revocations on trigger functions) verified against a fresh PostgreSQL instance together with `0001`–`0007`. Lint, typecheck, build, OpenNext build, Wrangler dry-run, and diff checks pass. Remaining: owner applies `0001`–`0008` and exercises the flows live. |
