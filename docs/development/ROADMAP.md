# Roadmap (prioritized, 2026-09-28)

Supersedes the phase list in `docs/BUILD_PROGRESS.md` (kept as history). Order reflects
"strong foundation before AI, customer-first UX". Each item should end with docs +
handoff per AGENTS.md.

## P0 — Safety & foundation (before new features) — code complete 2026-10-01; 0014/0015 need applying to production
1. ✅ **Owner-only RLS** (migration 0014). Confirm Supabase sign-ups disabled in prod *now*; migration 0014
   adds `is_owner()` and rewrites all policies + storage policies to use it.
2. 🟡 **Reconcile schema drift** (script ready; needs prod dump) (missing `0009`): dump prod schema, diff vs fresh apply,
   commit reconciling migration; add a scripted "apply all + smoke RPC" SQL test.
3. ✅ **CI + tests**: CI (app + database jobs), vitest unit tests, SQL tests (`npm test`, `npm run test:db`) for `lib/*` (forms, invoice-status, tokens)
   and SQL smoke tests.
4. ✅ **Shared server-action layer** (`src/lib/actions.ts`): one auth/validation/affected-rows helper; unminify
   invoices/quotes/contracts actions; transactional line-item replace via RPC.
5. ✅ Stop hard-deleting invoices/payments (void instead); make public "viewed" tracking
   non-GET-side-effect (explicit client beacon or bot-tolerant).

## P1 — Customer-first core model
6. **Unified work items**: `tasks.kind` (task | bug | feature_request) + severity/
   status fields, requester (contact), source (pasted message later). Migrate UI so
   project workspace has Tasks / Bugs / Feature requests tabs.
7. **Project phases** (ordered, per project) above milestones; **project templates per
   service type** (default phases/tasks/checklists).
8. **Create-in-context everywhere**: quotes, contracts, invoices, meetings, files from
   inside client/project workspaces with client/project prefilled.
9. **Activity log** table (who/what/when, entity refs) feeding workspaces and, later, AI.
10. Meetings + checklists; video shoots (calendar event subtypes with checklist template).
11. ✅ Performance (local JWT verification, bounded lists/pickers). Still later: searchable async pickers, pagination UI.

## P2 — Money
12. Installment plans, recurring invoice generation (from client_services), deposits.
13. Time tracking UX (timer), profitability per client/project (revenue − time cost − expenses).
14. Expenses; MRR/ARR history snapshots.
15. Stripe (optional, later).

## P3 — Delivery channels
16. Social content pipeline (`/social`), content calendar.
17. Google Calendar sync; reminders delivery (email/push).
18. Meta Ads + SEO reporting (read-only first).

## P4 — AI (only after P0–P1)
19. Server-side mutation API shared by UI and AI; `ai_proposals` table
    (proposed changes → confirm → apply, fully audited).
20. "I fixed X and added the features John asked for" → proposed completions.
21. Paste-a-message extraction → proposed tasks/bugs/features/notes/deadlines.
22. Daily briefing, workload suggestions.

## Later
Client portal · white-label reports · integrations from IDEAS.md.
