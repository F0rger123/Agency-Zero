import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { BoardEditor } from "@/components/whiteboard/board";
import { DataFailure, MigrationsRequired, SetupRequired } from "@/components/states";
import { isMissingTable } from "@/lib/forms";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { MEETING_COLUMNS, readMeetings } from "@/lib/meetings";
import { parseBoard } from "@/lib/whiteboard/ops";

export const metadata: Metadata = { title: "Whiteboard" };
// The board owns the whole screen: no page zoom, and it respects the notch.
export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false, viewportFit: "cover" };

export default async function WhiteboardPage({ params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  const { id } = await params;
  const supabase = await createClient();
  let result = await supabase.from("whiteboards").select("id, title, data, public_token, share_mode, client_id, meeting_id").eq("id", id).maybeSingle();
  // Before 0033 boards have no meeting link: open the board without one (the notepad offers to start a meeting).
  if (result.error && /meeting_id/i.test(result.error.message)) {
    result = (await supabase.from("whiteboards").select("id, title, data, public_token, share_mode, client_id").eq("id", id).maybeSingle()) as typeof result;
  }
  const { data, error } = result;
  if (error) return isMissingTable(error.message) ? <MigrationsRequired detail="Whiteboards need database update 0032." /> : <DataFailure title="Whiteboard" message={error.message} />;
  if (!data) notFound();
  const row = data as { id: string; title: string; data: unknown; public_token: string; share_mode: "edit" | "view" | "off"; client_id: string | null; meeting_id?: string | null };
  type BoardMeeting = { id: string; title: string; notes: string; client_id: string | null; scratchpad?: string };
  let meeting: BoardMeeting | null = null;
  if (row.meeting_id) {
    const meetingId = row.meeting_id;
    // The notepad tab needs 0034 (scratchpad); without it the panel shows the notes only.
    const found = await readMeetings((columns) => supabase.from("meetings").select(columns.replace(MEETING_COLUMNS, "id, title, notes, client_id")).eq("id", meetingId).maybeSingle());
    meeting = (found.data as unknown as BoardMeeting | null) ?? null;
  }
  return (
    <BoardEditor
      initial={parseBoard(row.data)}
      boardId={row.id}
      token={row.public_token}
      role="owner"
      shareMode={row.share_mode}
      title={row.title}
      backHref={meeting ? `/app/meetings/${meeting.id}` : "/app/whiteboard"}
      meeting={meeting ? { id: meeting.id, title: meeting.title, notes: meeting.notes ?? "", ...(typeof meeting.scratchpad === "string" ? { scratchpad: meeting.scratchpad } : {}) } : null}
      canFile={Boolean(row.client_id || meeting?.client_id)}
    />
  );
}
