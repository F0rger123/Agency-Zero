# Agency Zero — Master Specification

> **This document is the single source of truth for Agency Zero.**
> Every requirement here stays valid until the user explicitly removes it.
> New ideas are **merged into the correct section** — never replace older requirements.
>
> Companion documents:
> - [DECISIONS.md](./DECISIONS.md) — decision log (why things are the way they are)
> - [IDEAS_BACKLOG.md](./IDEAS_BACKLOG.md) — future / incomplete ideas
> - [BUILD_PROGRESS.md](./BUILD_PROGRESS.md) — phased roadmap and build status
> - [DATABASE_PLAN.md](./DATABASE_PLAN.md) — preliminary database entity plan

---

## 1. Document governance

Rules for any AI agent or developer editing this repo:

1. **MASTER_SPEC.md is the source of truth.** If code and this document disagree, the document wins until the document is updated.
2. **Never remove an existing requirement** unless the user explicitly says to remove it.
3. When the user gives new ideas, **merge them into the matching section** below instead of replacing older requirements.
4. Requirements that are **not yet scheduled** belong in IDEAS_BACKLOG.md; move them into a section here only when the user confirms them as requirements.
5. Record every meaningful choice (stack, pattern, scope cut) in DECISIONS.md with a date.
6. Keep BUILD_PROGRESS.md updated as work completes — it is the record of what is actually built.

Status labels used in this document:

| Label | Meaning |
|---|---|
| `Core` | Required in the main build of the app. |
| `Later phase` | Required eventually, explicitly deferred (e.g. Client Portal). |
| `Future integration` | Depends on an external service; deferred (Stripe, Google Calendar, Meta, Search Console, GA4). |

---

## 2. Product overview

**Agency Zero** is a **private web app**: a lightweight agency CRM / operating system for a solo operator who runs an agency selling:

- software development
- custom CRMs / custom software
- websites
- SEO
- Meta ads
- social media management
- social video creation

It manages the full agency lifecycle in one place:

**Clients → Projects → Tasks → Schedule/Workload → Sales (Quotes → Contracts → Invoices → Payments) → Delivery services (Social, Meta Ads, SEO) → Profitability**, supported by an **AI assistant**, **reminders**, and eventually a **client portal**.

Guiding priorities, in order:

1. Speed and usability over flashy design.
2. One place for everything the agency does — no tool sprawl.
3. AI assists and recommends; it never silently takes high-impact actions.
4. Build in phases; integrations come later (see Phase map in [BUILD_PROGRESS.md](./BUILD_PROGRESS.md)).

---

## 3. UI / Design system

The app must be **extremely simple black-and-white**:

- App name: **Agency Zero**
- Black, white, and grayscale **only** — no other hues
- **No gradients**
- **No bright accent colors**
- Minimal borders
- Minimal cards — use spacing and typography to separate content instead
- Lots of spacing / whitespace
- Clean typography
- No clutter
- Simple, modern dashboard style
- **Desktop-first**, but mobile usable
- **Prioritize speed and usability over flashy design**

Implications for implementation (recorded as guidance, derived from the rules above):

- Define a small grayscale token set (text, muted text, borders, surfaces, inverted surfaces) in the Tailwind config and reuse it everywhere.
- Emphasis is done with weight, size, and contrast — not color.
- States like "overdue", "blocked", "accepted", "paid" are communicated with text labels and monochrome fills/outlines, never color alone.

---

## 4. Functional specifications

### 4.1 Clients & Contacts — `Core`

- Clients and contacts (multiple contacts per client).
- Notes per client.
- Files per client.
- Communication history (log of calls, emails, meetings, messages).
- Services being provided to each client (from the agency service list in §2).
- Client status (active, lead, past, etc. — exact status list is an implementation detail to confirm during build).

### 4.2 Projects — `Core`

- Multiple projects per client.
- Milestones per project.
- Deadlines per project.
- Project status.
- Progress tracking.
- Project value (money).
- Estimated hours.
- Actual hours.

### 4.3 Tasks — `Core`

- Tasks and subtasks (nesting).
- Priorities.
- Due dates.
- Estimated time.
- Actual time.
- Dependencies between tasks (a task can be blocked by another).
- Recurring tasks.
- **Blocked / "waiting on client" status** — a task can be marked as waiting on the client.
- Reminders on tasks.

### 4.4 Workload — `Core`

- Set available work hours per day.
- Show **overloaded days** (scheduled work > available hours).
- AI can suggest how to rebalance work across days.
- Daily and weekly planning views.

### 4.5 Calendar — `Core`

The calendar shows:

- Deadlines
- Tasks
- Milestones
- Meetings
- Planned work blocks

- Eventually: **Google Calendar integration** (`Future integration`).

### 4.6 Quotes / Proposals — `Core`

- Create quotes / proposals.
- Line items.
- Discounts.
- Recurring services (recurring line items).
- Taxes if needed.
- Send the customer a **public secure link** to view the quote.
- Customer can view the quote via that link (no account needed).
- Customer can **accept or reject** the quote.
- Track viewed / accepted dates.
- Convert an accepted quote into a project.

