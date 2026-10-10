/** Meeting notes (migration 0027). Pure helpers shared by the server actions and the editor. */

export type ActionItem = { id: string; text: string; done: boolean; /** already turned into a task */ task?: boolean };

export type Meeting = {
  id: string;
  client_id: string;
  project_id: string | null;
  title: string;
  meeting_at: string;
  location: string | null;
  attendees: string | null;
  agenda: string | null;
  notes: string;
  decisions: string | null;
  action_items: ActionItem[];
  status: "scheduled" | "in_progress" | "done";
  ended_at: string | null;
};

export const MEETINGS_MIGRATION_MESSAGE = "Meeting notes need database update 0027. Apply it in the Supabase SQL editor, then reload.";

export const needsMeetingsMigration = (message: string) => /meetings|schema cache|relation .* does not exist/i.test(message);

const text = (value: unknown, max: number) => (typeof value === "string" ? value.slice(0, max) : "");

/** Normalise untrusted action items (from the browser) before they are stored. */
export function cleanActionItems(raw: unknown): ActionItem[] {
  if (!Array.isArray(raw)) return [];
  const items: ActionItem[] = [];
  for (const entry of raw.slice(0, 100)) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const value = text(row.text, 300).trim();
    if (!value) continue;
    items.push({
      id: typeof row.id === "string" && row.id.length <= 64 ? row.id : `${items.length}-${value.length}`,
      text: value,
      done: Boolean(row.done),
      ...(row.task ? { task: true } : {}),
    });
  }
  return items;
}

export function openItemsToConvert(items: ActionItem[]): ActionItem[] {
  return items.filter((item) => !item.done && !item.task);
}

export function meetingDuration(meeting: Pick<Meeting, "meeting_at" | "ended_at">): string | null {
  if (!meeting.ended_at) return null;
  const minutes = Math.round((new Date(meeting.ended_at).getTime() - new Date(meeting.meeting_at).getTime()) / 60000);
  if (!Number.isFinite(minutes) || minutes < 1) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours} h ${minutes % 60 ? `${minutes % 60} min` : ""}`.trim();
}
