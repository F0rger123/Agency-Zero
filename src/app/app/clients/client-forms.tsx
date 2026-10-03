"use client";

import { useActionState, useState } from "react";
import type { ReactNode } from "react";
import {
  assignServiceAction,
  archiveClientAction,
  createClientAction,
  createCommunicationAction,
  createContactAction,
  createNoteAction,
  deleteClientFileAction,
  deleteCommunicationAction,
  deleteContactAction,
  deleteNoteAction,
  removeServiceAction,
  updateClientAction,
  uploadClientFileAction,
} from "./actions";
import type { ActionState } from "@/lib/forms";
import {
  FieldLabel,
  FormMessage,
  SelectInput,
  SubmitButton,
  TextArea,
  TextInput,
} from "@/components/form-controls";

const initialState: ActionState = {};

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

function FormShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-t border-border pt-6">
      <h2 className="text-sm font-medium">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function TwoColumns({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function ClientFields({ client }: { client?: Client }) {
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel label="Name" htmlFor="name" required />
        <TextInput id="name" name="name" defaultValue={client?.name} required placeholder="Acme Studio" />
      </div>
      <TwoColumns>
        <div>
          <FieldLabel label="Company" htmlFor="company" />
          <TextInput id="company" name="company" defaultValue={client?.company} />
        </div>
        <div>
          <FieldLabel label="Status" htmlFor="status" required />
          <SelectInput id="status" name="status" defaultValue={client?.status ?? "lead"} required>
            <option value="lead">Lead</option>
            <option value="active">Active</option>
            <option value="past">Past</option>
            <option value="archived">Archived</option>
          </SelectInput>
        </div>
        <div>
          <FieldLabel label="Email" htmlFor="email" />
          <TextInput id="email" name="email" type="email" defaultValue={client?.email} />
        </div>
        <div>
          <FieldLabel label="Phone" htmlFor="phone" />
          <TextInput id="phone" name="phone" defaultValue={client?.phone} />
        </div>
        <div>
          <FieldLabel label="Website" htmlFor="website" />
          <TextInput id="website" name="website" type="url" defaultValue={client?.website} placeholder="https://" />
        </div>
        <div>
          <FieldLabel label="Source" htmlFor="source" hint="optional" />
          <TextInput id="source" name="source" defaultValue={client?.source} placeholder="Referral" />
        </div>
      </TwoColumns>
      <div>
        <FieldLabel label="Summary" htmlFor="notes_summary" hint="optional" />
        <TextArea id="notes_summary" name="notes_summary" defaultValue={client?.notes_summary} rows={3} />
      </div>
    </div>
  );
}

export function NewClientForm() {
  const [state, action] = useActionState(createClientAction, initialState);
  return (
    <FormShell title="Add client">
      <form action={action} className="space-y-5">
        <ClientFields />
        <div className="flex flex-wrap items-center gap-4">
          <SubmitButton>Create client</SubmitButton>
          <FormMessage {...state} />
        </div>
      </form>
    </FormShell>
  );
}

export function EditClientForm({ client }: { client: Client }) {
  const [state, action] = useActionState(updateClientAction, initialState);
  return (
    <FormShell title="Edit client">
      <form action={action} className="space-y-5">
        <input type="hidden" name="id" value={client.id} />
        <ClientFields client={client} />
        <div className="flex flex-wrap items-center gap-4">
          <SubmitButton>Save changes</SubmitButton>
          <FormMessage {...state} />
        </div>
      </form>
    </FormShell>
  );
}

export function ArchiveClientForm({ clientId }: { clientId: string }) {
  const [state, action] = useActionState(archiveClientAction, initialState);
  return (
    <form action={action} className="mt-4 flex flex-wrap items-center gap-4">
      <input type="hidden" name="id" value={clientId} />
      <SubmitButton pendingLabel="Archiving…" className="bg-background text-foreground ring-1 ring-border">
        Archive client
      </SubmitButton>
      <FormMessage {...state} />
    </form>
  );
}

export function ContactForm({ clientId }: { clientId: string }) {
  const [state, action] = useActionState(createContactAction, initialState);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="client_id" value={clientId} />
      <TwoColumns>
        <div>
          <FieldLabel label="Name" htmlFor="contact-name" required />
          <TextInput id="contact-name" name="name" required placeholder="Jane Smith" />
        </div>
        <div>
          <FieldLabel label="Role" htmlFor="contact-role" />
          <TextInput id="contact-role" name="role" placeholder="Marketing director" />
        </div>
        <div>
          <FieldLabel label="Email" htmlFor="contact-email" />
          <TextInput id="contact-email" name="email" type="email" />
        </div>
        <div>
          <FieldLabel label="Phone" htmlFor="contact-phone" />
          <TextInput id="contact-phone" name="phone" />
        </div>
      </TwoColumns>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input name="is_primary" type="checkbox" className="size-4 accent-black" /> Primary contact
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton>Add contact</SubmitButton>
        <FormMessage {...state} />
      </div>
    </form>
  );
}

