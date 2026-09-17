# Agency Zero

A private, lightweight agency CRM / operating system — built for a solo operator running an agency that sells:

**software development · custom CRMs & software · websites · SEO · Meta ads · social media management · social video creation**

Agency Zero manages the full lifecycle in one place: clients, projects, tasks, workload planning, a calendar, quotes → contracts → invoices → payments, social media and marketing delivery (Meta Ads, SEO), an AI assistant, reminders, a profitability view, and eventually a client-facing portal.

## Status

📋 **Documentation phase (Phase 0).** Requirements and architecture are locked in before any application code is written. See the roadmap in [`docs/BUILD_PROGRESS.md`](docs/BUILD_PROGRESS.md).

## Tech direction

- **Next.js** + **TypeScript**
- **Supabase** — Postgres, Auth, Storage
- **Tailwind CSS**
- Stripe, Google Calendar, Meta, Search Console, and GA4 integrations are **deferred**; the architecture is designed so they can be added later.

## Design

Extremely simple black-and-white UI: black, white, and grayscale only. Minimal borders, minimal cards, lots of spacing, clean typography. No gradients, no bright accent colors, no clutter. Desktop-first, mobile usable. **Speed and usability over flashy design.**

## Documentation

The docs in [`/docs`](docs/) are the permanent record — future AI agents and developers must read these first:

| Document | Purpose |
|---|---|
| [`docs/MASTER_SPEC.md`](docs/MASTER_SPEC.md) | **Source of truth.** All requirements. Never remove a requirement unless the owner explicitly says so; new ideas are merged into existing sections. |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Decision log — what was decided, when, and why. |
| [`docs/IDEAS_BACKLOG.md`](docs/IDEAS_BACKLOG.md) | Future / incomplete ideas, waiting to be confirmed. |
| [`docs/BUILD_PROGRESS.md`](docs/BUILD_PROGRESS.md) | Phased roadmap and current build status. |
| [`docs/DATABASE_PLAN.md`](docs/DATABASE_PLAN.md) | Preliminary database entity plan. |

## Ground rules for agents working on this repo

1. `docs/MASTER_SPEC.md` is the single source of truth and is additive-only.
2. Build in phases — do not attempt every integration at once.
3. The AI assistant never silently performs high-impact financial or ad-spend actions; it recommends, the owner approves.
