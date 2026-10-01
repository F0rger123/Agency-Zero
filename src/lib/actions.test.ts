import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: () => true }));

import { hoursToMinutesField, isActionError, moneyToCentsField, notFoundWhenNoRows, wholeNumberField } from "./actions";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("notFoundWhenNoRows", () => {
  it("flags zero or unknown counts, passes positive counts", () => {
    expect(notFoundWhenNoRows(0, "Task")).toEqual({ error: "Task not found, or it was already removed." });
    expect(notFoundWhenNoRows(null)).toMatchObject({ error: expect.any(String) });
    expect(notFoundWhenNoRows(1)).toBeNull();
  });
});

describe("numeric field parsers", () => {
  it("converts money to integer cents and rejects bad input", () => {
    expect(moneyToCentsField(form({ m: "12.34" }), "m", "Amount")).toBe(1234);
    expect(moneyToCentsField(form({ m: "" }), "m", "Amount")).toBeNull();
    expect(isActionError(moneyToCentsField(form({ m: "-1" }), "m", "Amount"))).toBe(true);
    expect(isActionError(moneyToCentsField(form({ m: "abc" }), "m", "Amount"))).toBe(true);
  });

  it("converts hours to minutes", () => {
    expect(hoursToMinutesField(form({ h: "1.5" }), "h", "Time")).toBe(90);
    expect(isActionError(hoursToMinutesField(form({ h: "-2" }), "h", "Time"))).toBe(true);
  });

  it("parses bounded whole numbers", () => {
    expect(wholeNumberField(form({ n: "50" }), "n", "Progress", 100)).toBe(50);
    expect(isActionError(wholeNumberField(form({ n: "101" }), "n", "Progress", 100))).toBe(true);
    expect(isActionError(wholeNumberField(form({ n: "1.5" }), "n", "Progress", 100))).toBe(true);
  });
});
