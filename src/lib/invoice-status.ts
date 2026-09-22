/**
 * Invoice status as the owner should see it.
 *
 * The stored `invoices.status` column is maintained by the payments trigger
 * (`recalculate_invoice_payment`, migration 0006/0008) whenever money moves.
 * Time-based expiry — an unpaid invoice whose due date has passed — is derived
 * at read time instead of being written during page render, because a render
 * path must not mutate the database:
 *
 *  - a page that writes cannot be prefetched, cached, or re-rendered cheaply,
 *    which is exactly what made navigation feel slow;
 *  - `public.refresh_invoice_statuses()` still exists for scheduled/back-office
 *    use (see docs/DECISIONS.md D-033) and can be run from a Supabase scheduled
 *    query to keep the stored flag fresh for reporting.
 *
 * Every surface that renders an invoice status uses this helper so the UI is
 * consistent with what matters: is this invoice paid, and is it late?
 */
export function invoiceStatusLabel(
  status: string | null | undefined,
  dueOn: string | null | undefined,
  balanceCents: number | null | undefined,
  today: string = new Date().toISOString().slice(0, 10)
): string {
  const raw = (status ?? "").trim();
  if (raw === "paid" || raw === "void" || raw === "draft") return raw;
  const open = balanceCents == null ? true : balanceCents > 0;
  if (dueOn && open && dueOn < today) return "overdue";
  return raw || "draft";
}

export function isInvoiceOverdue(
  status: string | null | undefined,
  dueOn: string | null | undefined,
  balanceCents: number | null | undefined,
  today: string = new Date().toISOString().slice(0, 10)
): boolean {
  return invoiceStatusLabel(status, dueOn, balanceCents, today) === "overdue";
}
