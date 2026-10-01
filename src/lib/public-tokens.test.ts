import { describe, expect, it } from "vitest";
import { createPublicToken, hashPublicToken } from "./public-tokens";

describe("public tokens", () => {
  it("creates unique 256-bit hex tokens whose hash matches", () => {
    const a = createPublicToken();
    const b = createPublicToken();
    expect(a.token).toMatch(/^[0-9a-f]{64}$/);
    expect(a.token).not.toBe(b.token);
    expect(a.hash).toBe(hashPublicToken(a.token));
    expect(a.hash).not.toBe(a.token);
  });

  it("hashes deterministically with sha-256", () => {
    expect(hashPublicToken("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});
