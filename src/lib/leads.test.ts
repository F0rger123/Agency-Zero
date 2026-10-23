import { describe, expect, it } from "vitest";
import { looksLikeTestLead } from "./leads";

describe("looksLikeTestLead", () => {
  it("flags obvious tests", () => {
    expect(looksLikeTestLead({ name: "Test User", email: "a@b.co" })).toBe(true);
    expect(looksLikeTestLead({ name: "Sam", email: "sam@example.com" })).toBe(true);
    expect(looksLikeTestLead({ name: "Sam", email: null, phone: "555-0100" })).toBe(true);
    expect(looksLikeTestLead({ name: "Sam", email: "x@y.co", details: "asdf" })).toBe(true);
    expect(looksLikeTestLead({ name: "J", email: "x@y.co" })).toBe(true);
  });
  it("leaves real inquiries alone", () => {
    expect(looksLikeTestLead({ name: "Maria Lopez", business: "Lopez Roofing", email: "maria@lopezroofing.com", phone: "(615) 482-1930" })).toBe(false);
  });
});
