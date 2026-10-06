/**
 * Quick note: turn something the owner said or typed into proposed CRM changes.
 *
 * Nothing here writes to the database. A proposal is only ever applied after the owner reviews it
 * (AGENTS.md: AI never mutates records without an explicit confirmation step). Every id in a proposal
 * is checked against the clients/projects that were actually offered, so a model can never point an
 * action at a record it was not shown.
 */

export type NoteClient = { id: string; name: string; company: string | null };
export type NoteProject = { id: string; name: string; client_id: string };
export type NoteContext = { clients: NoteClient[]; projects: NoteProject[] };

export type ProposedAction =
  | { type: "note"; client_id: string | null; body: string }
  | {
      type: "task";
      client_id: string | null;
      project_id: string | null;
      title: string;
      description: string | null;
      status: "todo" | "in_progress" | "done";
      priority: "low" | "medium" | "high" | "urgent";
      due_date: string | null;
    }
  | { type: "project_update"; project_id: string; progress: number | null; status: ProjectStatus | null }
  | {
      type: "payment";
      client_id: string | null;
      project_id: string | null;
      amount: number;
      description: string;
      method: "bank_transfer" | "card" | "cash" | "stripe" | "venmo" | "other";
    };

export type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "cancelled";

const PROJECT_STATUSES: ProjectStatus[] = ["planning", "active", "on_hold", "completed", "cancelled"];
const TASK_STATUSES = ["todo", "in_progress", "done"] as const;
const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
const METHODS = ["bank_transfer", "card", "cash", "stripe", "venmo", "other"] as const;

const asText = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");
const oneOf = <T extends string>(value: unknown, list: readonly T[]): T | null =>
  typeof value === "string" && (list as readonly string[]).includes(value) ? (value as T) : null;
const isoDate = (value: unknown) => (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null);

/** Validate untrusted proposals (from a model) against the records that were offered. */
export function sanitizeActions(raw: unknown, context: NoteContext): ProposedAction[] {
  if (!Array.isArray(raw)) return [];
  const clientIds = new Set(context.clients.map((client) => client.id));
  const projectsById = new Map(context.projects.map((project) => [project.id, project]));
  const result: ProposedAction[] = [];

  for (const item of raw.slice(0, 12)) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const projectId = typeof row.project_id === "string" && projectsById.has(row.project_id) ? row.project_id : null;
    let clientId = typeof row.client_id === "string" && clientIds.has(row.client_id) ? row.client_id : null;
    // A project always implies its own client.
    if (projectId) clientId = projectsById.get(projectId)!.client_id;

    if (row.type === "note") {
      const body = asText(row.body, 5000);
      if (body) result.push({ type: "note", client_id: clientId, body });
    } else if (row.type === "task") {
      const title = asText(row.title, 200);
      if (!title) continue;
      result.push({
        type: "task",
        client_id: clientId,
        project_id: projectId,
        title,
        description: asText(row.description, 2000) || null,
        status: oneOf(row.status, TASK_STATUSES) ?? "todo",
        priority: oneOf(row.priority, PRIORITIES) ?? "medium",
        due_date: isoDate(row.due_date),
      });
    } else if (row.type === "project_update") {
      if (!projectId) continue;
      const progress = typeof row.progress === "number" && Number.isFinite(row.progress) ? Math.min(100, Math.max(0, Math.round(row.progress))) : null;
      const status = oneOf(row.status, PROJECT_STATUSES);
      if (progress === null && status === null) continue;
      result.push({ type: "project_update", project_id: projectId, progress, status });
    } else if (row.type === "payment") {
      const amount = typeof row.amount === "number" ? Math.round(row.amount * 100) / 100 : NaN;
      if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000) continue;
      result.push({
        type: "payment",
        client_id: clientId,
        project_id: projectId,
        amount,
        description: asText(row.description, 200) || "Payment",
        method: oneOf(row.method, METHODS) ?? "other",
      });
    }
  }
  return result;
}

const normal = (value: string) => value.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

/** Longest client name or company that appears in the text. */
export function findClient(text: string, clients: NoteClient[]): NoteClient | null {
  const haystack = ` ${normal(text)} `;
  let best: { client: NoteClient; length: number } | null = null;
  for (const client of clients) {
    for (const label of [client.name, client.company ?? ""]) {
      const needle = normal(label);
      if (needle.length < 3 || !haystack.includes(` ${needle} `)) continue;
      if (!best || needle.length > best.length) best = { client, length: needle.length };
    }
  }
  return best?.client ?? null;
}

/**
 * Offline fallback when no AI key is configured: keeps the words as a note on the client that is named,
 * and pulls out two things that are unambiguous: "N%" on a named project and "paid $N".
 */
export function heuristicActions(text: string, context: NoteContext): ProposedAction[] {
  const body = text.trim();
  if (!body) return [];
  const client = findClient(body, context.clients);
  const actions: ProposedAction[] = [{ type: "note", client_id: client?.id ?? null, body }];

  const haystack = ` ${normal(body)} `;
  const scoped = context.projects.filter((project) => !client || project.client_id === client.id);
  const matched = scoped.filter((project) => {
    const needle = normal(project.name);
    return needle.length >= 3 && haystack.includes(` ${needle} `);
  });
  const percent = body.match(/(\d{1,3})\s*(?:%|percent)/i);
  if (matched.length === 1 && percent) {
    const progress = Math.min(100, Number(percent[1]));
    actions.push({ type: "project_update", project_id: matched[0].id, progress, status: null });
  }
  const paid = body.match(/\bpaid\b[^$\d]{0,20}\$?\s?(\d[\d,]*(?:\.\d{1,2})?)/i);
  if (paid) {
    const amount = Number(paid[1].replaceAll(",", ""));
    if (Number.isFinite(amount) && amount > 0) {
      actions.push({
        type: "payment",
        client_id: client?.id ?? null,
        project_id: matched.length === 1 ? matched[0].id : null,
        amount,
        description: matched.length === 1 ? matched[0].name : "Payment",
        method: /venmo/i.test(body) ? "venmo" : /cash/i.test(body) ? "cash" : "other",
      });
    }
  }
  return actions;
}
