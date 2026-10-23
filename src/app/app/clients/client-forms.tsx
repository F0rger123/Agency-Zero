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
import { ConfirmDelete } from "@/components/confirm-delete";
import { Wizard } from "@/components/wizard";

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

const SOURCES = ["Referral", "Instagram", "Website form", "Cold outreach", "Google", "Other"] as const;
const STATUSES = [
  { value: "lead", label: "A lead", note: "Still talking" },
  { value: "active", label: "Active", note: "We are working together" },
  { value: "past", label: "Past", note: "Finished work with them" },
] as const;
const bigInput = "mt-2 block w-full rounded-lg border border-border bg-background px-4 py-4 text-lg outline-none transition-colors placeholder:text-faint-foreground focus:border-foreground";
const choice = (active: boolean) =>
  `press rounded-full border px-5 py-3 text-sm font-medium transition-colors ${active ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"}`;

/**
 * Adding a customer, one question at a time. Every answer is optional except the name, and the wizard
 * submits the same fields the old long form did, so nothing else about customers changes.
 */
export function NewClientForm() {
  const [state, action] = useActionState(createClientAction, initialState);
  const [name, setName] = useState("");
  const [source, setSource] = useState("");
  const [otherSource, setOtherSource] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]["value"]>("lead");
  const [website, setWebsite] = useState("");
  const first = name.trim().split(/\s+/)[0] || "them";
  const savedSource = source === "Other" ? otherSource.trim() : source;

  return (
    <form action={action} noValidate={false}>
      <input type="hidden" name="source" value={savedSource} />
      <input type="hidden" name="status" value={status} />
      <Wizard
        compact
        finish={
          <>
            <SubmitButton>Add {first === "them" ? "customer" : first}</SubmitButton>
            <FormMessage {...state} />
          </>
        }
        steps={[
          {
            title: "Name",
            hint: "Who are you adding? A person or a business name both work.",
            content: (
              <div>
                <label htmlFor="nc-name" className="text-sm font-medium">Their name</label>
                <input id="nc-name" name="name" required value={name} onChange={(event) => setName(event.target.value)} maxLength={160} autoComplete="off" placeholder="Jane Smith" className={bigInput} />
              </div>
            ),
          },
          {
            title: "Business",
            hint: `What is ${first}'s business called? Skip it if it is just a person.`,
            content: (
              <div>
                <label htmlFor="nc-company" className="text-sm font-medium">Business name</label>
                <input id="nc-company" name="company" maxLength={160} autoComplete="off" placeholder="Smith Plumbing" className={bigInput} />
              </div>
            ),
          },
          {
            title: "Contact",
            hint: `How can you reach ${first}? Add one or both.`,
            content: (
              <div className="space-y-4">
                <div>
                  <label htmlFor="nc-email" className="text-sm font-medium">Email</label>
                  <input id="nc-email" name="email" type="email" inputMode="email" autoCapitalize="none" maxLength={254} placeholder="jane@smithplumbing.com" className={bigInput} />
                </div>
                <div>
                  <label htmlFor="nc-phone" className="text-sm font-medium">Phone</label>
                  <input id="nc-phone" name="phone" type="tel" inputMode="tel" maxLength={40} placeholder="(555) 123-4567" className={bigInput} />
                </div>
              </div>
            ),
          },
          {
            title: "Website",
            hint: `Does ${first} have a website? Paste it, or skip.`,
            content: (
              <div>
                <label htmlFor="nc-website" className="text-sm font-medium">Website</label>
                <input
                  id="nc-website"
                  name="website"
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                  maxLength={300}
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                  onBlur={() => setWebsite((current) => (current.trim() && !/^https?:\/\//i.test(current.trim()) ? `https://${current.trim()}` : current.trim()))}
                  placeholder="smithplumbing.com"
                  className={bigInput}
                />
              </div>
            ),
          },
          {
            title: "Source",
            hint: `How did ${first} find you?`,
            content: (
              <div>
                <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="How they found you">
                  {SOURCES.map((option) => (
                    <button key={option} type="button" role="radio" aria-checked={source === option} onClick={() => setSource(source === option ? "" : option)} className={choice(source === option)}>
                      {option}
                    </button>
                  ))}
                </div>
                {source === "Other" ? (
                  <div className="mt-4">
                    <label htmlFor="nc-source" className="sr-only">Where from</label>
                    <input id="nc-source" value={otherSource} onChange={(event) => setOtherSource(event.target.value)} maxLength={120} placeholder="Where from?" className={bigInput} />
                  </div>
                ) : null}
              </div>
            ),
          },
          {
            title: "Stage",
            hint: `Where are you with ${first} right now?`,
            content: (
              <div className="space-y-3" role="radiogroup" aria-label="Customer stage">
                {STATUSES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={status === option.value}
                    onClick={() => setStatus(option.value)}
                    className={`press flex w-full items-center justify-between rounded-xl border-[1.5px] p-4 text-left transition-colors ${status === option.value ? "border-foreground bg-muted" : "border-border hover:bg-muted/60"}`}
                  >
                    <span>
                      <span className="block text-base font-medium">{option.label}</span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">{option.note}</span>
                    </span>
                    <span aria-hidden className={status === option.value ? "" : "opacity-0"}>✓</span>
                  </button>
                ))}
              </div>
            ),
          },
          {
            title: "Notes",
            hint: `Anything worth remembering about ${first}? Optional. You can add more any time.`,
            content: (
              <div>
                <label htmlFor="nc-notes" className="sr-only">Notes</label>
                <textarea id="nc-notes" name="notes_summary" rows={5} maxLength={2000} placeholder="What they need, who referred them, best time to call…" className={`${bigInput} resize-y text-base`} />
              </div>
            ),
          },
        ]}
      />
    </form>
  );
}