### 4.7 Contracts — `Core`

- Contracts linked to quotes and/or projects.
- Customer can view and **electronically sign** the contract via a secure link.
- Store the **signed timestamp** and the **signed document**.
- Contract templates.
- Version history of contracts.

### 4.8 Payments / Invoices — `Core` (manual) + `Future integration` (Stripe)

- Invoices.
- Deposits.
- Partial payments.
- Remaining balance tracking.
- Payment due dates.
- Status: paid / unpaid / overdue.
- **Manually record external payments** (bank transfer, cash, etc.).
- Eventually: **Stripe integration** (`Future integration`).
- Payment history per client.
- Revenue tracking.

### 4.9 Social Media — `Core`

A social content pipeline with these stages:

1. Content ideas
2. Scripts
3. Filming
4. Editing
5. Client approval
6. Scheduled
7. Published

Plus:

- Social content calendar.
- Analytics later (`Future integration` / `Later phase`).

### 4.10 Meta Ads — `Future integration` (data) + AI guidance

- Connect client Meta ad accounts **later** (`Future integration`).
- Campaign / ad set / ad performance metrics, including: **spend, CTR, CPC, CPM, leads, CPL, CPA, ROAS, frequency**.
- AI detects problems and opportunities in ad performance.
- AI gives recommendations.
- **AI must NOT make unrestricted spending changes.** Hard safety rule.
- Future **approval flow**: AI proposes changes → user approves before anything is applied.
- Later: optional **guarded automation** (bounded, pre-approved rules only).

### 4.11 SEO — `Future integration` (data) + `Core` task/report output

- Search Console and GA4 integration later (`Future integration`).
- Keyword / query performance.
- Page performance.
- Organic clicks / impressions.
- Ranking opportunities.
- SEO task recommendations (can be created as Agency Zero tasks).
- Client reports.

### 4.12 AI Assistant — `Core` assistant, phased capabilities

The AI assistant must:

- Give a **daily briefing**.
- Identify **overdue work**.
- Identify **blocked work**.
- Identify **upcoming deadlines**.
- Summarize **client status**.
- Help **schedule workload** (including rebalancing overloaded days, see §4.4).
- **Create tasks from natural language**.
- Eventually: analyze **Meta ads** and **SEO** data.
- **Never silently perform high-impact financial or ad-spend actions** — hard safety rule, applies everywhere (see §4.10 and [DECISIONS.md](./DECISIONS.md)).

### 4.13 Reminders — `Core`

Reminder triggers:

- Task due soon.
- Overdue task.
- Client has not responded.
- Quote awaiting response.
- Unsigned contract.
- Invoice due / invoice overdue.
- Project approaching deadline.
- Overloaded schedule.
- Marketing anomaly alerts later (`Future integration`).

### 4.14 Client Portal — `Later phase`

An authenticated (or securely tokenized) portal where the client can see:

- Projects
- Milestones
- Progress
- Invoices
- Quotes
- Contracts
- Files
- Approvals
- Requests / items we are waiting on from the client

### 4.15 Profitability & Reporting — `Core`

- Revenue by client and by project.
- Estimated vs actual hours.
- Expenses.
- **Effective hourly rate** (revenue ÷ actual hours).
- Profitability per client / project.

---

## 5. Technical direction

- **Framework:** Next.js
- **Language:** TypeScript
- **Database:** Supabase / Postgres
- **Auth:** Supabase Auth
- **File storage:** Supabase Storage where appropriate
- **Styling:** Tailwind CSS
- **Architecture requirement:** the architecture must make the following integrations possible later, even though they are **not** built now:
  - Stripe (payments)
  - Google Calendar
  - Meta (ad accounts / marketing API)
  - Google Search Console
  - GA4

Architectural guidance (how to honor the requirement above):

- Keep external-integration code behind a provider/adapter boundary (e.g. a `lib/integrations/<provider>/` module with a stable interface), so providers can be added without rewriting feature code.
- Store integration credentials/connections in dedicated tables (see [DATABASE_PLAN.md](./DATABASE_PLAN.md)) rather than hard-coding.
- Store money as integer minor units (cents) with a currency field; store durations consistently (hours vs minutes — pick one convention at build time and document it in DECISIONS.md).
- All timestamps in UTC; render in the user's timezone.

---

## 6. Non-goals and constraints

- **Do NOT attempt to build every integration now.** Stripe, Google Calendar, Meta, Search Console, and GA4 integrations are deferred; only the architecture prepares for them (§5).
- This is a **private app** for the agency owner; it is not a multi-tenant SaaS product.
- AI is an **assistant and recommender**, never an autonomous actor for money or ad spend (§4.10, §4.12).
- No bright colors, gradients, or decorative UI (§3).

---

## 7. Requirement change log

| Date | Change |
|---|---|
| 2026-09-17 | Initial specification created from the founding requirements. |
