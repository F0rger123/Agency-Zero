import { describe, expect, it } from "vitest";
import { isOpenStatus, needsWorkItemsMigration, statusLabel, statusOptions } from "./work-items";

describe("work items", () => {
  it("labels the shared status enum per kind", () => {
    expect(statusLabel("bug", "todo")).toBe("Open");
    expect(statusLabel("bug", "done")).toBe("Fixed");
    expect(statusLabel("bug", "cancelled")).toBe("Won't fix");
    expect(statusLabel("feature_request", "todo")).toBe("Requested");
    expect(statusLabel("feature_request", "done")).toBe("Shipped");
    expect(statusLabel("task", "blocked_waiting_client")).toBe("Waiting on client");
    expect(statusLabel("mystery", "todo")).toBe("To do");
  });

  it("offers every status for each kind", () => {
    for (const kind of ["task", "bug", "feature_request"]) {
      expect(statusOptions(kind).map((option) => option.value)).toEqual([
        "todo",
        "in_progress",
        "blocked_waiting_client",
        "blocked_other",
        "done",
        "cancelled",
      ]);
    }
  });

  it("knows which statuses are open", () => {
    expect(isOpenStatus("todo")).toBe(true);
    expect(isOpenStatus("blocked_other")).toBe(true);
    expect(isOpenStatus("done")).toBe(false);
    expect(isOpenStatus("cancelled")).toBe(false);
  });

  it("recognises a missing-0023 database error", () => {
    expect(needsWorkItemsMigration('column "kind" of relation "tasks" does not exist')).toBe(true);
    expect(needsWorkItemsMigration("Could not find the 'severity' column of 'tasks' in the schema cache")).toBe(true);
    expect(needsWorkItemsMigration("permission denied for table tasks")).toBe(false);
  });
});
