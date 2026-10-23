/**
 * Totals shown while building a quote. The database is the source of truth (it recomputes on save);
 * this only keeps the on-screen numbers obvious. Amounts are whole cents.
 */
export type QuoteLineMath = {
  qty: number;
  unit_amount: number;
  selection: string;
  is_recurring: boolean;
};

export function lineTotalCents(line: Pick<QuoteLineMath, "qty" | "unit_amount">): number {
  const qty = Number.isFinite(line.qty) ? line.qty : 0;
  const unit = Number.isFinite(line.unit_amount) ? line.unit_amount : 0;
  return Math.round(qty * Math.round(unit * 100));
}

export function quoteTotals(lines: QuoteLineMath[], discount: number, taxRate: number) {
  const included = lines.filter((line) => line.selection === "fixed");
  const subtotal = included.reduce((sum, line) => sum + lineTotalCents(line), 0);
  const optional = lines
    .filter((line) => line.selection !== "fixed")
    .reduce((sum, line) => sum + lineTotalCents(line), 0);
  const recurring = included.filter((line) => line.is_recurring).reduce((sum, line) => sum + lineTotalCents(line), 0);
  const discountCents = Math.min(Math.max(Math.round((Number.isFinite(discount) ? discount : 0) * 100), 0), subtotal);
  const taxCents = Math.round(((subtotal - discountCents) * (Number.isFinite(taxRate) ? taxRate : 0)) / 100);
  return { subtotal, optional, recurring, discountCents, taxCents, total: subtotal - discountCents + taxCents };
}

/** Local-time `YYYY-MM-DD`, `daysAhead` days from today (the user's own "today", not UTC). */
export function localDateIso(daysAhead = 0, now = new Date()): string {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysAhead);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** A unique-enough default number like Q-20261023-1432; editable. */
export function suggestQuoteNumber(kind: string, now = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  const day = localDateIso(0, now).replace(/-/g, "");
  return `${kind === "estimate" ? "E" : "Q"}-${day}-${pad(now.getHours())}${pad(now.getMinutes())}`;
}
