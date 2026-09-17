# Agency Zero — Ideas Backlog

Parking lot for **future, incomplete, or unscheduled ideas**. Nothing here is a commitment —
items graduate into [MASTER_SPEC.md](./MASTER_SPEC.md) (or a phase in [BUILD_PROGRESS.md](./BUILD_PROGRESS.md))
only when the user confirms them.

Rules:

- Add new ideas at the bottom of their section; never delete ideas — mark them `Shelved` if dropped.
- Keep each idea short; link to MASTER_SPEC sections where a requirement already exists.

Statuses: `Idea` → `Exploring` → `Scheduled` (moved into spec/roadmap) → `Done` / `Shelved`.

---

## 1. Integrations

| Idea | Notes | Status |
|---|---|---|
| Stripe integration | Card payments on invoices, automatic payment status sync, webhooks. Spec: §4.8. | Idea (deferred) |
| Google Calendar integration | Two-way sync of meetings, deadlines, work blocks. Spec: §4.5. | Idea (deferred) |
| Meta Ads integration | Connect client ad accounts; pull campaign/ad-set/ad metrics (spend, CTR, CPC, CPM, leads, CPL, CPA, ROAS, frequency). Spec: §4.10. | Idea (deferred) |
| Google Search Console integration | Queries, clicks, impressions, page performance. Spec: §4.11. | Idea (deferred) |
| GA4 integration | Organic traffic + conversion data. Spec: §4.11. | Idea (deferred) |
| Email integration | Send/receive or at least log client emails into communication history automatically. | Idea |
| WhatsApp / SMS logging | Log client chats into communication history. | Idea |
| Website uptime/monitoring for maintained sites | Alert when a maintained client site goes down. | Idea |

## 2. AI & Automation

| Idea | Notes | Status |
|---|---|---|
| Marketing anomaly alerts | AI watches ad/SEO data and alerts on anomalies. Spec: §4.13 (last bullet). | Idea (deferred until Meta/SEO data exists) |
| AI ad-change approval flow | AI proposes Meta ad changes → user approves → applied. Spec: §4.10. | Idea (deferred) |
| Guarded ad automation | Optional bounded automation behind pre-approved rules. Spec: §4.10. | Idea (deferred, after approval flow) |
| AI client reports | Auto-generate monthly client-facing reports (SEO, ads, social) from tracked data. | Idea |
| AI proposal/quote drafting | Draft quote line items from a natural-language description of the job. | Idea |
| AI meeting notes | Paste call notes/transcript → summary + tasks created. Ties into NL task creation (§4.12). | Idea |
| AI weekly review | Weekly digest: wins, slipping projects, profitability warnings. | Idea |
| Voice input for tasks | Capture tasks by voice on mobile. | Idea |

## 3. Social Media & Content

| Idea | Notes | Status |
|---|---|---|
| Social analytics | Track post performance per platform per client. Spec: §4.9 ("analytics later"). | Idea (deferred) |
| Direct publishing to platforms | Push scheduled posts via platform APIs (Meta, TikTok, YouTube). | Idea |
| Content asset library | Reusable b-roll, hooks, templates per client. | Idea |
| Approval reminders | Auto-nudge client when content sits in approval too long. | Idea |

## 4. Portal & Client Experience

| Idea | Notes | Status |
|---|---|---|
| Client portal | Authenticated portal: projects, milestones, progress, invoices, quotes, contracts, files, approvals, waiting-on items. Spec: §4.14 — scheduled as a later phase. | Scheduled (later phase) |
| Client comment threads | Clients comment on milestones/deliverables in the portal. | Idea |
| Self-serve file uploads | Clients upload files through the portal. | Idea |
| Branded quote/contract pages | Custom logo/domain on public quote & contract pages. | Idea |

## 5. Finance & Reporting

| Idea | Notes | Status |
|---|---|---|
| Expense receipts OCR | Snap a receipt → expense entry. Supports §4.15. | Idea |
| Recurring invoices | Auto-generate invoices for retainers. (Recurring *services* on quotes are already spec'd; this is about auto-invoicing.) | Idea |
| Tax reports / VAT summaries | Export for accounting. | Idea |
| Cash-flow forecast | Projected revenue vs expenses by month. | Idea |
| Time-tracking timer | Live timer for tasks instead of manual actual-hours entry. | Idea |
| Dashboard KPIs | Monthly revenue, pipeline value, utilization, overdue counts on the home dashboard. | Idea |

## 6. Platform & Quality

| Idea | Notes | Status |
|---|---|---|
| Mobile PWA | Installable app with offline task view. | Idea |
| Notifications channel | Email and/or push for the §4.13 reminder list. | Idea |
| Data export / backup | One-click full export (clients, projects, tasks, docs). | Idea |
| Audit log | Who/what changed records — useful once portal + integrations exist. | Idea |
| Keyboard-first navigation | Command palette (⌘K) for speed. | Idea |

---

## Idea log

| Date | Idea | Section |
|---|---|---|
| 2026-09-17 | Backlog created; deferred items from the founding requirements moved here (Stripe, Google Calendar, Meta Ads, Search Console, GA4, social analytics, marketing anomaly alerts, client portal details). | — |
