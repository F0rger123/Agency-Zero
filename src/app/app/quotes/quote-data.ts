/** Shared (server-side) shaping for the quotes list and detail pages. */
export type StoredQuoteLine = {
  id: string;
  quote_id?: string;
  description: string;
  details: string | null;
  qty: number;
  unit_amount_cents: number;
  is_recurring: boolean;
  billing_period: string | null;
  amount_cents: number;
  selection: string;
  option_group: string | null;
  sort_order: number;
  service_id: string | null;
};

export const LINE_COLUMNS =
  "id, quote_id, description, details, qty, unit_amount_cents, is_recurring, billing_period, amount_cents, selection, option_group, sort_order, service_id";

/** Database lines → the shape the quote editor works with (dollars, not cents). */
export function editorLines(lines: StoredQuoteLine[]) {
  return lines.map((line) => ({
    service_id: line.service_id ?? "",
    description: line.description,
    details: line.details ?? "",
    qty: line.qty,
    unit_amount: line.unit_amount_cents / 100,
    is_recurring: line.is_recurring,
    billing_period: line.billing_period ?? "month",
    selection: line.selection,
    option_group: line.option_group ?? "",
  }));
}
