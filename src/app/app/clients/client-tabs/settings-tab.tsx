"use client";

import { FormSection } from "@/components/form-controls";
import { ArchiveClientForm, EditClientForm } from "../client-forms";
import type { ClientWorkspaceData } from "../client-workspace-types";

export function SettingsTab({ data }: { data: ClientWorkspaceData }) {
  return (
    <FormSection
      title="Profile"
      description="This is the client's own record: name, company, email, phone and website. Everything is already filled in from what you entered, so just change what you need."
    >
      <EditClientForm client={data.client} />
      <div className="mt-10 border-t border-border pt-6">
        <h3 className="text-sm font-medium">Archive</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Archiving removes this client from active lists while preserving its history.
        </p>
        <ArchiveClientForm clientId={data.client.id} />
      </div>
    </FormSection>
  );
}
