# Agency Zero — Build Progress & Roadmap

Tracks **what is built, what is being built, and what comes next**.
Update the phase tables and the change log as work completes. Requirements live in
[MASTER_SPEC.md](./MASTER_SPEC.md); this file tracks execution.

Legend: `[ ]` not started · `[~]` in progress · `[x]` done

---

## Current status

| | |
|---|---|
| **Current phase** | Phase 0 — Foundation & Documentation |
| **Next up** | Phase 1 — App scaffold, auth & design system |
| **Blocked by** | Nothing |

---

## Phased roadmap

### Phase 0 — Foundation & Documentation `IN PROGRESS`

Goal: lock in requirements and architecture before any code.

- [x] Create /docs/MASTER_SPEC.md (source of truth)
- [x] Create /docs/DECISIONS.md
- [x] Create /docs/IDEAS_BACKLOG.md
- [x] Create /docs/BUILD_PROGRESS.md (this file)
- [x] Create /docs/DATABASE_PLAN.md
- [x] Write root README explaining Agency Zero

### Phase 1 — App scaffold, Auth & Design system `NOT STARTED`

Goal: a running Next.js + TypeScript + Tailwind + Supabase skeleton with the monochrome design system and owner login.

- [ ] Next.js (TypeScript) project scaffold with Tailwind
- [ ] Supabase project wiring (Postgres, Auth, Storage) + environment config
- [ ] Supabase Auth: owner login (email/password to start)
- [ ] First migrations for core tables (clients, projects, tasks) from DATABASE_PLAN.md
- [ ] Monochrome design tokens: grayscale palette, typography scale, spacing, minimal card/border styles
- [ ] App shell: sidebar/navigation, empty dashboard page, desktop-first responsive layout

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
