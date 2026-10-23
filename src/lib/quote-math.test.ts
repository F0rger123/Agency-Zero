import { describe, expect, it } from "vitest";
import { localDateIso, lineTotalCents, periodPhrase, quoteTotals, suggestQuoteNumber, summarizeQuoteLines } from "./quote-math";

const line = (qty: number, unit_amount: number, selection = "fixed", is_recurring = false) => ({ qty, unit_amount, selection, is_recurring });

describe("quote math", () => {
  it("multiplies quantity by price in cents", () => {
    expect(lineTotalCents({ qty: 3, unit_amount: 19.99 })).toBe(5997);
    expect(lineTotalCents({ qty: Number.NaN, unit_amount: 5 })).toBe(0);
  });
  it("counts only included lines, applies discount then tax", () => {
    const totals = quoteTotals([line(1, 1000), line(2, 250, "optional"), line(1, 100, "fixed", true)], 100, 10);
    expect(totals.subtotal).toBe(110000);
    expect(totals.optional).toBe(50000);
    expect(totals.recurring).toBe(10000);
    expect(totals.discountCents).toBe(10000);
    expect(totals.taxCents).toBe(10000);
    expect(totals.total).toBe(110000);
  });
  it("caps the discount at the subtotal", () => {
    expect(quoteTotals([line(1, 10)], 50, 0).total).toBe(0);
  });
  it("uses local dates", () => {
    const now = new Date(2026, 9, 23, 14, 5);
    expect(localDateIso(0, now)).toBe("2026-10-23");
    expect(localDateIso(30, now)).toBe("2026-11-22");
    expect(suggestQuoteNumber("quote", now, 0)).toBe("Q-20261023-140500-00");
  });

  it("summarises a stored quote by what the customer pays", () => {
    const stored = (amount_cents: number, selection = "fixed", is_recurring = false, billing_period: string | null = null) => ({ amount_cents, selection, is_recurring, billing_period });
    const summary = summarizeQuoteLines(
      [stored(100000), stored(20000, "fixed", true, "month"), stored(50000, "optional"), stored(9000, "fixed", true, "year")],
      10000,
      10,
    );
    expect(summary.subtotal).toBe(129000);
    expect(summary.oneTime).toBe(100000);
    expect(summary.optional).toBe(50000);
    expect(summary.tax).toBe(11900);
    expect(summary.total).toBe(130900);
    expect(summary.recurring).toEqual([["month", 20000], ["year", 9000]]);
    expect(periodPhrase("quarter")).toBe("every quarter");
  });
});
