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

/**
 * Internal reference like Q-20261023-143205-X7 (the database needs a unique number; people never type or see it).
 * The suffix keeps two quotes created in the same second apart.
 */
export function suggestQuoteNumber(kind: string, now = new Date(), random = Math.random()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  const day = localDateIso(0, now).replace(/-/g, "");
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const suffix = Math.floor(random * 36 * 36).toString(36).toUpperCase().padStart(2, "0");
  return `${kind === "estimate" ? "E" : "Q"}-${day}-${time}-${suffix}`;
}

export type StoredLine = {
  amount_cents: number;
  selection: string;
  is_recurring: boolean;
  billing_period: string | null;
};

const PERIOD_ORDER = ["month", "quarter", "year"];

/**
 * What a customer is actually being asked to pay: included ("fixed") items only, then discount and tax.
 * Optional add-ons and package choices are reported separately, because the customer decides on them.
 * Recurring items are already inside `total`; `recurring` says how much of it repeats and how often.
 */
export function summarizeQuoteLines(lines: StoredLine[], discountCents: number, taxRate: number) {
  const included = lines.filter((line) => line.selection === "fixed");
  const subtotal = included.reduce((sum, line) => sum + line.amount_cents, 0);
  const optional = lines.filter((line) => line.selection !== "fixed").reduce((sum, line) => sum + line.amount_cents, 0);
  const discount = Math.min(Math.max(discountCents, 0), subtotal);
  const tax = Math.round(((subtotal - discount) * taxRate) / 100);
  const byPeriod = new Map<string, number>();
  for (const line of included) {
    if (!line.is_recurring) continue;
    const period = line.billing_period ?? "month";
    byPeriod.set(period, (byPeriod.get(period) ?? 0) + line.amount_cents);
  }
  const recurring = [...byPeriod.entries()].sort((a, b) => PERIOD_ORDER.indexOf(a[0]) - PERIOD_ORDER.indexOf(b[0]));
  const oneTime = included.filter((line) => !line.is_recurring).reduce((sum, line) => sum + line.amount_cents, 0);
  return { subtotal, oneTime, optional, discount, tax, total: subtotal - discount + tax, recurring };
}

/** "every month", "every quarter", "every year". */
export function periodPhrase(period: string | null | undefined): string {
  return `every ${period === "quarter" ? "quarter" : period === "year" ? "year" : "month"}`;
}
