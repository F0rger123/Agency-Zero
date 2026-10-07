/**
 * Quick note: turn something the owner said or typed into proposed CRM changes.
 *
 * Nothing here writes to the database. A proposal is only ever applied after the owner reviews it
 * (AGENTS.md: AI never mutates records without an explicit confirmation step). Every id in a proposal
 * is checked against the records that were actually offered, so a model can never point an action at
 * something it was not shown. New records created in the same note refer to each other with short
 * `ref` names ("client_ref": "acme"), which are resolved in order when the owner confirms.
 */

export type NoteClient = { id: string; name: string; company: string | null };
export type NoteProject = { id: string; name: string; client_id: string };
export type NoteTask = { id: string; title: string; client_id: string | null; project_id: string | null };
export type NoteService = { id: string; name: string; default_billing: string; default_price: number | null };
export type NoteContext = { clients: NoteClient[]; projects: NoteProject[]; tasks: NoteTask[]; services: NoteService[] };

export type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "cancelled";
export type TaskStatus = "todo" | "in_progress" | "blocked_waiting_client" | "blocked_other" | "done";
export type Priority = "low" | "medium" | "high" | "urgent";
export type PayMethod = "bank_transfer" | "card" | "cash" | "stripe" | "venmo" | "other";

/** Who a proposal is about: an existing client, a client created earlier in the same note, or nobody yet. */
type ClientLink = { client_id: string | null; client_ref: string | null };
type ProjectLink = { project_id: string | null; project_ref: string | null };

export type ProposedAction =
  | { type: "create_client"; ref: string; name: string; company: string | null; email: string | null; phone: string | null }
  | ({ type: "create_project"; ref: string; name: string; status: ProjectStatus; description: string | null; deadline: string | null; value: number | null } & ClientLink)
  | ({
      type: "create_task";
      title: string;
      description: string | null;
      status: TaskStatus;
      priority: Priority;
      due_date: string | null;
    } & ClientLink &
      ProjectLink)
  | { type: "update_task"; task_id: string; status: TaskStatus | null; priority: Priority | null; due_date: string | null; note: string | null }
  | { type: "update_project"; project_id: string; progress: number | null; status: ProjectStatus | null }
  | ({ type: "note"; body: string } & ClientLink)
  | ({ type: "payment"; amount: number; description: string; method: PayMethod } & ClientLink & ProjectLink)
  | ({ type: "invoice"; title: string; amount: number; status: "draft" | "sent"; due_on: string | null } & ClientLink & ProjectLink)
  | ({ type: "service"; service_id: string; billing: "one_off" | "recurring"; amount: number | null; interval: "monthly" | "quarterly" | "yearly" } & ClientLink)
  | ({ type: "reminder"; message: string; due_at: string } & ClientLink);

const PROJECT_STATUSES: ProjectStatus[] = ["planning", "active", "on_hold", "completed", "cancelled"];
const TASK_STATUSES: TaskStatus[] = ["todo", "in_progress", "blocked_waiting_client", "blocked_other", "done"];
const PRIORITIES: Priority[] = ["low", "medium", "high", "urgent"];
const METHODS: PayMethod[] = ["bank_transfer", "card", "cash", "stripe", "venmo", "other"];
const INTERVALS = ["monthly", "quarterly", "yearly"] as const;

const asText = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");
const oneOf = <T extends string>(value: unknown, list: readonly T[]): T | null =>
  typeof value === "string" && (list as readonly string[]).includes(value) ? (value as T) : null;
const isoDate = (value: unknown) => (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null);
const money = (value: unknown, max = 10_000_000) => {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) && n > 0 && n <= max ? Math.round(n * 100) / 100 : null;
};
const refName = (value: unknown) => {
  const text = asText(value, 40).toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
  return text || null;
};
/** "2026-10-09T14:00" or a full ISO string; kept as UTC wall-clock like the rest of the CRM. */
const dateTime = (value: unknown) => {
  if (typeof value !== "string") return null;
  const match = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/.exec(value.trim());
  return match ? `${match[1]}T${match[2]}` : null;
};

