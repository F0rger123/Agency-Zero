import { describe, expect, it } from "vitest";
import { cleanActionItems, meetingDuration, openItemsToConvert } from "./meetings";

describe("meeting helpers", () => {
  it("cleans action items from the browser", () => {
    const items = cleanActionItems([{ id: "a", text: "  Send palette  ", done: 1 }, { text: "" }, 5, { text: "x".repeat(400), task: true }]);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ id: "a", text: "Send palette", done: true });
    expect(items[1].text).toHaveLength(300);
    expect(items[1].task).toBe(true);
    expect(cleanActionItems("nope")).toEqual([]);
  });

  it("only converts open, not-yet-converted items", () => {
    const open = openItemsToConvert([
      { id: "1", text: "a", done: false },
      { id: "2", text: "b", done: true },
      { id: "3", text: "c", done: false, task: true },
    ]);
    expect(open.map((item) => item.id)).toEqual(["1"]);
  });

  it("describes how long a meeting ran", () => {
    expect(meetingDuration({ meeting_at: "2026-10-10T10:00:00Z", ended_at: "2026-10-10T10:45:00Z" })).toBe("45 min");
    expect(meetingDuration({ meeting_at: "2026-10-10T10:00:00Z", ended_at: "2026-10-10T11:30:00Z" })).toBe("1 h 30 min");
    expect(meetingDuration({ meeting_at: "2026-10-10T10:00:00Z", ended_at: null })).toBeNull();
  });
});
