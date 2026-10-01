import { describe, expect, it } from "vitest";
import { invoiceStatusLabel, isInvoiceOverdue } from "./invoice-status";

const today = "2026-10-01";

describe("invoiceStatusLabel", () => {
  it("keeps terminal statuses as-is", () => {
    for (const status of ["paid", "void", "draft"]) {
      expect(invoiceStatusLabel(status, "2020-01-01", 100, today)).toBe(status);
    }
  });

  it("derives overdue for open past-due invoices", () => {
    expect(invoiceStatusLabel("sent", "2026-09-30", 500, today)).toBe("overdue");
    expect(invoiceStatusLabel("partially_paid", "2026-09-30", 500, today)).toBe("overdue");
    expect(isInvoiceOverdue("sent", "2026-09-30", 500, today)).toBe(true);
  });

  it("is not overdue when due today, in the future, or fully settled", () => {
    expect(invoiceStatusLabel("sent", "2026-10-01", 500, today)).toBe("sent");
    expect(invoiceStatusLabel("sent", "2026-11-01", 500, today)).toBe("sent");
    expect(invoiceStatusLabel("sent", "2026-09-01", 0, today)).toBe("sent");
  });
});
