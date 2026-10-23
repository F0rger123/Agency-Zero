import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { BoardEditor } from "@/components/whiteboard/board";
import { DataFailure, MigrationsRequired, SetupRequired } from "@/components/states";
import { isMissingTable } from "@/lib/forms";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { parseBoard } from "@/lib/whiteboard/ops";

export const metadata: Metadata = { title: "Whiteboard" };
// The board owns the whole screen: no page zoom, and it respects the notch.
export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false, viewportFit: "cover" };

export default async function WhiteboardPage({ params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.from("whiteboards").select("id, title, data, public_token, share_mode").eq("id", id).maybeSingle();
  if (error) return isMissingTable(error.message) ? <MigrationsRequired detail="Whiteboards need database update 0032." /> : <DataFailure title="Whiteboard" message={error.message} />;
  if (!data) notFound();
  const row = data as { id: string; title: string; data: unknown; public_token: string; share_mode: "edit" | "view" | "off" };
  return <BoardEditor initial={parseBoard(row.data)} boardId={row.id} token={row.public_token} role="owner" shareMode={row.share_mode} title={row.title} backHref="/app/whiteboard" />;
}
