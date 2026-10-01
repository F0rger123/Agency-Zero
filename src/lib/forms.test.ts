import { describe, expect, it } from "vitest";
import { field, isMissingTable, optionalDate, optionalField, readableError, requiredText, validEmail, validHttpUrl } from "./forms";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("form helpers", () => {
  it("trims and defaults fields", () => {
    expect(field(form({ a: "  x " }), "a")).toBe("x");
    expect(field(form({}), "missing")).toBe("");
    expect(optionalField(form({ a: "   " }), "a")).toBeNull();
  });

  it("validates dates", () => {
    expect(optionalDate(form({ d: "2026-10-01" }), "d")).toBe("2026-10-01");
    expect(optionalDate(form({ d: "not-a-date" }), "d")).toBeNull();
    expect(optionalDate(form({}), "d")).toBeNull();
  });

  it("enforces required text and length", () => {
    expect(requiredText(form({ n: "" }), "n", "Name")).toEqual({ error: "Name is required." });
    expect(requiredText(form({ n: "abcd" }), "n", "Name", 3)).toEqual({ error: "Name must be 3 characters or fewer." });
    expect(requiredText(form({ n: "abc" }), "n", "Name", 3)).toBe("abc");
  });

  it("validates emails and urls", () => {
    expect(validEmail(null)).toBe(true);
    expect(validEmail("a@b.co")).toBe(true);
    expect(validEmail("nope")).toBe(false);
    expect(validHttpUrl("https://example.com")).toBe(true);
    expect(validHttpUrl("javascript:alert(1)")).toBe(false);
    expect(validHttpUrl("ftp://x.y")).toBe(false);
  });

  it("recognises migration-missing errors", () => {
    expect(isMissingTable('relation "public.x" does not exist')).toBe(true);
    expect(readableError("could not find in the schema cache")).toMatch(/migration/);
    expect(readableError("boom")).toBe("boom");
  });
});