/** Validate untrusted proposals (from a model) against the records that were offered. */
export function sanitizeActions(raw: unknown, context: NoteContext): ProposedAction[] {
  if (!Array.isArray(raw)) return [];
  const clientIds = new Set(context.clients.map((client) => client.id));
  const projectsById = new Map(context.projects.map((project) => [project.id, project]));
  const taskIds = new Set(context.tasks.map((task) => task.id));
  const serviceIds = new Set(context.services.map((service) => service.id));
  const result: ProposedAction[] = [];
  const clientRefs = new Set<string>();
  const projectRefs = new Map<string, string | null>(); // ref -> client_ref it belongs to

  for (const item of raw.slice(0, 20)) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;

    const link = (): ClientLink & ProjectLink => {
      let project_id = typeof row.project_id === "string" && projectsById.has(row.project_id) ? row.project_id : null;
      const project_ref = !project_id && typeof row.project_ref === "string" && projectRefs.has(refName(row.project_ref) ?? "") ? refName(row.project_ref) : null;
      let client_id = typeof row.client_id === "string" && clientIds.has(row.client_id) ? row.client_id : null;
      let client_ref = !client_id && typeof row.client_ref === "string" && clientRefs.has(refName(row.client_ref) ?? "") ? refName(row.client_ref) : null;
      // A project always implies its own client.
      if (project_id) {
        client_id = projectsById.get(project_id)!.client_id;
        client_ref = null;
      } else if (project_ref) {
        const owner = projectRefs.get(project_ref) ?? null;
        if (owner && !client_id) client_ref = owner;
      }
      project_id = project_id ?? null;
      return { client_id, client_ref, project_id, project_ref };
    };

    switch (row.type) {
      case "create_client": {
        const name = asText(row.name, 160);
        const ref = refName(row.ref) ?? refName(name);
        if (!name || !ref || clientRefs.has(ref)) break;
        const email = asText(row.email, 200);
        clientRefs.add(ref);
        result.push({ type: "create_client", ref, name, company: asText(row.company, 160) || null, email: email.includes("@") ? email : null, phone: asText(row.phone, 60) || null });
        break;
      }
      case "create_project": {
        const name = asText(row.name, 200);
        const ref = refName(row.ref) ?? refName(name);
        if (!name || !ref || projectRefs.has(ref)) break;
        const { client_id, client_ref } = link();
        projectRefs.set(ref, client_ref);
        result.push({
          type: "create_project",
          ref,
          name,
          client_id,
          client_ref,
          status: oneOf(row.status, PROJECT_STATUSES) ?? "planning",
          description: asText(row.description, 2000) || null,
          deadline: isoDate(row.deadline),
          value: money(row.value),
        });
        break;
      }
      case "create_task": {
        const title = asText(row.title, 200);
        if (!title) break;
        result.push({
          type: "create_task",
          title,
          ...link(),
          description: asText(row.description, 2000) || null,
          status: oneOf(row.status, TASK_STATUSES) ?? "todo",
          priority: oneOf(row.priority, PRIORITIES) ?? "medium",
          due_date: isoDate(row.due_date),
        });
        break;
      }
      case "update_task": {
        if (typeof row.task_id !== "string" || !taskIds.has(row.task_id)) break;
        const status = oneOf(row.status, TASK_STATUSES);
        const priority = oneOf(row.priority, PRIORITIES);
        const due = isoDate(row.due_date);
        const note = asText(row.note, 1000) || null;
        if (!status && !priority && !due && !note) break;
        result.push({ type: "update_task", task_id: row.task_id, status, priority, due_date: due, note });
        break;
      }
      case "update_project": {
        const id = typeof row.project_id === "string" && projectsById.has(row.project_id) ? row.project_id : null;
        if (!id) break;
        const progress = typeof row.progress === "number" && Number.isFinite(row.progress) ? Math.min(100, Math.max(0, Math.round(row.progress))) : null;
        const status = oneOf(row.status, PROJECT_STATUSES);
        if (progress === null && status === null) break;
        result.push({ type: "update_project", project_id: id, progress, status });
        break;
      }
      case "note": {
        const body = asText(row.body, 5000);
        if (!body) break;
        const { client_id, client_ref } = link();
        result.push({ type: "note", body, client_id, client_ref });
        break;
      }
      case "payment": {
        const amount = money(row.amount);
        if (amount === null) break;
        result.push({ type: "payment", amount, description: asText(row.description, 200) || "Payment", method: oneOf(row.method, METHODS) ?? "other", ...link() });
        break;
      }
      case "invoice": {
        const amount = money(row.amount);
        const title = asText(row.title, 200);
        if (amount === null || !title) break;
        result.push({ type: "invoice", title, amount, status: row.status === "draft" ? "draft" : "sent", due_on: isoDate(row.due_on), ...link() });
        break;
      }
      case "service": {
        if (typeof row.service_id !== "string" || !serviceIds.has(row.service_id)) break;
        const { client_id, client_ref } = link();
        result.push({
          type: "service",
          service_id: row.service_id,
          client_id,
          client_ref,
          billing: row.billing === "recurring" ? "recurring" : "one_off",
          amount: money(row.amount),
          interval: oneOf(row.interval, INTERVALS) ?? "monthly",
        });
        break;
      }
      case "reminder": {
        const message = asText(row.message, 1000);
        const due = dateTime(row.due_at);
        if (!message || !due) break;
        const { client_id, client_ref } = link();
        result.push({ type: "reminder", message, due_at: due, client_id, client_ref });
        break;
      }
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
 * It cannot create records; that needs the AI organiser.
 */
export function heuristicActions(text: string, context: NoteContext): ProposedAction[] {
  const body = text.trim();
  if (!body) return [];
  const client = findClient(body, context.clients);
  const actions: ProposedAction[] = [{ type: "note", client_id: client?.id ?? null, client_ref: null, body }];

  const haystack = ` ${normal(body)} `;
  const scoped = context.projects.filter((project) => !client || project.client_id === client.id);
  const matched = scoped.filter((project) => {
    const needle = normal(project.name);
    return needle.length >= 3 && haystack.includes(` ${needle} `);
  });
  const percent = body.match(/(\d{1,3})\s*(?:%|percent)/i);
  if (matched.length === 1 && percent) {
    actions.push({ type: "update_project", project_id: matched[0].id, progress: Math.min(100, Number(percent[1])), status: null });
  }
  const paid = body.match(/\bpaid\b[^$\d]{0,20}\$?\s?(\d[\d,]*(?:\.\d{1,2})?)/i);
  if (paid) {
    const amount = Number(paid[1].replaceAll(",", ""));
    if (Number.isFinite(amount) && amount > 0) {
      actions.push({
        type: "payment",
        client_id: client?.id ?? null,
        client_ref: null,
        project_id: matched.length === 1 ? matched[0].id : null,
        project_ref: null,
        amount,
        description: matched.length === 1 ? matched[0].name : "Payment",
        method: /venmo/i.test(body) ? "venmo" : /cash/i.test(body) ? "cash" : "other",
      });
    }
  }
  return actions;
}
