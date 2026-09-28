# Known bugs / defects

Format: `ID · severity · area · description · status`. Add new ones at top.

| ID | Sev | Area | Description | Status |
|---|---|---|---|---|
| B-001 | High* | Security/RLS | Policies allow any authenticated user; safe only if Supabase sign-ups are disabled. *Verify prod setting.* (AUDIT S1) | Open |
| B-002 | Med | Migrations | `0009_sync_client_ready_sales` exists only in prod; repo cannot recreate prod schema. | Open |
| B-003 | Med | Public links | Quote/contract "viewed" is written on page GET; scanners/prefetch trigger it. | Open |
| B-004 | Med | Data integrity | Invoice/quote line-item replace is delete-then-insert, non-transactional. | Open |
| B-005 | Med | Data integrity | Deleting an invoice cascades and deletes its payments. | Open |
| B-006 | Low | Actions | Updates/deletes don't verify affected rows; bad id reports success. | Open |
| B-007 | Low | Files | Delete-file actions trust form-supplied `storage_path`. | Open |
| B-008 | Low | Perf | Double `auth.getUser()` per navigation (proxy + layout); unbounded lists/pickers. | Open |
| B-009 | Low | Quality | Minified one-liner actions in invoices/quotes/contracts. | Open |
| B-010 | Low | Docs | `BUILD_PROGRESS.md` "Blocked by" is stale (prod exists). | Open |
