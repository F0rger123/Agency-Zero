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
  tasks: [{ id: "t1", title: "Logo", client_id: "c1", project_id: "p1" }],
  services: [{ id: "s1", name: "Logo design", default_billing: "one_off", default_price: 400 }],
};

describe("sanitizeActions", () => {
  it("drops ids that were never offered and derives the client from a project", () => {
    const result = sanitizeActions(
      [
        { type: "create_task", title: "Send draft", client_id: "evil", project_id: "p1" },
        { type: "note", body: "hello", client_id: "nope" },
      ],
      context,
    );
    expect(result[0]).toMatchObject({ type: "create_task", client_id: "c1", project_id: "p1", status: "todo" });
    expect(result[1]).toMatchObject({ type: "note", client_id: null });
  });

  it("lets new records in the same note refer to each other", () => {
    const result = sanitizeActions(
      [
        { type: "create_client", ref: "Zed Co", name: "Zed Co", email: "bad" },
        { type: "create_project", ref: "site", name: "Zed website", client_ref: "zed-co", value: 2500, deadline: "2026-12-01" },
        { type: "create_task", title: "Kickoff call", client_ref: "zed-co", project_ref: "site" },
        { type: "create_task", title: "Orphan", client_ref: "never-created", project_ref: "also-never" },
      ],
      context,
    );
    expect(result[0]).toMatchObject({ type: "create_client", ref: "zed-co", email: null });
    expect(result[1]).toMatchObject({ type: "create_project", client_ref: "zed-co", value: 2500 });
    expect(result[2]).toMatchObject({ type: "create_task", client_ref: "zed-co", project_ref: "site" });
    expect(result[3]).toMatchObject({ client_ref: null, project_ref: null });
  });

  it("validates updates, payments, invoices, services and reminders", () => {
    const result = sanitizeActions(
      [
        { type: "update_project", project_id: "p1", progress: 140 },
        { type: "update_project", project_id: "p1" },
        { type: "update_task", task_id: "t1", status: "done" },
        { type: "update_task", task_id: "nope", status: "done" },
        { type: "payment", client_id: "c1", amount: -5 },
        { type: "payment", client_id: "c1", amount: 250, method: "venmo" },
        { type: "invoice", client_id: "c2", title: "Retainer", amount: 900 },
        { type: "service", client_id: "c1", service_id: "s1", billing: "one_off", amount: 400 },
        { type: "service", client_id: "c1", service_id: "unknown" },
        { type: "reminder", client_id: "c1", message: "Call back", due_at: "2026-10-09T14:00:00Z" },
        { type: "reminder", message: "No time" },
        "junk",
      ],
      context,
    );
    expect(result.map((a) => a.type)).toEqual(["update_project", "update_task", "payment", "invoice", "service", "reminder"]);
    expect(result[0]).toMatchObject({ progress: 100 });
    expect(result[2]).toMatchObject({ amount: 250, method: "venmo" });
    expect(result[3]).toMatchObject({ status: "sent", amount: 900 });
    expect(result[5]).toMatchObject({ due_at: "2026-10-09T14:00" });
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
    expect(actions.map((a) => a.type)).toEqual(["note", "update_project", "payment"]);
    expect(actions[1]).toMatchObject({ project_id: "p1", progress: 50 });
    expect(actions[2]).toMatchObject({ client_id: "c1", amount: 400, method: "venmo" });
  });

  it("returns nothing for an empty note", () => {
    expect(heuristicActions("   ", context)).toEqual([]);
  });
});
