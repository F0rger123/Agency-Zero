/**
 * Unified work items (migration 0023): tasks, bugs and feature requests are all `tasks` rows distinguished by `kind`.
 * The status enum is shared; labels differ per kind so a bug reads "Open → Fixed" and a request "Requested → Shipped".
 */
export const WORK_KINDS = ["task", "bug", "feature_request"] as const;
export type WorkKind = (typeof WORK_KINDS)[number];

export const SEVERITIES = ["low", "medium", "high", "critical"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const WORK_SOURCES = ["internal", "client", "website", "message", "other"] as const;
export type WorkSource = (typeof WORK_SOURCES)[number];

export const KIND_LABEL: Record<WorkKind, string> = { task: "Task", bug: "Bug", feature_request: "Feature request" };
export const KIND_LABEL_PLURAL: Record<WorkKind, string> = { task: "Tasks", bug: "Bugs", feature_request: "Feature requests" };

export const SOURCE_LABEL: Record<WorkSource, string> = {
  internal: "Found internally",
  client: "Reported by client",
  website: "From the website",
  message: "From a message",
  other: "Other",
};

const STATUS_LABELS: Record<WorkKind, Record<string, string>> = {
  task: {
    todo: "To do",
    in_progress: "In progress",
    blocked_waiting_client: "Waiting on client",
    blocked_other: "Blocked",
    done: "Done",
    cancelled: "Cancelled",
  },
  bug: {
    todo: "Open",
    in_progress: "Being fixed",
    blocked_waiting_client: "Waiting on client",
    blocked_other: "Blocked",
    done: "Fixed",
    cancelled: "Won't fix",
  },
  feature_request: {
    todo: "Requested",
    in_progress: "In progress",
    blocked_waiting_client: "Waiting on client",
    blocked_other: "On hold",
    done: "Shipped",
    cancelled: "Declined",
  },
};

export function isWorkKind(value: string): value is WorkKind {
  return (WORK_KINDS as readonly string[]).includes(value);
}

export function statusLabel(kind: string, status: string): string {
  const labels = STATUS_LABELS[isWorkKind(kind) ? kind : "task"];
  return labels[status] ?? status.replaceAll("_", " ");
}

/** Status values in the order a form should offer them, with the label for this kind. */
export function statusOptions(kind: string): { value: string; label: string }[] {
  const labels = STATUS_LABELS[isWorkKind(kind) ? kind : "task"];
  return Object.entries(labels).map(([value, label]) => ({ value, label }));
}

export const isOpenStatus = (status: string) => status !== "done" && status !== "cancelled";

/** True when a database error means migration 0023 has not been applied (missing column / function / cache entry). */
export function needsWorkItemsMigration(message: string): boolean {
  return /column .*(kind|severity|requester_contact_id|resolution|source)|get_project_work_items|schema cache/i.test(message);
}

export const WORK_ITEMS_MIGRATION_MESSAGE = "Bugs and feature requests need database update 0023. Apply it in the Supabase SQL editor, then try again.";
