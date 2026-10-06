"use client";

import { useActionState, useState } from "react";
import type { ReactNode } from "react";
import type { ActionState } from "@/lib/forms";
import {
  FieldLabel,
  FormMessage,
  SelectInput,
  SubmitButton,
  TextArea,
  TextInput,
} from "@/components/form-controls";
import { ServiceForm } from "../clients/client-forms";
import {
  createServiceAction,
  setServiceActiveAction,
  updateServiceAction,
} from "./actions";

const initialState: ActionState = {};

export type ServiceRow = {
  id: string;
  name: string;
  description: string | null;
  default_billing: string;
  default_price_cents: number | null;
  billing_interval: string;
  default_estimated_minutes: number | null;
  active: boolean;
};

type ClientOption = { id: string; name: string };

function Shell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-t border-border pt-6">
      <h2 className="text-sm font-medium">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function ServiceFields({ service }: { service?: ServiceRow }) {
  const [billing, setBilling] = useState(service?.default_billing ?? "one_off");
  const oneTime = billing !== "recurring";
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel label="Name" htmlFor={`service-name-${service?.id ?? "new"}`} required />
        <TextInput
          id={`service-name-${service?.id ?? "new"}`}
          name="name"
          required
          defaultValue={service?.name}
          placeholder="SEO retainer"
        />
      </div>
      <div>
        <FieldLabel label="Description" htmlFor={`service-description-${service?.id ?? "new"}`} />
        <TextArea
          id={`service-description-${service?.id ?? "new"}`}
          name="description"
          rows={3}
          defaultValue={service?.description}
          placeholder="What this service includes"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel
            label="Billing type"
            htmlFor={`service-billing-${service?.id ?? "new"}`}
            required
          />
          <SelectInput
            id={`service-billing-${service?.id ?? "new"}`}
            name="default_billing"
            required
            value={billing}
            onChange={(event) => setBilling(event.target.value)}
          >
            <option value="one_off">One-time</option>
            <option value="recurring">Recurring</option>
          </SelectInput>
        </div>
        {oneTime ? null : (
        <div>
          <FieldLabel
            label="Billing interval"
            htmlFor={`service-interval-${service?.id ?? "new"}`}
          />
          <SelectInput
            id={`service-interval-${service?.id ?? "new"}`}
            name="billing_interval"
            defaultValue={service?.billing_interval ?? "monthly"}
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </SelectInput>
        </div>
        )}
        <div>
          <FieldLabel
            label="Default price"
            htmlFor={`service-price-${service?.id ?? "new"}`}
            hint={oneTime ? "dollars, charged once" : "dollars, per interval"}
          />
          <TextInput
            id={`service-price-${service?.id ?? "new"}`}
            name="default_price"
            type="number"
            min={0}
            step={0.01}
            defaultValue={service?.default_price_cents != null ? service.default_price_cents / 100 : null}
          />
        </div>
        <div>
          <FieldLabel
            label="Default estimated time"
            htmlFor={`service-hours-${service?.id ?? "new"}`}
            hint="hours"
          />
          <TextInput
            id={`service-hours-${service?.id ?? "new"}`}
            name="default_estimated_hours"
            type="number"
            min={0}
            step={0.25}
            defaultValue={
              service?.default_estimated_minutes != null
                ? service.default_estimated_minutes / 60
                : null
            }
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          name="active"
          value="on"
          defaultChecked={service ? service.active : true}
          className="size-4 accent-black"
        />
        Active (offered for new assignments and quote lines)
      </label>
    </div>
  );
}

export function NewServiceForm() {
  const [state, action] = useActionState(createServiceAction, initialState);
  return (
    <Shell title="Add a service">
      <form action={action} className="space-y-5">
        <ServiceFields />
        <div className="flex flex-wrap items-center gap-4">
          <SubmitButton>Create service</SubmitButton>
          <FormMessage {...state} />
        </div>
      </form>
    </Shell>
  );
}

export function EditServiceForm({ service }: { service: ServiceRow }) {
  const [state, action] = useActionState(updateServiceAction, initialState);
  return (
    <Shell title="Edit service">
      <form action={action} className="space-y-5">
        <input type="hidden" name="id" value={service.id} />
        <ServiceFields service={service} />
        <div className="flex flex-wrap items-center gap-4">
          <SubmitButton>Save service</SubmitButton>
          <FormMessage {...state} />
        </div>
      </form>
    </Shell>
  );
}

export function SetServiceActiveForm({
  serviceId,
  active,
}: {
  serviceId: string;
  active: boolean;
}) {
  const [state, action] = useActionState(setServiceActiveAction, initialState);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="id" value={serviceId} />
      <input type="hidden" name="active" value={active ? "false" : "true"} />
      <SubmitButton
        pendingLabel={active ? "Deactivating…" : "Reactivating…"}
        className="bg-background px-0 py-0 text-xs font-normal text-muted-foreground ring-0 hover:text-foreground"
      >
        {active ? "Deactivate" : "Reactivate"}
      </SubmitButton>
      <FormMessage {...state} />
    </form>
  );
}

/**
 * Assign a service to a client from the catalogue page. The same action powers
 * the client workspace, so both entry points stay in sync (and MRR is computed
 * with the same interval rule).
 */
export function AssignServiceForm({
  clients,
  services,
}: {
  clients: ClientOption[];
  services: ServiceRow[];
}) {
  const [clientId, setClientId] = useState("");
  if (clients.length === 0 || services.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {clients.length === 0 ? "Create a client first. Assignments are per client." : "No active services available."}
      </p>
    );
  }
  return (
    <div className="space-y-6">
      <div>
        <FieldLabel label="Client" htmlFor="assign-client" required />
        <SelectInput id="assign-client" name="client_picker" onChange={(event) => setClientId(event.target.value)}>
          <option value="">Choose a client</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </SelectInput>
      </div>
      {clientId ? (
        <ServiceForm key={clientId} clientId={clientId} services={services} />
      ) : (
        <p className="text-sm text-muted-foreground">Choose a client to continue.</p>
      )}
    </div>
  );
}
