import type { Metadata } from "next";
import Link from "next/link";
import { AddDialog } from "@/components/modal";
import { PageHeader } from "@/components/page-header";
import { DataFailure, MigrationsRequired, SetupRequired } from "@/components/states";
import { dateTimeLabel } from "@/lib/format";
import { isMissingTable } from "@/lib/forms";
import { LIST_LIMIT, PICKER_LIMIT } from "@/lib/limits";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { NewMeetingForm } from "./meeting-forms";

export const metadata: Metadata = { title: "Meetings" };

type Row = {
  id: string;
  title: string;
  meeting_at: string;
  status: "scheduled" | "in_progress" | "done";
  location: string | null;
  clients: { id: string; name: string } | { id: string; name: string }[] | null;
};

/** Every meeting, with or without a customer. Each one holds its notes, questions, whiteboards and uploads. */
export default async function MeetingsPage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  const supabase = await createClient();
  const [meetings, clients] = await Promise.all([
    supabase.from("meetings").select("id, title, meeting_at, status, location, clients(id, name)").order("meeting_at", { ascending: false }).limit(LIST_LIMIT),
    supabase.from("clients").select("id, name, company").is("deleted_at", null).order("name").limit(PICKER_LIMIT),
  ]);
  const options = ((clients.data ?? []) as { id: string; name: string; company: string | null }[]).map((client) => ({ id: client.id, label: `${client.name}${client.company ? ` · ${client.company}` : ""}` }));
  const header = (
    <PageHeader
      title="Meetings"
      description="Notes, questions, whiteboards and photos from every meeting, saved to the customer's file."
      action={
        meetings.error ? null : (
          <AddDialog label="New meeting" title="New meeting" description="In person or on a call. You can file it under a customer now or later.">
            <NewMeetingForm clients={options} />
          </AddDialog>
        )
      }
    />
  );
  if (meetings.error) {
    return (
      <>
        {header}
        {isMissingTable(meetings.error.message) ? <MigrationsRequired detail="Meeting notes need database update 0027." /> : <DataFailure title="Meetings" message={meetings.error.message} />}
      </>
    );
  }
  const rows = (meetings.data ?? []) as unknown as Row[];
  return (
    <>
      {header}
      {rows.length === 0 ? (
        <p className="border-y border-border py-10 text-sm text-muted-foreground">No meetings yet. Start one before you sit down with a customer.</p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {rows.map((row) => {
            const client = Array.isArray(row.clients) ? row.clients[0] : row.clients;
            const live = row.status === "in_progress";
            return (
              <li key={row.id}>
                <Link href={`/app/meetings/${row.id}`} className="press flex items-center justify-between gap-4 py-4 transition-colors hover:bg-muted/50 sm:px-2">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{row.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {client?.name ?? "No customer yet"} · {dateTimeLabel(row.meeting_at)}
                      {row.location ? ` · ${row.location}` : ""}
                    </span>
                  </span>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest ${live ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"}`}>
                    {live ? "Live" : row.status === "done" ? "Done" : "Scheduled"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
