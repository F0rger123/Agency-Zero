import { describe, expect, it } from "vitest";
import { groupOf, groupTasks } from "./task-groups";

const t = (title: string, due_date: string | null, status = "todo", priority = "medium") => ({ title, due_date, status, priority });

describe("task groups", () => {
  const today = "2026-10-23";
  it("puts each task in the right bucket", () => {
    expect(groupOf(t("a", "2026-10-20"), today)).toBe("overdue");
    expect(groupOf(t("a", today), today)).toBe("today");
    expect(groupOf(t("a", "2026-10-30"), today)).toBe("week");
    expect(groupOf(t("a", "2026-11-20"), today)).toBe("later");
    expect(groupOf(t("a", null), today)).toBe("nodate");
    expect(groupOf(t("a", "2026-10-01", "done"), today)).toBe("done");
  });
  it("orders groups and sorts by date then priority", () => {
    const groups = groupTasks([t("later", "2026-12-01"), t("b", today, "todo", "low"), t("a", today, "todo", "urgent"), t("late", "2026-10-01")], today);
    expect(groups.map((g) => g.key)).toEqual(["overdue", "today", "later"]);
    expect(groups[1].tasks.map((x) => x.title)).toEqual(["a", "b"]);
  });
});