export function NoteForm({ clientId }: { clientId: string }) {
  const [state, action] = useActionState(createNoteAction, initialState);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="client_id" value={clientId} />
      <div>
        <FieldLabel label="Note" htmlFor="note-body" required />
        <TextArea id="note-body" name="body" required placeholder="Important context about this client…" rows={4} />
      </div>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input name="pinned" type="checkbox" className="size-4 accent-black" /> Pin this note
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton>Add note</SubmitButton>
        <FormMessage {...state} />
      </div>
    </form>
  );
}

export function CommunicationForm({
  clientId,
  contacts,
}: {
  clientId: string;
  contacts: { id: string; name: string }[];
}) {
  const [state, action] = useActionState(createCommunicationAction, initialState);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="client_id" value={clientId} />
      <TwoColumns>
        <div>
          <FieldLabel label="Channel" htmlFor="communication-channel" required />
          <SelectInput id="communication-channel" name="channel" defaultValue="email" required>
            <option value="call">Call</option>
            <option value="email">Email</option>
            <option value="meeting">Meeting</option>
            <option value="message">Message</option>
            <option value="other">Other</option>
          </SelectInput>
        </div>
        <div>
          <FieldLabel label="Direction" htmlFor="communication-direction" required />
          <SelectInput id="communication-direction" name="direction" defaultValue="out" required>
            <option value="out">Outgoing</option>
            <option value="in">Incoming</option>
          </SelectInput>
        </div>
        <div>
          <FieldLabel label="Contact" htmlFor="communication-contact" hint="optional" />
          <SelectInput id="communication-contact" name="contact_id">
            <option value="">No contact selected</option>
            {contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name}</option>)}
          </SelectInput>
        </div>
        <div>
          <FieldLabel label="When" htmlFor="communication-when" hint="optional" />
          <TextInput id="communication-when" name="occurred_at" type="datetime-local" />
        </div>
      </TwoColumns>
      <div>
        <FieldLabel label="Summary" htmlFor="communication-summary" required />
        <TextArea id="communication-summary" name="summary" required placeholder="What was discussed?" rows={3} />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton>Log activity</SubmitButton>
        <FormMessage {...state} />
      </div>
    </form>
  );
}

export type CatalogService = {
  id: string;
  name: string;
  default_billing: string;
  default_price_cents?: number | null;
  billing_interval?: string;
  default_estimated_minutes?: number | null;
};

/**
 * Assign a catalogue service to a client. Choosing a service prefills the
 * billing type, interval, and amount from the catalogue defaults (migration
 * 0010), so the owner can accept the defaults or override them per client.
 * Re-assigning the same service edits the existing assignment (the action
 * upserts on `client_id, service_id`).
 */
