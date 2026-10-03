# ACTIVE work

Claim work here before starting; move to "Recently done" (with commit) when finished.

## In progress
| What | Who/branch | Migrations | Notes |
|---|---|---|---|
| (none) | | | P0 complete on `claude/compassionate-faraday-kixpre`; awaiting owner to apply 0014/0015 and provide prod schema dump |

## Next up (needs owner go-ahead)
- Owner: apply 0014–0019, review/replace placeholder content (SITE_CONTENT.md), configure Cloudflare rate limiting for /contact.
- Owner: apply `0014`–`0017` to production (see HANDOFF), dump prod schema for B-002.
- P1 item 6: unified work items (task/bug/feature_request) — migration `0016`.

## Recently done
- 2026-10-03: public marketing site (home, services, 6 service pages, work, about, contact), CRM moved to /app, Total Revenue, leads → CRM (0018, 0019).
- 2026-10-01: audit pass 2 — payment ledger + signature evidence (0016), invoice summary (0017), JWT/perf, bounded lists, workspace split, nav group.
- 2026-10-01: P0 — owner-only RLS (0014), atomic saves + invoice protection (0015), shared action layer,
  affected-row checks, ViewBeacon, vitest + SQL tests, CI.
- 2026-09-28: audit, AGENTS.md, docs/development/*, CI workflow.
