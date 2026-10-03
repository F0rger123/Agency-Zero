"use client";

import { FormSection } from "@/components/form-controls";
import { ContactForm, DeleteContactForm } from "../client-forms";
import type { ClientWorkspaceData } from "../client-workspace-types";
import { Empty } from "../client-workspace-parts";

export function ContactsTab({ data }: { data: ClientWorkspaceData }) {
  return (
    <FormSection title="Contacts" description="People associated with this client.">
      {data.contacts.length === 0 ? (
        <Empty>No contacts yet.</Empty>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {data.contacts.map((contact) => (
            <li key={contact.id} className="flex items-start justify-between gap-4 py-4">
              <div>
                <p className="font-medium">
                  {contact.name}
                  {contact.is_primary ? <span className="ml-2 text-xs text-muted-foreground">Primary</span> : null}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {[contact.role, contact.email, contact.phone].filter(Boolean).join(" · ") || "No additional details"}
                </p>
              </div>
              <DeleteContactForm clientId={data.client.id} id={contact.id} />
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6">
        <ContactForm clientId={data.client.id} />
      </div>
    </FormSection>
  );
}
