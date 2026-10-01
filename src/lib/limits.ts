import { todayIso } from "@/lib/format";

/**
 * Bounds for list/picker queries (audit B-008). Every list page used to load
 * every row; at agency scale that degrades both the query and the render.
 * Lists show at most LIST_LIMIT rows (and tell the owner when they are
 * truncated); form pickers load at most PICKER_LIMIT rows, newest first.
 */
export const LIST_LIMIT = 300;
export const PICKER_LIMIT = 500;

/** `YYYY-MM-DD` for N days before today (UTC). */
export function daysAgoIso(days: number): string {
  const date = new Date(`${todayIso()}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}
