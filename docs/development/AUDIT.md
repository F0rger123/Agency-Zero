# Audit — main @ 57f7c6f (2026-09-28)

Method: read every migration, docs, proxy/auth, all server actions' patterns, list
queries, file handling; ran `npm ci`, `tsc --noEmit`, `eslint`, `next build` (all
**pass**). **Not verified**: anything against a live Supabase (no credentials in this
environment), Cloudflare deploy, visual/UX in a browser, RPC behaviour under load.

## 1. Repo / history
- `main` = 11 commits; three Arena branches (`arena/*`) are all fully contained in
  `main` via merge commits (PRs #1–3 show "closed, unmerged" only because they were
  merged outside GitHub). **Arena's documented deliverables are reflected in main** — I
  found no claimed feature missing (quote packages/options/add-ons, link rotation,
  contract templates + immutability triggers, dashboard RPC, client/project workspaces,
  services catalogue all exist in code/SQL).
- Stale branch `recovery/sidebar-payments-quotes-20260922` (= main). Delete when convenient.
- **No tests, no CI** existed. (Added `.github/workflows/ci.yml`: lint + tsc + build.)
- No AGENTS.md existed; docs were spec-heavy but had no active-work/handoff/bug tracking.

## 2. What actually works (code-verified, DB-unverified)
Auth (email/password, proxy guard + layout double-check) · clients CRUD, contacts, notes,
files, comms, service assignment · projects, milestones, tasks/subtasks/dependencies,
time entries · client directory + 12-tab client workspace and 10-tab project workspace
(single RPC each) · services catalogue with one-off/recurring, MRR/ARR · quotes with
options/add-ons, public accept/reject · contracts with templates, public signing,
version snapshots · invoices, manual payments, derived balances · calendar (day/week/
month), workload capacity, reminders · settings · dashboard (one RPC).
Deployment config for Cloudflare/OpenNext builds.

## 3. Not built (vs. VISION)
Bugs, feature requests, project **phases**, service-specific templates, meetings /
meeting checklists, video shoots, installment plans, recurring *invoice generation*
(MRR is reported, but nothing invoices it), profitability/expenses, social pipeline
(`/social` placeholder), Meta/SEO (`/marketing` placeholder), Google Calendar, Stripe,
activity log as a first-class table, AI, client portal. Task→"type" concept absent, so
bugs/features cannot yet be modelled inside a project.

## 4. Security
| # | Severity | Finding |
|---|---|---|
| S1 | **High (conditional)** | Every RLS policy is `auth.uid() is not null` ("any authenticated user is the owner", D-014). If Supabase **public sign-ups are enabled** (default!) anyone can create an account with the public anon key and read/write *everything*, including private storage. Docs say to disable sign-ups, but nothing in the DB enforces it. Fix: `is_owner()` check (owner uid stored in `profiles`/settings) in all policies + storage policies. **Verify sign-ups are off in prod today.** |
| S2 | Medium | Public quote/contract pages perform **writes on GET** (`mark_public_*_viewed`); link scanners/prefetch mark quotes "viewed" and flip status `sent→viewed`. |
| S3 | Medium | E-signature evidence is only typed name + timestamp; no IP/UA/consent text recorded. Weak for disputes. |
| S4 | Low | Raw `public_token` stored next to `public_token_hash` (needed to re-copy links, but defeats hashing at rest). Owner-only via RLS, so acceptable once S1 is closed. |
| S5 | Low | No rate limiting on anon RPCs (tokens are 256-bit so brute force is infeasible; abuse = spam of accept/reject only on valid tokens). |
| S6 | Low | Delete-file actions trust `storage_path` from the form instead of the DB row. Owner-only, but derive it server-side. |
| S7 | Low | Storage bucket policies allow any authenticated user on whole bucket; tighten with S1. |
| S8 | Info | `security definer` functions all pin `search_path` and revoke PUBLIC — good. Dashboard/workspace RPCs are `security invoker` — good. |

## 5. Architecture / code quality
- **Migrations not reproducible**: `0009_sync_client_ready_sales` was applied to prod out
  of band and is *not in the repo*. Fresh environments (0001–0008,0010–0013) may differ
  from prod. Action: dump prod schema, diff against a fresh apply, commit a reconciling
  migration (0014) — ROADMAP P0.
- Migrations 0013 used idempotent `do $$` guards; earlier ones aren't idempotent — fine,
  but drift-prone given the 0009 gap.
- `getUserClient()` copy-pasted into every actions file; validation helpers duplicated
  (`numberField/moneyField/hoursField` local to projects). Consolidate into `lib/actions`.
