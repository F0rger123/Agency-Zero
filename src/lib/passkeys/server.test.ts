import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { consumeChallenge, guessDeviceName, passkeysConfigured, relyingParty, sameOrigin } from "./server";

const req = (host: string, headers: Record<string, string> = {}) => new Request(`https://${host}/api/passkey/login/options`, { method: "POST", headers: { host, ...headers } });

describe("passkey server helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("pins the relying party to the production domain", () => {
    expect(relyingParty(req("theagencyzero.com"))).toEqual({ rpID: "theagencyzero.com", origin: "https://theagencyzero.com" });
    // A look-alike Host header cannot move the relying party.
    expect(relyingParty(req("evil.example"))).toEqual({ rpID: "theagencyzero.com", origin: "https://theagencyzero.com" });
  });

  it("honours NEXT_PUBLIC_SITE_URL and allows localhost for development", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.test/");
    expect(relyingParty(req("anything.example"))).toEqual({ rpID: "example.test", origin: "https://example.test" });
    expect(relyingParty(req("localhost:3100", { "x-forwarded-proto": "http" }))).toEqual({ rpID: "localhost", origin: "http://localhost:3100" });
  });

  it("rejects cross-site and origin-less requests", () => {
    expect(sameOrigin(req("theagencyzero.com", { origin: "https://theagencyzero.com" }))).toBe(true);
    expect(sameOrigin(req("theagencyzero.com", { origin: "https://evil.example" }))).toBe(false);
    expect(sameOrigin(req("theagencyzero.com"))).toBe(false);
  });

  it("is only configured when the service-role key and project URL exist", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect(passkeysConfigured()).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "k");
    expect(passkeysConfigured()).toBe(true);
  });

  it("names devices from the user agent", () => {
    expect(guessDeviceName("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)")).toBe("iPhone");
    expect(guessDeviceName("Mozilla/5.0 (Linux; Android 14; Pixel 8)")).toBe("Android phone");
    expect(guessDeviceName("Mozilla/5.0 (Windows NT 10.0; Win64)")).toBe("Windows PC");
    expect(guessDeviceName(null)).toBe("This device");
  });

  it("refuses malformed challenge ids without touching the database", async () => {
    const admin = { from: vi.fn() } as never;
    expect(await consumeChallenge(admin, undefined, "login")).toBeNull();
    expect(await consumeChallenge(admin, "not-a-uuid'; drop table", "login")).toBeNull();
    expect((admin as unknown as { from: ReturnType<typeof vi.fn> }).from).not.toHaveBeenCalled();
  });
});
