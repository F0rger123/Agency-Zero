import { describe, expect, it } from "vitest";
import { MEETING_COLUMNS, readMeetings, cleanActionItems, cleanQuestions, meetingDuration, needsMeetingWorkspaceMigration, openItemsToConvert } from "./meetings";

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

  it("cleans questions from the browser", () => {
    const questions = cleanQuestions([{ id: "q1", text: "  Budget?  ", answer: "About 5k" }, { text: "" }, "junk", { text: "Timeline?" }]);
    expect(questions).toEqual([
      { id: "q1", text: "Budget?", answer: "About 5k" },
      { id: "1-9", text: "Timeline?", answer: "" },
    ]);
    expect(cleanQuestions(null)).toEqual([]);
  });

  it("spots a database without the meeting workspace update", () => {
    expect(needsMeetingWorkspaceMigration('column "questions" of relation "meetings" does not exist')).toBe(true);
    expect(needsMeetingWorkspaceMigration('null value in column "client_id" of relation "meetings" violates not-null constraint')).toBe(true);
    expect(needsMeetingWorkspaceMigration("permission denied")).toBe(false);
  });

  it("reads meetings on a database that is behind, dropping only the missing columns", async () => {
    const asked: string[] = [];
    const run = async (columns: string) => {
      asked.push(columns);
      if (columns.includes("scratchpad")) return { data: null, error: { message: 'column meetings.scratchpad does not exist' } };
      return { data: [{ id: "m" }], error: null };
    };
    const result = await readMeetings(run);
    expect(result.error).toBeNull();
    expect(asked).toEqual([`${MEETING_COLUMNS}, questions, scratchpad`, `${MEETING_COLUMNS}, questions`]);
  });

  it("does not hide unrelated errors behind the fallback", async () => {
    let calls = 0;
    const result = await readMeetings(async () => {
      calls += 1;
      return { data: null, error: { message: "permission denied" } };
    });
    expect(calls).toBe(1);
    expect(result.error?.message).toBe("permission denied");
  });
});