export function ServiceForm({
  clientId,
  services,
  compact = false,
}: {
  clientId: string;
  services: CatalogService[];
  compact?: boolean;
}) {
  const [state, action] = useActionState(assignServiceAction, initialState);
  const [selected, setSelected] = useState("");
  const service = services.find((item) => item.id === selected);
  const defaultBilling = service?.default_billing ?? "one_off";
  const defaultInterval = service?.billing_interval ?? "monthly";
  const defaultAmount =
    service?.default_price_cents != null ? service.default_price_cents / 100 : "";
  const key = service?.id ?? "none";

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="client_id" value={clientId} />
      <div className={compact ? "space-y-4" : undefined}>
        <TwoColumns>
          <div className={compact ? "sm:col-span-2" : undefined}>
            <FieldLabel label="Service" htmlFor="client-service" required />
            <SelectInput
              id="client-service"
              name="service_id"
              required
              onChange={(event) => setSelected(event.target.value)}
            >
              <option value="">Choose a service</option>
              {services.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </SelectInput>
          </div>
          <div key={`billing-${key}`}>
            <FieldLabel label="Billing" htmlFor="client-billing" required />
            <SelectInput
              id="client-billing"
              name="billing"
              defaultValue={defaultBilling}
              required
            >
              <option value="one_off">One-off</option>
              <option value="recurring">Recurring</option>
            </SelectInput>
          </div>
          <div key={`interval-${key}`}>
            <FieldLabel label="Billing interval" htmlFor="client-interval" />
            <SelectInput
              id="client-interval"
              name="billing_interval"
              defaultValue={defaultInterval}
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </SelectInput>
          </div>
          <div key={`amount-${key}`}>
            <FieldLabel
              label="Amount per interval"
              htmlFor="client-amount"
              hint="currency units, recurring only"
            />
            <TextInput
              id="client-amount"
              name="amount"
              type="number"
              min={0}
              step={0.01}
              defaultValue={defaultAmount === "" ? null : defaultAmount}
            />
          </div>
          <div>
            <FieldLabel label="Started on" htmlFor="client-started-on" hint="optional" />
            <TextInput id="client-started-on" name="started_on" type="date" />
          </div>
        </TwoColumns>
        {service ? (
          <p className="text-xs text-muted-foreground">
            Catalogue defaults: {service.default_billing === "recurring" ? "recurring" : "one-off"}
            {service.default_estimated_minutes
              ? ` · ${Math.round((service.default_estimated_minutes / 60) * 10) / 10} h estimated`
              : ""}
            . Re-assigning an existing service updates it.
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton>Assign service</SubmitButton>
        <FormMessage {...state} />
      </div>
    </form>
  );
}

export function UploadFileForm({ clientId }: { clientId: string }) {
  const [state, action] = useActionState(uploadClientFileAction, initialState);
  return (
    <form action={action} encType="multipart/form-data" className="space-y-4">
      <input type="hidden" name="client_id" value={clientId} />
      <div>
        <FieldLabel label="File" htmlFor="client-file" hint="10 MB maximum" required />
        <input id="client-file" name="file" type="file" required className="mt-2 block w-full text-sm" />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton>Upload file</SubmitButton>
        <FormMessage {...state} />
      </div>
    </form>
  );
}

type Action = (previous: ActionState, formData: FormData) => Promise<ActionState>;

function DeleteActionForm({
  action,
  fields,
  label,
}: {
  action: Action;
  fields: Record<string, string>;
  label: string;
}) {
  const [state, formAction] = useActionState(action, initialState);
  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      {Object.entries(fields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
      <SubmitButton pendingLabel="Removing…" className="bg-background px-0 py-0 text-xs font-normal text-muted-foreground ring-0 hover:text-foreground">
        {label}
      </SubmitButton>
      <FormMessage {...state} />
    </form>
  );
}

export function DeleteContactForm({ clientId, id }: { clientId: string; id: string }) {
  return <DeleteActionForm action={deleteContactAction} fields={{ client_id: clientId, id }} label="Remove" />;
}

export function DeleteNoteForm({ clientId, id }: { clientId: string; id: string }) {
  return <DeleteActionForm action={deleteNoteAction} fields={{ client_id: clientId, id }} label="Remove" />;
}

export function DeleteCommunicationForm({ clientId, id }: { clientId: string; id: string }) {
  return <DeleteActionForm action={deleteCommunicationAction} fields={{ client_id: clientId, id }} label="Remove" />;
}

export function RemoveServiceForm({ clientId, id }: { clientId: string; id: string }) {
  return <DeleteActionForm action={removeServiceAction} fields={{ client_id: clientId, id }} label="Remove" />;
}

export function DeleteFileForm({ clientId, id, storagePath }: { clientId: string; id: string; storagePath: string }) {
  return <DeleteActionForm action={deleteClientFileAction} fields={{ client_id: clientId, id, storage_path: storagePath }} label="Remove" />;
}
