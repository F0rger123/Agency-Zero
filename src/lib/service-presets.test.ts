import { describe, expect, it } from "vitest";
import { SERVICE_CATEGORIES, SERVICE_PRESETS, groupServices } from "./service-presets";

describe("service presets", () => {
  it("has unique names and known categories", () => {
    const names = SERVICE_PRESETS.map((preset) => preset.name);
    expect(new Set(names).size).toBe(names.length);
    for (const preset of SERVICE_PRESETS) expect(SERVICE_CATEGORIES).toContain(preset.category);
  });
  it("groups by category order, custom after known, Other last", () => {
    const groups = groupServices([
      { category: null, id: 1 },
      { category: "Zebra", id: 2 },
      { category: "SEO", id: 3 },
      { category: "Websites", id: 4 },
    ]);
    expect(groups.map((group) => group.title)).toEqual(["Websites", "SEO", "Zebra", "Other"]);
  });
});
