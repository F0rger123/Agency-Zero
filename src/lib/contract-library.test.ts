import { describe, expect, it } from "vitest";
import { WORK_TYPES, buildContractBody, feeBlock, feeBlockFromQuote, suggestWorkType, workType, type ContractVars } from "./contract-library";

const vars: ContractVars = {
  businessName: "Agency Zero",
  businessEmail: "hello@theagencyzero.com",
  clientName: "Dana Reyes",
  clientCompany: "Northline Plumbing",
  clientEmail: "dana@northline.test",
  clientPhone: "555-0100",
  clientWebsite: "northline.test",
  date: "October 23, 2026",
  scope: "Build a five page website.",
  fees: "The total project fee is $2,500.00.",
  paymentDays: 14,
  noticeDays: 30,
  termMonths: 3,
  revisionRounds: 2,
  warrantyDays: 30,
  state: "Pennsylvania",
};

describe("contract library", () => {
  it("fills every blank for every work type", () => {
    for (const type of WORK_TYPES) {
      const body = buildContractBody(type.key, vars);
      expect(body).toContain("Agency Zero");
      expect(body).toContain("Northline Plumbing");
      expect(body).toContain("dana@northline.test");
      expect(body).toContain("October 23, 2026");
      expect(body).not.toMatch(/\{\{|undefined|NaN/);
      expect(body).toContain("Pennsylvania");
    }
  });
  it("covers both sides: payment, ownership, confidentiality, liability, ending, disputes", () => {
    const body = buildContractBody("software", vars);
    for (const heading of ["Fees and payment", "Ownership", "Confidentiality", "Limits on liability", "Protecting each other", "Ending this agreement", "If we disagree"]) expect(body).toContain(heading);
  });
  it("recurring work says how it renews and cancels, and does not promise results", () => {
    const body = buildContractBody("ads", vars);
    expect(body).toContain("initial term of 3 months");
    expect(body).toContain("No guarantee of results");
    expect(body).toContain("Ad spend");
    expect(buildContractBody("care", { ...vars, termMonths: 1 })).toContain("renews automatically month to month");
  });
  it("numbers sections in order", () => {
    const body = buildContractBody("website", vars);
    expect(body).toMatch(/\n1\. Scope of work/);
    expect(body).toMatch(/\n2\. Fees and payment/);
  });
  it("writes fee blocks", () => {
    expect(feeBlock("project", { projectCents: 250000, depositPercent: 50 }, 14)).toContain("deposit of 50% ($1,250.00)");
    expect(feeBlock("monthly", { monthlyCents: 90000, setupCents: 50000 }, 14)).toContain("$900.00, invoiced in advance");
    expect(feeBlock("hourly", { hourlyCents: 12500 }, 14)).toContain("$125.00 per hour");
    expect(feeBlock("project", {}, 14)).toContain("as agreed in writing");
    const quote = feeBlockFromQuote(
      [
        { description: "Website build", amount_cents: 200000, selection: "fixed", is_recurring: false, billing_period: null },
        { description: "Care plan", amount_cents: 15000, selection: "fixed", is_recurring: true, billing_period: "month" },
        { description: "Logo", amount_cents: 50000, selection: "optional", is_recurring: false, billing_period: null },
      ],
      14,
      50,
    );
    expect(quote).toContain("Website build: $2,000.00 (one-time)");
    expect(quote).toContain("Care plan: $150.00 per month");
    expect(quote).not.toContain("Logo");
    expect(quote).toContain("deposit of 50%");
  });
  it("suggests a type from services", () => {
    expect(suggestWorkType(["Local SEO"], true)).toBe("seo");
    expect(suggestWorkType(["Meta ads management"], true)).toBe("ads");
    expect(suggestWorkType(["Custom CRM"], false)).toBe("software");
    expect(suggestWorkType(["Misc"], true)).toBe("retainer");
    expect(suggestWorkType([], false)).toBeNull();
    expect(workType("nda").fee).toBe("none");
  });
});
