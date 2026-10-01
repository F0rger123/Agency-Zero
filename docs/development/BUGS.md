# Known bugs / defects

Format: `ID · severity · area · description · status`. Add new ones at top.

| ID | Sev | Area | Description | Status |
|---|---|---|---|---|
| B-001 | High* | Security/RLS | Policies allow any authenticated user; safe only if Supabase sign-ups are disabled. *Verify prod setting.* (AUDIT S1) | Fixed in 0014 (apply to prod + verify owner row) |
| B-002 | Med | Migrations | `0009_sync_client_ready_sales` exists only in prod; repo cannot recreate prod schema. Tooling added (`supabase/scripts/check-schema-drift.sh`); **needs a prod schema dump to finish.** | Blocked on owner |
| B-003 | Med | Public links | Quote/contract "viewed" is written on page GET; scanners/prefetch trigger it. | Fixed (ViewBeacon) |
| B-004 | Med | Data integrity | Invoice/quote line-item replace is delete-then-insert, non-transactional. | Fixed in 0015 (apply to prod) |
| B-005 | Med | Data integrity | Deleting an invoice cascades and deletes its payments. | Fixed in 0015 (apply to prod) |
| B-006 | Low | Actions | Updates/deletes don't verify affected rows; bad id reports success. | Fixed (count check in all actions) |
| B-007 | Low | Files | Delete-file actions trust form-supplied `storage_path`. | Fixed |
| B-008 | Low | Perf | Double `auth.getUser()` per navigation (proxy + layout); unbounded lists/pickers. | Fixed (getClaims, bounded lists, 0017) |
| B-009 | Low | Quality | Minified one-liner actions in invoices/quotes/contracts. | Fixed for actions files |
| B-010 | Low | Docs | `BUILD_PROGRESS.md` "Blocked by" is stale (prod exists). | Fixed |
| B-011 | Low | Money | Payments could be hard-deleted. | Fixed in 0016 (void-only ledger) |
| B-012 | Low | Security | `0014` assumes the owner is the oldest profile; wrong guess locks the owner out until `app_owner` is fixed (documented in migration + README). | Mitigated |
| B-013 | Low | Money | Invoice list KPIs counted void/draft balances as outstanding and understated revenue once lists are bounded. | Fixed in 0017 |
| B-014 | Info | Security | S3 signature evidence, S5 rate limiting (edge rules documented in DEPLOYMENT.md, **owner must configure in Cloudflare**), S4 raw tokens (accepted; documented). | See AUDIT |