export function EditClientForm({ client }: { client: Client }) {
  const [state, action] = useActionState(updateClientAction, initialState);
  return (
    <FormShell title="Contact details">
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
 * Assign a catalogue service to a client, one step at a time. Choosing a service prefills the
 * billing type, interval, and amount from the catalogue defaults (migration 0010).
 * A one-time service has no interval: it asks for a price and, optionally, records the charge
 * (already paid, or billed with an invoice). Re-assigning the same service edits the existing
 * assignment (the action upserts on `client_id, service_id`).
 */
export function ServiceForm({
  clientId,
  services,
}: {
  clientId: string;
  services: CatalogService[];
  compact?: boolean;
}) {
  const [state, action] = useActionState(assignServiceAction, initialState);
  const [selected, setSelected] = useState("");
  const service = services.find((item) => item.id === selected);
  const [billingOverride, setBillingOverride] = useState<{ serviceId: string; value: string } | null>(null);
  const billing = billingOverride?.serviceId === selected ? billingOverride.value : (service?.default_billing ?? "one_off");
  const [charge, setCharge] = useState("none");
  const oneTime = billing !== "recurring";
  const defaultInterval = service?.billing_interval ?? "monthly";
  const defaultAmount = service?.default_price_cents != null ? service.default_price_cents / 100 : null;
  const key = service?.id ?? "none";

  return (
    <form action={action}>
      <input type="hidden" name="client_id" value={clientId} />
      <input type="hidden" name="billing" value={billing} />
      <Wizard
        finish={
          <>
            <SubmitButton>{oneTime ? "Add one-time service" : "Add recurring service"}</SubmitButton>
            <FormMessage {...state} />
          </>
        }
        steps={[
          {
            title: "Choose the service",
            hint: "Pick from your service catalogue.",
            content: (
              <div>
                <FieldLabel label="Service" htmlFor="client-service" required />
                <SelectInput id="client-service" name="service_id" required onChange={(event) => setSelected(event.target.value)}>
                  <option value="">Choose a service</option>
                  {services.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </SelectInput>
                {service?.default_estimated_minutes ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Usually about {Math.round((service.default_estimated_minutes / 60) * 10) / 10} h of work.
                  </p>
                ) : null}
              </div>
            ),
          },
          {
            title: "How it is billed",
            hint: "A one-time service is a single charge. A recurring one bills on a schedule and counts toward MRR.",
            content: (
              <div className="space-y-5">
                <div role="radiogroup" aria-label="Billing type" className="grid grid-cols-2 gap-3">
                  {[
                    { value: "one_off", label: "One-time", note: "A single charge" },
                    { value: "recurring", label: "Recurring", note: "Monthly, quarterly or yearly" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={billing === option.value}
                      onClick={() => setBillingOverride({ serviceId: selected, value: option.value })}
                      className={`press rounded-lg border p-4 text-left transition-colors ${
                        billing === option.value ? "border-foreground bg-muted" : "border-border hover:bg-muted/60"
                      }`}
                    >
                      <span className="block text-sm font-medium">{option.label}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">{option.note}</span>
                    </button>
                  ))}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {oneTime ? null : (
                    <div key={`interval-${key}`}>
                      <FieldLabel label="Billing interval" htmlFor="client-interval" />
                      <SelectInput id="client-interval" name="billing_interval" defaultValue={defaultInterval}>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </SelectInput>
                    </div>
                  )}
                  <div key={`amount-${key}-${billing}`}>
                    <FieldLabel
                      label={oneTime ? "Price" : "Amount per interval"}
                      htmlFor="client-amount"
                      hint={oneTime ? "dollars, charged once" : "dollars"}
                      required={oneTime && charge !== "none"}
                    />
                    <TextInput id="client-amount" name="amount" type="number" min={0} step={0.01} defaultValue={defaultAmount} />
                  </div>
                  <div>
                    <FieldLabel label={oneTime ? "Date" : "Started on"} htmlFor="client-started-on" hint="optional" />
                    <TextInput id="client-started-on" name="started_on" type="date" />
                  </div>
                </div>
              </div>
            ),
          },
          {
            title: oneTime ? "The charge" : "Review",
            hint: oneTime
              ? "Decide what happens to the money now. You can always do it later from Invoices & payments."
              : "Recurring services add to this client's monthly recurring revenue as soon as you save.",
            content: oneTime ? (
              <div className="space-y-4">
                <input type="hidden" name="charge" value={charge} />
                {[
                  { value: "none", label: "Just log the service", note: "No money recorded yet" },
                  { value: "paid", label: "They already paid", note: "Records a payment toward revenue" },
                  { value: "invoice", label: "Send them an invoice", note: "Creates an invoice for the price" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={charge === option.value}
                    onClick={() => setCharge(option.value)}
                    className={`press block w-full rounded-lg border p-4 text-left transition-colors ${
                      charge === option.value ? "border-foreground bg-muted" : "border-border hover:bg-muted/60"
                    }`}
                  >
                    <span className="block text-sm font-medium">{option.label}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{option.note}</span>
                  </button>
                ))}
                {charge === "paid" ? (
                  <div>
                    <FieldLabel label="Payment method" htmlFor="client-service-method" />
                    <SelectInput id="client-service-method" name="method" defaultValue="venmo">
                      <option value="bank_transfer">Bank transfer</option>
                      <option value="card">Card</option>
                      <option value="cash">Cash</option>
                      <option value="stripe">Stripe</option>
                      <option value="venmo">Venmo</option>
                      <option value="other">Other</option>
                    </SelectInput>
                  </div>
                ) : null}
                {charge !== "none" ? <p className="text-xs text-muted-foreground">Needs a price on the previous step.</p> : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Ready to add. Use Back to change anything.</p>
            ),
          },
        ]}
      />
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
  return (
    <ConfirmDelete
      action={action}
      fields={fields}
      label={label}
      title="Remove this?"
      message="It will be removed from this client. This cannot be undone."
      confirmLabel="Remove"
    />
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
