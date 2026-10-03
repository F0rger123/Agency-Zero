import { describe, expect, it } from "vitest";
import { isClockSkewError, retryOnClockSkew } from "./retry";

describe("retryOnClockSkew", () => {
  it("recognises the clock-skew error text", () => {
    expect(isClockSkewError("JWT issued at future")).toBe(true);
    expect(isClockSkewError("permission denied")).toBe(false);
    expect(isClockSkewError(undefined)).toBe(false);
  });

  it("retries until the error clears", async () => {
    let calls = 0;
    const result = await retryOnClockSkew(
      async () => {
        calls += 1;
        return calls < 3 ? { error: { message: "JWT issued at future" }, data: null } : { error: null, data: "ok" };
      },
      { delayMs: 1 },
    );
    expect(calls).toBe(3);
    expect(result.data).toBe("ok");
  });

  it("does not retry other errors", async () => {
    let calls = 0;
    await retryOnClockSkew(async () => {
      calls += 1;
      return { error: { message: "boom" } };
    });
    expect(calls).toBe(1);
  });

  it("gives up after the attempt limit", async () => {
    let calls = 0;
    const result = await retryOnClockSkew(
      async () => {
        calls += 1;
        return { error: { message: "JWT issued at future" } };
      },
      { attempts: 3, delayMs: 1 },
    );
    expect(calls).toBe(3);
    expect(result.error?.message).toBe("JWT issued at future");
  });
});
