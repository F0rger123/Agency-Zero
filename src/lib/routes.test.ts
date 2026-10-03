import { describe, expect, it } from "vitest";
import { appPath, crmHref, isCrmPath, safeNextPath } from "./routes";

describe("routes", () => {
  it("maps CRM paths under /app", () => {
    expect(appPath("/")).toBe("/app");
    expect(appPath("/clients/1")).toBe("/app/clients/1");
    expect(appPath("clients")).toBe("/app/clients");
  });

  it("normalises database-provided hrefs idempotently", () => {
    expect(crmHref("/invoices/9")).toBe("/app/invoices/9");
    expect(crmHref("/app/invoices/9")).toBe("/app/invoices/9");
    expect(crmHref("https://example.com")).toBe("https://example.com");
  });

  it("recognises CRM paths exactly (not look-alikes)", () => {
    expect(isCrmPath("/app")).toBe(true);
    expect(isCrmPath("/app/clients")).toBe(true);
    expect(isCrmPath("/apple")).toBe(false);
    expect(isCrmPath("/services")).toBe(false);
  });

  it("only ever redirects to same-site CRM paths after login", () => {
    expect(safeNextPath("/app/clients?x=1")).toBe("/app/clients?x=1");
    expect(safeNextPath("/services")).toBe("/app");
    expect(safeNextPath("//evil.com/app")).toBe("/app");
    expect(safeNextPath("https://evil.com")).toBe("/app");
    expect(safeNextPath("/\\evil.com")).toBe("/app");
    expect(safeNextPath(null)).toBe("/app");
    expect(safeNextPath("/appevil")).toBe("/app");
  });
});
