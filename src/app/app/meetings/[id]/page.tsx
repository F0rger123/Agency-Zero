import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { FileRow } from "@/components/file-links";
import { DataFailure, MigrationsRequired, SetupRequired } from "@/components/states";
import { dateTimeLabel } from "@/lib/format";
import { isMissingTable } from "@/lib/forms";
import { PICKER_LIMIT } from "@/lib/limits";
import { MEETING_WORKSPACE_MIGRATION_MESSAGE, meetingDuration, readMeetings, type Meeting } from "@/lib/meetings";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { MeetingEditor } from "../meeting-editor";
import { AssignClientForm, MeetingBoardButtons, MeetingFiles, MeetingUploadForm } from "../meeting-forms";

export const metadata: Metadata = { title: "Meeting" };

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border-[1.5px] border-foreground/20 p-5 sm:p-6">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** One meeting: its whiteboards, notes, questions and uploads, all filed under the customer. */
export default async function MeetingPage({ params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  const { id } = await params;
  const supabase = await createClient();

  // A database behind 0033/0034 lacks questions/scratchpad: load the rest and let the editor hide those sections.
  const found = await readMeetings((columns) => supabase.from("meetings").select(`${columns}, clients(id, name)`).eq("id", id).maybeSingle());
  if (found.error) {
    return isMissingTable(found.error.message) ? <MigrationsRequired detail="Meeting notes need database update 0027." /> : <DataFailure title="Meeting" message={found.error.message} />;
  }
  if (!found.data) notFound();
  const row = found.data as unknown as Meeting & { clients: { id: string; name: string } | { id: string; name: string }[] | null };
  const client = Array.isArray(row.clients) ? row.clients[0] : row.clients;
  const meeting: Meeting = { ...row };

  const [boards, files, clients] = await Promise.all([
    supabase.from("whiteboards").select("id, title, updated_at").eq("meeting_id", id).order("updated_at", { ascending: false }).limit(20),
    supabase.from("client_files").select("id, file_name, storage_path, mime_type, size_bytes, created_at").eq("meeting_id", id).order("created_at", { ascending: false }).limit(100),
    client ? Promise.resolve(null) : supabase.from("clients").select("id, name, company").is("deleted_at", null).order("name").limit(PICKER_LIMIT),
  ]);
  const boardRows = boards.error ? [] : ((boards.data ?? []) as { id: string; title: string; updated_at: string }[]);
  const fileRows = files.error ? [] : ((files.data ?? []) as FileRow[]);
  const linkMissing = Boolean(boards.error || files.error);
  const options = ((clients?.data ?? []) as { id: string; name: string; company: string | null }[]).map((entry) => ({ id: entry.id, label: `${entry.name}${entry.company ? ` · ${entry.company}` : ""}` }));
  const length = meetingDuration(meeting);

  return (
    <div className="space-y-6">
      <header>
        <Link href={client ? `/app/clients/${client.id}?tab=Meetings` : "/app/meetings"} className="text-sm text-muted-foreground underline-offset-4 hover:underline">
          ← {client ? client.name : "Meetings"}
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">{meeting.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {dateTimeLabel(meeting.meeting_at)}
          {meeting.location ? ` · ${meeting.location}` : ""}
          {length ? ` · ${length}` : ""}
          {client ? (
            <>
              {" · Saved to "}
              <Link href={`/app/clients/${client.id}`} className="text-foreground underline decoration-border underline-offset-4">
                {client.name}
              </Link>
            </>
          ) : null}
        </p>
      </header>

      {!Array.isArray(meeting.questions) || typeof meeting.scratchpad !== "string" || linkMissing ? <p className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">{MEETING_WORKSPACE_MIGRATION_MESSAGE}</p> : null}

      {client ? null : (
        <Section title="Not saved to a customer yet" description="Pick who this was with. The notes, whiteboards and uploads then show in their file.">
          <AssignClientForm meetingId={meeting.id} clients={options} />
        </Section>
      )}

      <Section title="Whiteboard" description="Draw it out together. The whiteboard has a notepad that writes into this meeting's notes.">
        {boardRows.length > 0 ? (
          <ul className="mb-4 grid gap-2 sm:grid-cols-2">
            {boardRows.map((board) => (
              <li key={board.id}>
                <Link href={`/app/whiteboard/${board.id}`} className="press flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 transition-colors hover:border-foreground hover:bg-muted">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{board.title}</span>
                    <span className="block text-xs text-muted-foreground">Edited {dateTimeLabel(board.updated_at)}</span>
                  </span>
                  <span aria-hidden>→</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
        <MeetingBoardButtons meetingId={meeting.id} hasBoard={boardRows.length > 0} />
      </Section>

      <Section title="Notes and questions">
        <MeetingEditor meeting={meeting} afterDelete="list" />
      </Section>

      <Section title="Uploads" description="Photos of a sketch, a document they gave you, exported boards.">
        {client ? (
          <div className="space-y-5">
            <MeetingUploadForm meetingId={meeting.id} />
            <MeetingFiles clientId={client.id} files={fileRows} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Save this meeting to a customer first, so uploads have a home.</p>
        )}
      </Section>
    </div>
  );
}
