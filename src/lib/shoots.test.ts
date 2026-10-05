import { describe, expect, it } from "vitest";
import { checklistProgress, describeRule, durationLabel, needsShootsMigration, parseChecklist, timeLabel } from "./shoots";

describe("shoots helpers", () => {
  it("formats times and durations", () => {
    expect(timeLabel("10:00:00")).toBe("10:00 AM");
    expect(timeLabel("13:30:00")).toBe("1:30 PM");
    expect(timeLabel("00:05:00")).toBe("12:05 AM");
    expect(timeLabel(null)).toBe("time TBC");
    expect(durationLabel(45)).toBe("45 min");
    expect(durationLabel(120)).toBe("2 h");
    expect(durationLabel(90)).toBe("1.5 h");
  });

  it("describes each kind of rule in plain English", () => {
    const base = { start_time: "10:00:00", duration_minutes: 120, week_of_month: null };
    expect(describeRule({ ...base, frequency: "weekly", weekday: 2 })).toBe("Every Tuesday at 10:00 AM, 2 h");
    expect(describeRule({ ...base, frequency: "biweekly", weekday: 5 })).toBe("Every other Friday at 10:00 AM, 2 h");
    expect(describeRule({ ...base, frequency: "monthly", weekday: 2, week_of_month: 1 })).toBe("The first Tuesday of each month at 10:00 AM, 2 h");
    expect(describeRule({ ...base, start_time: null, frequency: "weekly", weekday: 4 })).toBe("Every Thursday, 2 h");
    expect(describeRule({ ...base, frequency: "monthly", weekday: 5, week_of_month: 5 })).toBe("The last Friday of each month at 10:00 AM, 2 h");
  });

  it("cleans a pasted checklist", () => {
    expect(parseChecklist("- Charge batteries\n\n  * Shot list \n• Release forms")).toEqual(["Charge batteries", "Shot list", "Release forms"]);
    expect(parseChecklist("a\n".repeat(60)).length).toBe(40);
  });

  it("counts checklist progress", () => {
    expect(checklistProgress([{ text: "a", done: true }, { text: "b", done: false }])).toEqual({ done: 1, total: 2 });
    expect(checklistProgress(null)).toEqual({ done: 0, total: 0 });
  });

  it("recognises a missing-0024 error", () => {
    expect(needsShootsMigration('relation "public.shoots" does not exist')).toBe(true);
    expect(needsShootsMigration("permission denied")).toBe(false);
  });
});
