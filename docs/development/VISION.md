# Vision — Agency Zero

Agency Zero is the owner's private operating system for the agency. Requirements
live in [`../MASTER_SPEC.md`](../MASTER_SPEC.md); this file records the **UX
philosophy** that should drive every implementation choice.

## Customer-first, like File Explorer
```
Client
  └─ Project / Service (website, SEO retainer, Meta ads, social, video, custom software…)
       ├─ Tasks / subtasks
       ├─ Bugs
       ├─ Feature requests
       ├─ Phases → Milestones
       ├─ Notes
       ├─ Files
       ├─ Meetings (+ checklists, video shoots)
       └─ Financials (quotes, contracts, invoices, payments, installments, recurring, time, profit)
```
The owner should almost never leave a client/project workspace to manage anything
belonging to it. Global sections (Tasks, Calendar, Invoices…) are *lenses* over the
same records, not separate silos.

## Service-specific workflows
Different service types have different workflows/phases (e.g. software: discovery →
build → QA → launch; SEO: audit → fixes → monthly reporting; video: pre-pro → shoot →
edit → approval). Project templates per service type define default phases, task lists
and checklists.

## Long-term scope
CRM · projects · tasks/subtasks · bugs · feature requests · phases · milestones ·
custom services · quotes (packages/options/add-ons) · contracts · invoices · payments ·
installment plans · recurring revenue (MRR/ARR) · time tracking · profitability ·
calendar (+ Google Calendar) · video shoots · meeting checklists · social pipeline ·
Meta Ads tracking · SEO reporting · reminders · workload planning.

## AI (later — foundation first)
1. *"I fixed the login issue and added the three features John requested."* → AI
   **proposes** (complete task X, resolve bug Y, add note, update progress) and
   **asks confirmation** before any write.
2. *Paste a customer message* → AI extracts tasks, feature requests, bugs, deadlines,
   notes and proposes where each belongs.

Prerequisites (do not skip): typed records for bugs/feature requests/phases, a
stable activity log, one server-side mutation layer that AI can call with the same
validation as the UI, and a proposal/confirmation table. See ROADMAP.

## Design rules
Monochrome, calm, dense-but-readable; honest empty/error states; fast navigation
(server read models + router cache); mobile usable.
