import { describe, expect, it } from "vitest";
import { needsPhasesMigration, parseTemplateText, templateToText } from "./phases";

describe("template text format", () => {
  it("parses phases and tasks with optional priority and day", () => {
    const parsed = parseTemplateText("## Discovery\n- Kickoff call | high | 0\n- Map the workflow | | 3\n- Write brief\n\n## Build\n- Build pages | urgent");
    expect(parsed).toEqual({
      phases: [
        { name: "Discovery", tasks: [{ title: "Kickoff call", priority: "high", day: 0 }, { title: "Map the workflow", day: 3 }, { title: "Write brief" }] },
        { name: "Build", tasks: [{ title: "Build pages", priority: "urgent" }] },
      ],
    });
  });

  it("reports readable errors with line numbers", () => {
    expect(parseTemplateText("- task first")).toEqual({ error: 'Line 1: start with a phase heading such as "## Discovery".' });
    expect(parseTemplateText("## A\n- t | wild")).toEqual({ error: "Line 2: priority must be low, medium, high or urgent." });
    expect(parseTemplateText("## A\n- t | low | soon")).toEqual({ error: "Line 2: the day must be a whole number of days from the start." });
    expect(parseTemplateText("##")).toEqual({ error: "Line 1: a phase needs a name." });
    expect(parseTemplateText("   ")).toEqual({ error: "Add at least one phase." });
  });

  it("round-trips through the text editor format", () => {
    const phases = [{ name: "Shoot", tasks: [{ title: "Shoot day", priority: "high", day: 10 }, { title: "Backup footage" }] }];
    const text = templateToText(phases);
    expect(text).toBe("## Shoot\n- Shoot day | high | 10\n- Backup footage");
    expect(parseTemplateText(text)).toEqual({ phases });
  });

  it("recognises a missing-0025 error", () => {
    expect(needsPhasesMigration('relation "public.project_phases" does not exist')).toBe(true);
    expect(needsPhasesMigration("permission denied")).toBe(false);
  });
});
