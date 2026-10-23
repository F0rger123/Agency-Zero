import type { Metadata } from "next";
import Link from "next/link";
import { AddDialog } from "@/components/modal";
import { ConfirmDelete } from "@/components/confirm-delete";
import { PageHeader } from "@/components/page-header";
import { DataFailure, MigrationsRequired, SetupRequired } from "@/components/states";
import { dateTimeLabel } from "@/lib/format";
import { isMissingTable } from "@/lib/forms";
import { LIST_LIMIT, PICKER_LIMIT } from "@/lib/limits";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { deleteWhiteboardAction } from "./actions";
import { NewBoardForm } from "./new-board-form";

export const metadata: Metadata = { title: "Whiteboard" };

type Row = { id: string; title: string; updated_at: string; share_mode: string; clients: { name: string } | { name: string }[] | null };

/** Call boards: a four-frame whiteboard for walking a prospect through their problem, what they need, how you help and the path forward. */
export default async function WhiteboardListPage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  const supabase = await createClient();
  const [boards, clients] = await Promise.all([
    supabase.from("whiteboards").select("id, title, updated_at, share_mode, clients(name)").order("updated_at", { ascending: false }).limit(LIST_LIMIT),
    supabase.from("clients").select("id, name, company").is("deleted_at", null).order("name").limit(PICKER_LIMIT),
  ]);
  const header = <PageHeader title="Whiteboard" description="Walk a prospect through four frames on a call. Draw together, live, from any phone or computer." />;
  if (boards.error) {
    return (
      <>
        {header}
        {isMissingTable(boards.error.message) ? <MigrationsRequired detail="Whiteboards need database update 0032." /> : <DataFailure title="Whiteboards" message={boards.error.message} hint="Boards are the public.whiteboards table (migration 0032)." />}
      </>
    );
  }
  const rows = (boards.data ?? []) as unknown as Row[];
  const options = ((clients.data ?? []) as { id: string; name: string; company: string | null }[]).map((client) => ({ id: client.id, label: `${client.name}${client.company ? ` · ${client.company}` : ""}` }));
  return (
    <>
      {header}
      <div className="-mt-4 mb-8">
        <AddDialog label="New board" title="New call board">
          <NewBoardForm clients={options} />
        </AddDialog>
      </div>
      {rows.length === 0 ? (
        <p className="border-y border-border py-10 text-sm text-muted-foreground">No boards yet. Create one before your next call.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => {
            const client = Array.isArray(row.clients) ? row.clients[0] : row.clients;
            return (
              <li key={row.id} className="widget-in rounded-2xl border-[1.5px] border-foreground/25 p-5 transition-colors hover:border-foreground">
                <Link href={`/app/whiteboard/${row.id}`} className="block">
                  <span className="block text-lg font-semibold tracking-tight">{row.title}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {client?.name ? `${client.name} · ` : ""}
                    {dateTimeLabel(row.updated_at)}
                  </span>
                </Link>
                <div className="mt-4 flex items-center justify-between">
                  <Link href={`/app/whiteboard/${row.id}`} className="text-sm underline decoration-border underline-offset-4">Open</Link>
                  <ConfirmDelete action={deleteWhiteboardAction} fields={{ id: row.id }} title={`Delete ${row.title}?`} message="The board and its drawings are permanently removed, and its shared link stops working." className="text-xs text-red-600 hover:text-red-700" />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
