"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/forms";
import { FieldLabel, FormMessage, SelectInput, SubmitButton, TextArea, TextInput } from "@/components/form-controls";
import { createCampaignAction, deleteCampaignAction, updateCampaignResultsAction } from "./actions";

const initialState: ActionState = {};

export const channelLabels: Record<string, string> = {
  meta_ads: "Meta ads",
  google_ads: "Google ads",
  seo: "SEO",
  email: "Email",
  other: "Other",
};
export const statusLabels: Record<string, string> = {
  planned: "Planned",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
};

type ClientOption = { id: string; label: string };

export function NewCampaignForm({ clients }: { clients: ClientOption[] }) {
  const [state, action] = useActionState(createCampaignAction, initialState);
  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel label="Campaign name" htmlFor="campaign-name" required />
          <TextInput id="campaign-name" name="name" required placeholder="Spring promotion" />
        </div>
        <div>
          <FieldLabel label="Client" htmlFor="campaign-client" required />
          <SelectInput id="campaign-client" name="client_id" required>
            <option value="">Choose a client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>{client.label}</option>
            ))}
          </SelectInput>
        </div>
        <div>
          <FieldLabel label="Channel" htmlFor="campaign-channel" required />
          <SelectInput id="campaign-channel" name="channel" required defaultValue="meta_ads">
            {Object.entries(channelLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </SelectInput>
        </div>
        <div>
          <FieldLabel label="Status" htmlFor="campaign-status" required />
          <SelectInput id="campaign-status" name="status" required defaultValue="planned">
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </SelectInput>
        </div>
        <div>
          <FieldLabel label="Budget" htmlFor="campaign-budget" hint="dollars, optional" />
          <TextInput id="campaign-budget" name="budget" type="number" min={0} step={0.01} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel label="Starts" htmlFor="campaign-start" />
            <TextInput id="campaign-start" name="starts_on" type="date" />
          </div>
          <div>
            <FieldLabel label="Ends" htmlFor="campaign-end" />
            <TextInput id="campaign-end" name="ends_on" type="date" />
          </div>
        </div>
      </div>
      <div>
        <FieldLabel label="Goal" htmlFor="campaign-objective" hint="optional" />
        <TextArea id="campaign-objective" name="objective" rows={2} placeholder="Book 20 callouts in the next month" />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton>Create campaign</SubmitButton>
        <FormMessage {...state} />
      </div>
    </form>
  );
}

export function CampaignResultsForm({
  id,
  status,
  spendCents,
  leads,
  note,
}: {
  id: string;
  status: string;
  spendCents: number;
  leads: number;
  note: string | null;
}) {
  const [state, action] = useActionState(updateCampaignResultsAction, initialState);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <FieldLabel label="Status" htmlFor={`status-${id}`} />
          <SelectInput id={`status-${id}`} name="status" defaultValue={status}>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </SelectInput>
        </div>
        <div>
          <FieldLabel label="Spend so far" htmlFor={`spend-${id}`} hint="dollars" />
          <TextInput id={`spend-${id}`} name="spend" type="number" min={0} step={0.01} defaultValue={spendCents / 100} />
        </div>
        <div>
          <FieldLabel label="Leads" htmlFor={`leads-${id}`} />
          <TextInput id={`leads-${id}`} name="leads_count" type="number" min={0} step={1} defaultValue={leads} />
        </div>
      </div>
      <div>
        <FieldLabel label="Results note" htmlFor={`note-${id}`} hint="what worked, what to change" />
        <TextArea id={`note-${id}`} name="results_note" rows={2} defaultValue={note} />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton pendingLabel="Saving…">Save results</SubmitButton>
        <FormMessage {...state} />
      </div>
    </form>
  );
}

export function DeleteCampaignForm({ id }: { id: string }) {
  const [state, action] = useActionState(deleteCampaignAction, initialState);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="id" value={id} />
      <SubmitButton pendingLabel="Removing…" className="bg-background text-xs">Remove campaign</SubmitButton>
      <FormMessage {...state} />
    </form>
  );
}
