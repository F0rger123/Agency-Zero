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
import { Wizard } from "@/components/wizard";
import { SERVICE_CATEGORIES, SERVICE_PRESETS } from "@/lib/service-presets";
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
  /** Present once migration 0030 is applied. */
  category?: string | null;
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
        <FieldLabel label="Category" htmlFor={`service-category-${service?.id ?? "new"}`} hint="groups the Services page" />
        <input
          id={`service-category-${service?.id ?? "new"}`}
          name="category"
          list="service-category-options"
          defaultValue={service?.category ?? ""}
          placeholder="Websites"
          maxLength={80}
          className="mt-2 block w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-faint-foreground focus:border-foreground"
        />
        <datalist id="service-category-options">
          {SERVICE_CATEGORIES.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>
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

const plain =
  "block w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-faint-foreground focus:border-foreground";
const INTERVALS = [
  ["monthly", "Monthly", "month"],
  ["quarterly", "Quarterly", "quarter"],
  ["yearly", "Yearly", "year"],
] as const;

function Choice({ selected, onClick, title, hint }: { selected: boolean; onClick: () => void; title: string; hint?: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`press rounded-xl border p-4 text-left transition-colors ${selected ? "border-foreground bg-muted" : "border-border hover:bg-muted"}`}
    >
      <span className="block text-sm font-medium">{title}</span>
      {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
    </button>
  );
}

/** Step-by-step: category and starting point → name → how it is charged → time → review. */
export function NewServiceForm() {
  const [state, action] = useActionState(createServiceAction, initialState);
  const [category, setCategory] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [billing, setBilling] = useState<"one_off" | "recurring">("one_off");
  const [billingInterval, setBillingInterval] = useState<(typeof INTERVALS)[number][0]>("monthly");
  const [price, setPrice] = useState("");
  const [hours, setHours] = useState("");
  const [active, setActive] = useState(true);
  const [preset, setPreset] = useState("");
  const presets = SERVICE_PRESETS.filter((item) => item.category === category);
  const per = INTERVALS.find((item) => item[0] === billingInterval)?.[2] ?? "month";
  const priceLabel = price ? `$${Number(price).toFixed(2)}` : "No default price";

  const applyPreset = (item: (typeof SERVICE_PRESETS)[number] | null) => {
    setPreset(item?.name ?? "");
    if (!item) return;
    setName(item.name);
    setDescription(item.description);
    setBilling(item.billing);
    setBillingInterval(item.interval);
  };

  return (
    <form action={action}>
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="description" value={description} />
      <input type="hidden" name="default_billing" value={billing} />
      <input type="hidden" name="billing_interval" value={billingInterval} />
      <input type="hidden" name="default_price" value={price} />
      <input type="hidden" name="default_estimated_hours" value={hours} />
      <input type="hidden" name="active" value={active ? "on" : "off"} />
      <Wizard
        compact
        steps={[
          {
            title: "What kind of service?",
            hint: "Pick a category, then a ready-made starting point or start blank. You can change everything next.",
            content: (
              <div className="space-y-5">
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Category">
                  {[...SERVICE_CATEGORIES, "Other"].map((item) => (
                    <button
                      key={item}
                      type="button"
                      role="radio"
                      aria-checked={category === item}
                      onClick={() => {
                        setCategory(item);
                        setPreset("");
                      }}
                      className={`press rounded-full border px-4 py-2 text-sm transition-colors ${category === item ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                {category ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {presets.map((item) => (
                      <Choice key={item.name} selected={preset === item.name} onClick={() => applyPreset(item)} title={item.name} hint={item.billing === "recurring" ? `Recurring · ${item.interval}` : "One-time"} />
                    ))}
                    <Choice selected={preset === ""} onClick={() => setPreset("")} title="Start blank" hint="Type your own" />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Choose a category above.</p>
                )}
              </div>
            ),
          },
          {
            title: "Name it",
            hint: "This is what you see in the catalogue and on quotes.",
            content: (
              <div className="space-y-4">
                <div>
                  <label htmlFor="ns-name" className="text-xs font-medium text-muted-foreground">Service name</label>
                  <input id="ns-name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="SEO retainer" className={`${plain} mt-1`} />
                </div>
                <div>
                  <label htmlFor="ns-description" className="text-xs font-medium text-muted-foreground">What does it include? (optional)</label>
                  <textarea id="ns-description" rows={4} value={description} onChange={(event) => setDescription(event.target.value)} className={`${plain} mt-1`} />
                </div>
              </div>
            ),
          },
          {
            title: "How do you charge for it?",
            hint: "This becomes the default on quotes and assignments. You can still change it per client.",
            content: (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Billing">
                  <Choice selected={billing === "one_off"} onClick={() => setBilling("one_off")} title="One-time" hint="Charged once" />
                  <Choice selected={billing === "recurring"} onClick={() => setBilling("recurring")} title="Recurring" hint="Charged again and again" />
                </div>
                {billing === "recurring" ? (
                  <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="How often">
                    {INTERVALS.map(([value, label]) => (
                      <Choice key={value} selected={billingInterval === value} onClick={() => setBillingInterval(value)} title={label} />
                    ))}
                  </div>
                ) : null}
                <div>
                  <label htmlFor="ns-price" className="text-xs font-medium text-muted-foreground">
                    Usual price {billing === "recurring" ? `(every ${per})` : "(charged once)"} — optional
                  </label>
                  <div className="relative mt-1">
                    <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                    <input id="ns-price" type="number" inputMode="decimal" min={0} step={0.01} value={price} onChange={(event) => setPrice(event.target.value)} className={`${plain} pl-7`} />
                  </div>
                </div>
              </div>
            ),
          },
          {
            title: "Time and availability",
            hint: "Both optional.",
            content: (
              <div className="space-y-4">
                <div>
                  <label htmlFor="ns-hours" className="text-xs font-medium text-muted-foreground">Usual time it takes (hours)</label>
                  <input id="ns-hours" type="number" inputMode="decimal" min={0} step={0.25} value={hours} onChange={(event) => setHours(event.target.value)} className={`${plain} mt-1`} />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} className="size-4 accent-black" />
                  Offer it right away (shows up when assigning and quoting)
                </label>
              </div>
            ),
          },
          {
            title: "Check and create",
            content: (
              <dl className="divide-y divide-border rounded-xl border border-border text-sm">
                {[
                  ["Category", category || "Other"],
                  ["Name", name || "—"],
                  ["Charged", billing === "recurring" ? `Recurring · every ${per}` : "One-time"],
                  ["Usual price", priceLabel],
                  ["Usual time", hours ? `${hours} h` : "—"],
                  ["Offered", active ? "Yes" : "Not yet"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 px-4 py-3">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="text-right font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            ),
          },
        ]}
        finish={
          <div className="flex flex-wrap items-center gap-4">
            <SubmitButton>Create service</SubmitButton>
            <FormMessage {...state} />
          </div>
        }
      />
    </form>
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
