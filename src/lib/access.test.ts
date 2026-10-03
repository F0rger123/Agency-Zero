import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc }) }));
// React's cache() is request-scoped; make it a pass-through so every call re-checks.
vi.mock("react", async (original) => ({ ...(await original<typeof import("react")>()), cache: <T,>(fn: T) => fn }));

import { getAccessState } from "./access";

describe("getAccessState", () => {
  beforeEach(() => rpc.mockReset());

  it("ok when the database says the user is owner/team", async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    expect(await getAccessState()).toEqual({ status: "ok" });
  });

  it("denied when the database is up to date and says no", async () => {
    rpc.mockResolvedValue({ data: false, error: null });
    expect(await getAccessState()).toEqual({ status: "denied" });
  });

  it("legacy (not locked out) when migrations 0014+ are not applied yet", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "Could not find the function public.is_owner without parameters in the schema cache" } });
    expect(await getAccessState()).toEqual({ status: "legacy" });
    rpc.mockResolvedValue({ data: null, error: { message: 'function public.is_owner() does not exist' } });
    expect(await getAccessState()).toEqual({ status: "legacy" });
  });

  it("reports real failures as errors, never as 'no access'", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "connection reset" } });
    expect(await getAccessState()).toEqual({ status: "error", message: "connection reset" });
  });
});
