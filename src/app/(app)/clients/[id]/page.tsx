import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isMissingTable } from "@/lib/forms";
import { PageHeader } from "@/components/page-header";
import { FormSection } from "@/components/form-controls";
import { MigrationsRequired, SetupRequired } from "@/components/states";
import {
  ArchiveClientForm,
  CommunicationForm,
  ContactForm,
  DeleteCommunicationForm,
  DeleteContactForm,
  DeleteFileForm,
  DeleteNoteForm,
  EditClientForm,
  NoteForm,
  RemoveServiceForm,
  ServiceForm,
  UploadFileForm,
} from "../client-forms";

type Client = {
  id: string;
  name: string;
  status: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  source: string | null;
  notes_summary: string | null;
};

function dateLabel(value: string | null | undefined, withTime = false): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" as const } : {}),
  }).format(new Date(value));
}

function fileSize(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 102.4) / 10} KB`;
  return `${Math.round(bytes / 104857.6) / 10} MB`;
}

function centsLabel(cents: number | null, currency = "USD"): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  const { id } = await params;
  const supabase = await createClient();

  const [clientResponse, contactsResponse, notesResponse, filesResponse, communicationsResponse, servicesResponse, catalogResponse, projectsResponse] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).maybeSingle(),
    supabase.from("contacts").select("id, name, role, email, phone, is_primary, created_at").eq("client_id", id).order("is_primary", { ascending: false }).order("name"),
    supabase.from("client_notes").select("id, body, pinned, created_at").eq("client_id", id).order("pinned", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("client_files").select("id, file_name, storage_path, mime_type, size_bytes, created_at").eq("client_id", id).order("created_at", { ascending: false }),
    supabase.from("communications").select("id, channel, direction, summary, occurred_at, contact_id, contacts(name)").eq("client_id", id).order("occurred_at", { ascending: false }),
    supabase.from("client_services").select("id, billing, monthly_amount_cents, started_on, service_id, services(name)").eq("client_id", id).order("created_at", { ascending: false }),
    supabase.from("services").select("id, name, default_billing").eq("active", true).order("name"),
    supabase.from("projects").select("id, name, status, deadline, progress, value_cents, currency").eq("client_id", id).is("deleted_at", null).order("deadline", { ascending: true, nullsFirst: false }),
  ]);

  const responses = [clientResponse, contactsResponse, notesResponse, filesResponse, communicationsResponse, servicesResponse, catalogResponse, projectsResponse];
  const missing = responses.find((response) => response.error && isMissingTable(response.error.message));
  if (missing) return <MigrationsRequired />;
  const failed = responses.find((response) => response.error);
  if (failed?.error) throw new Error(failed.error.message);
  if (!clientResponse.data) notFound();

  const client = clientResponse.data as Client;
  const contacts = (contactsResponse.data ?? []) as {
    id: string; name: string; role: string | null; email: string | null; phone: string | null; is_primary: boolean;
  }[];
  const notes = (notesResponse.data ?? []) as { id: string; body: string; pinned: boolean; created_at: string }[];
  const files = (filesResponse.data ?? []) as {
    id: string; file_name: string; storage_path: string; mime_type: string | null; size_bytes: number | null; created_at: string;
  }[];
  const fileLinks = await Promise.all(files.map(async (file) => {
    const signed = await supabase.storage.from("client-files").createSignedUrl(file.storage_path, 3600);
    return { ...file, downloadUrl: signed.data?.signedUrl ?? null };
  }));
  const communications = (communicationsResponse.data ?? []) as {
    id: string; channel: string; direction: string; summary: string; occurred_at: string; contact_id: string | null; contacts: { name: string } | { name: string }[] | null;
  }[];
  const assignedServices = (servicesResponse.data ?? []) as {
    id: string; billing: string; monthly_amount_cents: number | null; started_on: string | null; services: { name: string } | { name: string }[] | null;
  }[];
  const serviceCatalog = (catalogResponse.data ?? []) as { id: string; name: string; default_billing: string }[];
  const projects = (projectsResponse.data ?? []) as {
    id: string; name: string; status: string; deadline: string | null; progress: number; value_cents: number | null; currency: string;
  }[];

  return (
    <>
      <Link href="/clients" className="text-sm text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground">
        ← All clients
      </Link>
      <PageHeader
        title={client.name}
        description={[client.company, client.email].filter(Boolean).join(" · ") || "Client record"}
      />

      <div className="flex flex-wrap items-center gap-3 border-y border-border py-4">
        <span className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium uppercase tracking-widest">{client.status}</span>
        {client.phone ? <span className="text-sm text-muted-foreground">{client.phone}</span> : null}
        {client.website ? <a href={client.website} target="_blank" rel="noreferrer" className="text-sm underline decoration-border underline-offset-4">Website ↗</a> : null}
        {client.source ? <span className="text-sm text-muted-foreground">Source: {client.source}</span> : null}
      </div>

      <div className="mt-10 grid gap-12 lg:grid-cols-2">
        <FormSection title="Contacts" description="People associated with this client.">
          {contacts.length === 0 ? <p className="text-sm text-muted-foreground">No contacts yet.</p> : (
            <ul className="divide-y divide-border border-y border-border">
              {contacts.map((contact) => (
                <li key={contact.id} className="flex items-start justify-between gap-4 py-4">
                  <div>
                    <p className="font-medium">{contact.name} {contact.is_primary ? <span className="ml-1 text-xs text-muted-foreground">Primary</span> : null}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{[contact.role, contact.email, contact.phone].filter(Boolean).join(" · ") || "No additional details"}</p>
                  </div>
                  <DeleteContactForm clientId={id} id={contact.id} />
                </li>
              ))}
            </ul>
          )}
          <div className="mt-6"><ContactForm clientId={id} /></div>
        </FormSection>

        <FormSection title="Services" description="Services currently being provided to this client.">
          {assignedServices.length === 0 ? <p className="text-sm text-muted-foreground">No services assigned yet.</p> : (
            <ul className="divide-y divide-border border-y border-border">
              {assignedServices.map((assignment) => {
                const service = Array.isArray(assignment.services) ? assignment.services[0] : assignment.services;
                return <li key={assignment.id} className="flex items-start justify-between gap-4 py-4"><div><p className="font-medium">{service?.name ?? "Service"}</p><p className="mt-1 text-sm text-muted-foreground">{assignment.billing === "recurring" ? `Recurring · ${centsLabel(assignment.monthly_amount_cents)}/month` : "One-off"}{assignment.started_on ? ` · since ${dateLabel(assignment.started_on)}` : ""}</p></div><RemoveServiceForm clientId={id} id={assignment.id} /></li>;
              })}
            </ul>
          )}
          <div className="mt-6">
            <ServiceForm clientId={id} services={serviceCatalog} />
          </div>
        </FormSection>
      </div>

      <FormSection title="Projects" description="Projects associated with this client.">
        {projects.length === 0 ? <p className="text-sm text-muted-foreground">No projects yet. Create one from the Projects page.</p> : (
          <div className="overflow-x-auto border-y border-border"><table className="w-full min-w-[600px] text-left text-sm"><thead className="border-b border-border text-[11px] uppercase tracking-widest text-muted-foreground"><tr><th className="px-3 py-3 font-medium">Project</th><th className="px-3 py-3 font-medium">Status</th><th className="px-3 py-3 font-medium">Deadline</th><th className="px-3 py-3 font-medium">Progress</th><th className="px-3 py-3 font-medium">Value</th></tr></thead><tbody className="divide-y divide-border">{projects.map((project) => <tr key={project.id}><td className="px-3 py-4 font-medium"><Link href={`/projects/${project.id}`} className="underline decoration-border underline-offset-4">{project.name}</Link></td><td className="px-3 py-4 text-muted-foreground">{project.status}</td><td className="px-3 py-4 text-muted-foreground">{dateLabel(project.deadline)}</td><td className="px-3 py-4 text-muted-foreground">{project.progress}%</td><td className="px-3 py-4 text-muted-foreground">{centsLabel(project.value_cents, project.currency)}</td></tr>)}</tbody></table></div>
        )}
      </FormSection>

      <div className="mt-10 grid gap-12 lg:grid-cols-2">
        <FormSection title="Notes" description="Persistent client context. Pin the notes you need to keep visible.">
          {notes.length === 0 ? <p className="text-sm text-muted-foreground">No notes yet.</p> : <ul className="divide-y divide-border border-y border-border">{notes.map((note) => <li key={note.id} className="py-4"><div className="flex items-start justify-between gap-4"><div><p className="whitespace-pre-wrap text-sm leading-6">{note.body}</p><p className="mt-2 text-xs text-muted-foreground">{note.pinned ? "Pinned · " : ""}{dateLabel(note.created_at, true)}</p></div><DeleteNoteForm clientId={id} id={note.id} /></div></li>)}</ul>}
          <div className="mt-6"><NoteForm clientId={id} /></div>
        </FormSection>

        <FormSection title="Communication history" description="Manual log of calls, emails, meetings, and messages.">
          {communications.length === 0 ? <p className="text-sm text-muted-foreground">No activity logged yet.</p> : <ul className="divide-y divide-border border-y border-border">{communications.map((entry) => { const contact = Array.isArray(entry.contacts) ? entry.contacts[0] : entry.contacts; return <li key={entry.id} className="py-4"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium">{entry.channel} · {entry.direction === "in" ? "Incoming" : "Outgoing"}{contact?.name ? ` · ${contact.name}` : ""}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{entry.summary}</p><p className="mt-2 text-xs text-faint-foreground">{dateLabel(entry.occurred_at, true)}</p></div><DeleteCommunicationForm clientId={id} id={entry.id} /></div></li>; })}</ul>}
          <div className="mt-6"><CommunicationForm clientId={id} contacts={contacts.map(({ id: contactId, name }) => ({ id: contactId, name }))} /></div>
        </FormSection>
      </div>

      <FormSection title="Files" description="Private files stored in the Supabase Storage client-files bucket. Download links expire after one hour.">
        {fileLinks.length === 0 ? <p className="text-sm text-muted-foreground">No files uploaded yet.</p> : <ul className="divide-y divide-border border-y border-border">{fileLinks.map((file) => <li key={file.id} className="flex flex-wrap items-center justify-between gap-4 py-4"><div><p className="font-medium">{file.downloadUrl ? <a href={file.downloadUrl} target="_blank" rel="noreferrer" className="underline decoration-border underline-offset-4">{file.file_name} ↗</a> : file.file_name}</p><p className="mt-1 text-xs text-muted-foreground">{fileSize(file.size_bytes)} · {dateLabel(file.created_at, true)}</p></div><DeleteFileForm clientId={id} id={file.id} storagePath={file.storage_path} /></li>)}</ul>}
        <div className="mt-6"><UploadFileForm clientId={id} /></div>
      </FormSection>

      <FormSection title="Record settings" description="Update the client record or archive it when the relationship is no longer active.">
        <EditClientForm client={client} />
        <div className="mt-10 border-t border-border pt-6"><h3 className="text-sm font-medium">Archive</h3><p className="mt-2 text-sm text-muted-foreground">Archiving removes this client from active lists while preserving its history.</p><ArchiveClientForm clientId={id} /></div>
      </FormSection>
    </>
  );
}