- `invoices/actions.ts`, parts of quotes/contracts are minified one-liners — unreviewable.
- Non-transactional multi-step writes: invoice/quote line replace = delete then insert
  (failure ⇒ lost lines). Should be an RPC/transaction.
- Updates/deletes don't check affected rows (silent no-op on bad id).
- **Hard delete** of invoices cascades payments (financial record loss). Prefer void.
- `tasks.project_id` nullable + separate client_id; tasks lack a `type` (task/bug/feature).
- `cloudflare-env.d.ts` (600 KB generated) committed — noise; regenerate in CI instead.
- Docs claimed "verified locally against fresh PostgreSQL" — plausible but no scripted
  test exists; add SQL test script.

## 6. Performance
- Proxy runs `auth.getUser()` (network call to Supabase Auth) on every request, and the
  layout calls it again → **2 auth round trips per navigation**, plus another in every
  server action. Consider verifying JWT locally (`getClaims`) in proxy/layout.
- Unbounded lists: tasks, invoices, quotes, contracts, projects pages load everything;
  form pickers load *all* clients/projects/milestones/**all tasks** (`tasks/[id]`,
  `calendar`) on each render. Fine at 20 clients, will degrade; add limits/search-pickers.
- Client directory filters in-browser over the full payload (OK at agency scale).
- Dashboard/client/project single-RPC design is good; keep the pattern.
- `staleTimes.dynamic=30` can show stale data after edits made elsewhere; actions call
  `revalidatePath` so mostly fine.

## 7. UI / UX
- Customer-first is *partly* delivered: workspaces exist, but **tasks/quotes/invoices/
  contracts can still only be created from global pages**, and project→bugs/features/
  phases/meetings are missing. Sidebar has 14 flat items incl. two placeholders (Social,
  Marketing) — honest but noise.
- Very large client components (`client-workspace.tsx` 809 lines, `project-workspace.tsx`
  852) — split per tab.
- Not visually verified here; do a browser pass (mobile widths, forms with server errors).

## 8. Prior-claim reconciliation
| Claim | Status |
|---|---|
| Migrations 0001–0008,0010–0013 apply cleanly | Unverified here; plausible. 0009 gap is real. |
| lint/tsc/build pass | **Confirmed** (opennext/wrangler dry-run not re-run). |
| "Blocked only on Supabase provisioning" | Stale — prod exists (0009 proves it). Live state unknown to repo. |
| Dashboard single-query fix | Present in code + 0011. |
| Anything absent from main | None found. |

## 9. Next steps
See [ROADMAP.md](ROADMAP.md). Top three: (1) confirm sign-ups off + owner-only RLS,
(2) reconcile the 0009 schema drift, (3) generalize the work-item model (task type:
task/bug/feature + phases) so the project workspace can become the real home.

## 10. Remediation log (2026-10-01)
P0 shipped on branch `claude/compassionate-faraday-kixpre`:
S1 → migration `0014` (owner-only RLS incl. Storage) · S2/B-003 → `ViewBeacon` · S6/B-007 →
file paths resolved from DB rows · B-004/B-005 → migration `0015` + actions rewritten ·
B-006 → affected-row checks in every update/delete · B-009 → action files reformatted and
deduplicated onto `src/lib/actions.ts` · tests: 14 vitest tests + SQL suite (owner / stranger /
anon, atomic saves, invoice protection) · CI runs both.
**Still open:** B-002 (needs prod schema dump), S3 (signature evidence), S5, performance
items (B-008), B-011. 0014/0015 are **not yet applied to any database but the scratch test DB**.

## 11. Remediation log, pass 2 (2026-10-01)
S3 → migration `0016` (IP/UA/consent/SHA-256, immutable) · B-011 → void-only payment ledger (`0016`) ·
B-008 → `getClaims()` in proxy/layout/settings, bounded lists + pickers + `LimitNotice`, `get_invoice_summary()` (`0017`) ·
UI → Social/Marketing grouped under "Planned"; `client-workspace` 809→146 lines and `project-workspace` 852→134 lines,
tabs split into `client-tabs/` and `project-tabs/`, remaining minified one-liners in pages/forms reformatted ·
S5 → edge rate-limit rules documented (cannot be done in code; owner must configure) · S4 → accepted, documented ·
latent bug found+fixed: void invoice balances were counted as outstanding.
**Still open:** B-002 (needs prod schema dump); stale branch `recovery/sidebar-payments-quotes-20260922` (delete on GitHub);
P1 customer-first model work (bugs/feature requests/phases, create-in-context).
