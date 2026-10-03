import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { notifyOwnerOfLead } from "./lead-notify";

const lead = { name: "Pat", business: "Example Co", email: "pat@example.com", phone: "", services: ["websites"], budget: "$5k – $15k", details: "Need a site" };

describe("notifyOwnerOfLead", () => {
  const original = { ...process.env };
  beforeEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.LEAD_NOTIFY_EMAIL;
    delete process.env.LEAD_FROM_EMAIL;
  });
  afterEach(() => {
    process.env = { ...original };
    vi.unstubAllGlobals();
  });

  it("does nothing when not configured (the lead is still saved elsewhere)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await notifyOwnerOfLead(lead)).toEqual({ sent: false, reason: "not configured" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends a plain-text email to the owner with the lead as reply-to", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.LEAD_NOTIFY_EMAIL = "owner@example.com";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);
    expect(await notifyOwnerOfLead(lead)).toEqual({ sent: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer re_test");
    const body = JSON.parse(init.body as string);
    expect(body.to).toEqual(["owner@example.com"]);
    expect(body.reply_to).toBe("pat@example.com");
    expect(body.text).toContain("Need a site");
    expect(body.html).toBeUndefined(); // plain text only: no HTML injection surface
  });

  it("reports failures without throwing", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.LEAD_NOTIFY_EMAIL = "owner@example.com";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403 }));
    expect(await notifyOwnerOfLead(lead)).toEqual({ sent: false, reason: "Resend responded 403" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    expect(await notifyOwnerOfLead(lead)).toEqual({ sent: false, reason: "network down" });
  });
});
