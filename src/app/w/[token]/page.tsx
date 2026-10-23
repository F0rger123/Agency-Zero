import type { Metadata, Viewport } from "next";
import { BoardEditor } from "@/components/whiteboard/board";
import { MigrationsRequired, SetupRequired } from "@/components/states";
import { isMissingTable } from "@/lib/forms";
import { hashPublicToken } from "@/lib/public-tokens";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { parseBoard } from "@/lib/whiteboard/ops";

export const metadata: Metadata = { title: "Whiteboard", robots: { index: false, follow: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false, viewportFit: "cover" };

/** The link the other person on the call opens: the same board, live, with no account. */
export default async function SharedWhiteboardPage({ params }: { params: Promise<{ token: string }> }) {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  const { token } = await params;
  const supabase = await createClient();
  const response = await supabase.rpc("get_public_whiteboard", { p_token_hash: hashPublicToken(token) });
  if (response.error) {
    if (isMissingTable(response.error.message)) return <MigrationsRequired />;
    throw new Error(response.error.message);
  }
  if (!response.data) {
    return (
      <main className="mx-auto max-w-md px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">This board is not available</h1>
        <p className="mt-2 text-sm text-muted-foreground">The link may have been turned off or replaced. Ask for a new one.</p>
      </main>
    );
  }
  const board = response.data as { title: string; data: unknown; mode: "edit" | "view" | "off" };
  return <BoardEditor initial={parseBoard(board.data)} token={token} role="guest" shareMode={board.mode} title={board.title} />;
}
