/** Groups tasks for the simple list: what is late, what is today, the next week, later, undated, and recently done. */
export type GroupKey = "overdue" | "today" | "week" | "later" | "nodate" | "done";
export const GROUP_LABEL: Record<GroupKey, string> = {
  overdue: "Overdue",
  today: "Today",
  week: "Next 7 days",
  later: "Later",
  nodate: "No due date",
  done: "Done recently",
};
const ORDER: GroupKey[] = ["overdue", "today", "week", "later", "nodate", "done"];
const CLOSED = new Set(["done", "cancelled"]);

const addDays = (iso: string, days: number) => {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

export function groupOf(task: { status: string; due_date: string | null }, today: string): GroupKey {
  if (CLOSED.has(task.status)) return "done";
  if (!task.due_date) return "nodate";
  if (task.due_date < today) return "overdue";
  if (task.due_date === today) return "today";
  if (task.due_date <= addDays(today, 7)) return "week";
  return "later";
}

const RANK: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

export function groupTasks<T extends { status: string; due_date: string | null; priority: string; title: string }>(tasks: T[], today: string) {
  const buckets = new Map<GroupKey, T[]>();
  for (const task of tasks) {
    const key = groupOf(task, today);
    buckets.set(key, [...(buckets.get(key) ?? []), task]);
  }
  return ORDER.filter((key) => buckets.has(key)).map((key) => ({
    key,
    label: GROUP_LABEL[key],
    tasks: (buckets.get(key) as T[]).sort(
      (a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999") || (RANK[a.priority] ?? 9) - (RANK[b.priority] ?? 9) || a.title.localeCompare(b.title),
    ),
  }));
}
