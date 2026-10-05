/** Recurring content shoots (migration 0024): rule wording, labels and small helpers shared by the UI and actions. */
export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
export const FREQUENCIES = ["weekly", "biweekly", "monthly"] as const;
export type Frequency = (typeof FREQUENCIES)[number];

export const SHOOT_STATUSES = ["planned", "confirmed", "shot", "rescheduled", "cancelled"] as const;
export type ShootStatus = (typeof SHOOT_STATUSES)[number];

export const STATUS_LABEL: Record<ShootStatus, string> = {
  planned: "Planned",
  confirmed: "Confirmed",
  shot: "Shot",
  rescheduled: "Rescheduled",
  cancelled: "Cancelled",
};

export const WEEK_OF_MONTH_LABEL: Record<number, string> = { 1: "first", 2: "second", 3: "third", 4: "fourth", 5: "last" };

export type ChecklistItem = { text: string; done: boolean };

export type ScheduleRule = {
  frequency: string;
  weekday: number;
  week_of_month: number | null;
  start_time: string | null;
  duration_minutes: number;
};

/** "10:00:00" -> "10:00 AM". */
export function timeLabel(time: string | null | undefined): string {
  if (!time) return "time TBC";
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h)) return "time TBC";
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m ?? 0).padStart(2, "0")} ${suffix}`;
}

export function durationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} h`;
}

/** Plain-English description of a schedule rule, e.g. "Every other Tuesday at 10:00 AM for 2 h". */
export function describeRule(rule: ScheduleRule): string {
  const day = WEEKDAYS[rule.weekday] ?? "day";
  let when: string;
  if (rule.frequency === "weekly") when = `Every ${day}`;
  else if (rule.frequency === "biweekly") when = `Every other ${day}`;
  else when = `The ${WEEK_OF_MONTH_LABEL[rule.week_of_month ?? 1] ?? "first"} ${day} of each month`;
  const at = rule.start_time ? ` at ${timeLabel(rule.start_time)}` : "";
  return `${when}${at}, ${durationLabel(rule.duration_minutes)}`;
}

/** Textarea lines -> clean checklist template (trimmed, blank lines dropped, capped). */
export function parseChecklist(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.replace(/^[-*•\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 40)
    .map((line) => line.slice(0, 200));
}

export const checklistToText = (checklist: unknown): string =>
  Array.isArray(checklist)
    ? checklist.map((item) => (typeof item === "string" ? item : (item as ChecklistItem).text)).filter(Boolean).join("\n")
    : "";

export function checklistProgress(checklist: unknown): { done: number; total: number } {
  const items = Array.isArray(checklist) ? (checklist as ChecklistItem[]) : [];
  return { done: items.filter((item) => item?.done).length, total: items.length };
}

/** True when a database error means migration 0024 is missing. */
export const needsShootsMigration = (message: string): boolean =>
  /relation .*shoot|shoots|shoot_schedules|get_shoots_overview|save_shoot_schedule|generate_shoots|schema cache/i.test(message);

export const SHOOTS_MIGRATION_MESSAGE = "Content shoots need database update 0024. Apply it in the Supabase SQL editor, then try again.";
