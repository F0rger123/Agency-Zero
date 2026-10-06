import { describe, expect, it } from "vitest";
import { findClient, heuristicActions, sanitizeActions, type NoteContext } from "./quick-note";

const context: NoteContext = {
  clients: [
    { id: "c1", name: "Acme Bakery", company: null },
    { id: "c2", name: "Dana Lee", company: "Lee Plumbing" },
  ],
  projects: [
    { id: "p1", name: "Website rebuild", client_id: "c1" },
    { id: "p2", name: "Brand refresh", client_id: "c2" },
  ],
};

describe("sanitizeActions", () => {
  it("drops ids that were never offered and derives the client from a project", () => {
    const result = sanitizeActions(
      [
        { type: "task", title: "Send draft", client_id: "evil", project_id: "p1" },
        { type: "note", body: "hello", client_id: "nope" },
      ],
      context,
    );
    expect(result[0]).toMatchObject({ type: "task", client_id: "c1", project_id: "p1", status: "todo" });
    expect(result[1]).toMatchObject({ type: "note", client_id: null });
  });

  it("clamps progress, rejects empty updates and bad payments", () => {
    const result = sanitizeActions(
      [
        { type: "project_update", project_id: "p1", progress: 140 },
        { type: "project_update", project_id: "p1" },
        { type: "payment", client_id: "c1", amount: -5 },
        { type: "payment", client_id: "c1", amount: 250, method: "venmo" },
        "junk",
      ],
      context,
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ type: "project_update", progress: 100 });
    expect(result[1]).toMatchObject({ type: "payment", amount: 250, method: "venmo" });
  });

  it("ignores non-arrays", () => {
    expect(sanitizeActions({ type: "note" }, context)).toEqual([]);
  });
});

describe("heuristics", () => {
  it("finds a client by name or company", () => {
    expect(findClient("talked to lee plumbing today", context.clients)?.id).toBe("c2");
    expect(findClient("nothing here", context.clients)).toBeNull();
  });

  it("proposes a note, progress and a payment from a plain sentence", () => {
    const actions = heuristicActions("Acme Bakery paid me $400 via venmo. Website rebuild is 50% done.", context);
    expect(actions.map((a) => a.type)).toEqual(["note", "project_update", "payment"]);
    expect(actions[1]).toMatchObject({ project_id: "p1", progress: 50 });
    expect(actions[2]).toMatchObject({ client_id: "c1", amount: 400, method: "venmo" });
  });

  it("returns nothing for an empty note", () => {
    expect(heuristicActions("   ", context)).toEqual([]);
  });
});
