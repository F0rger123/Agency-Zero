# Agency Zero

A private, lightweight agency CRM / operating system — built for a solo operator running an agency that sells:

**software development · custom CRMs & software · websites · SEO · Meta ads · social media management · social video creation**

Agency Zero manages the full lifecycle in one place: clients, projects, tasks, workload planning, a calendar, quotes → contracts → invoices → payments, social media and marketing delivery (Meta Ads, SEO), an AI assistant, reminders, a profitability view, and eventually a client-facing portal.

## Status

🚧 **Phases 4–5 — Sales, scheduling, workload & reminders (code complete; pending live Supabase verification).**
The app now includes the CRM core plus quotes, line items, secure public quote acceptance, contract templates/versioning/signing, invoices, manual payments, revenue tracking, daily/weekly/monthly calendar views, capacity planning, overload detection, task rescheduling, and live/custom reminders. All internal tables use row-level security, tokenized public surfaces use narrow RPCs, and no mock data or Stripe/Google Calendar integrations are used.

**Remaining before the built phases are fully verified:** provision a Supabase project, apply `supabase/migrations/0001` through `0007`, create the owner user, and exercise the owner/customer sales and planning flows (see `supabase/README.md`).

## Tech stack

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS** v4 — black / white / grayscale only; no gradients, no accent colors
- **Supabase** — Postgres, Auth, Storage
- Stripe, Google Calendar, Meta, Search Console, and GA4 integrations are **deferred by design**; the architecture is prepared for them (adapter boundaries + integration-ready schema)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in all three variables
```

1. Create a Supabase project, configure Auth URLs, and apply migrations
   `0001` through `0007` in order — full instructions are in
   [`supabase/README.md`](supabase/README.md).
2. Create the owner account in Supabase (Authentication → Users → Add user) —
   there is **no sign-up page by design**.
3. `npm run dev` and sign in at `/login`.

For the Cloudflare Workers live-test setup, including exact build/runtime
variables and OpenNext configuration, read
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

### Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build (runs type checking) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type check |
| `npm run cf-typegen` | Generate Wrangler binding types |
| `npm run preview` | Build with OpenNext and run the local Workers runtime |
| `npm run deploy` | Build and deploy to Cloudflare (run only after setup) |

## Project structure

```
docs/            Requirements, decisions, roadmap, database plan (read these first)
supabase/        SQL migrations, CLI config + setup guide
src/app/         Routes: (app)/ dashboard + sections, login/, auth/callback
src/components/  App shell, icons, shared states
src/lib/         Supabase clients (server/browser/config), navigation
src/proxy.ts     Next.js 16 proxy (auth session + route protection)
open-next.config.ts / wrangler.jsonc  Cloudflare OpenNext Worker configuration
```

## Documentation

The docs in [`/docs`](docs/) are the permanent record — future AI agents and developers must read these first:

| Document | Purpose |
|---|---|
| [`docs/MASTER_SPEC.md`](docs/MASTER_SPEC.md) | **Source of truth.** All requirements. Never remove a requirement unless the owner explicitly says so; new ideas are merged into existing sections. |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Decision log — what was decided, when, and why. |
| [`docs/IDEAS_BACKLOG.md`](docs/IDEAS_BACKLOG.md) | Future / incomplete ideas, waiting to be confirmed. |
| [`docs/BUILD_PROGRESS.md`](docs/BUILD_PROGRESS.md) | Phased roadmap and current build status. |
| [`docs/DATABASE_PLAN.md`](docs/DATABASE_PLAN.md) | Database entity plan + migration log. |

## Ground rules for agents working on this repo

1. `docs/MASTER_SPEC.md` is the single source of truth and is additive-only.
2. Build in phases — do not attempt every integration at once.
3. The AI assistant never silently performs high-impact financial or ad-spend actions; it recommends, the owner approves.
4. No fake UI: unbuilt features get honest "planned" states, never dead buttons that pretend to work.
