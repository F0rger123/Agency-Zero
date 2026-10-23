"use client";

import { useActionState, useCallback, useState } from "react";
import type { ReactNode } from "react";
import type { ActionState } from "@/lib/forms";
import {
  createQuoteAction,
  updateQuoteAction,
  convertQuoteAction,
  markQuoteSentAction,
  regenerateQuoteTokenAction,
  reopenQuoteAction,
  respondToQuoteAction,
} from "./actions";
import { FieldLabel, FormMessage, SelectInput, SubmitButton, TextArea, TextInput } from "@/components/form-controls";
import { Wizard } from "@/components/wizard";
import { Modal, ModalContext } from "@/components/modal";
import { moneyNode } from "@/components/money-node";
import { lineTotalCents, localDateIso, quoteTotals, suggestQuoteNumber } from "@/lib/quote-math";

const initialState: ActionState = {};
type Option = { id: string; label: string };
type ServiceOption = {
  id: string;
  name: string;
  default_billing: string;
  default_price_cents: number | null;
  billing_interval: string;
};
type Line = {
  service_id: string;
  description: string;
  details: string;
  qty: number;
  unit_amount: number;
  is_recurring: boolean;
  billing_period: string;
  selection: string;
  option_group: string;
};
type Quote = {
  id: string;
  /** "quote" or "estimate" (migration 0027); absent on a database that is behind. */
  kind?: string;
  client_id: string;
  number: string;
  title: string;
  notes: string | null;
  status: string;
  issued_on: string;
  valid_until: string | null;
  currency: string;
  tax_rate: number;
  discount_cents: number;
  line_items: Line[];
};

const blankLine = (): Line => ({
  service_id: "",
  description: "",
  details: "",
  qty: 1,
  unit_amount: 0,
  is_recurring: false,
  billing_period: "month",
  selection: "fixed",
  option_group: "",
});

function Shell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-t border-border pt-6">
      <h2 className="text-sm font-medium">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

/**
 * Line items support three inclusion modes (migration 0008):
 *  - fixed: always part of the proposal
 *  - optional: an add-on the customer toggles on the public page
 *  - choice: one of several exclusive alternatives inside an option group
 *    (packages, e.g. "Package selection" = Basic / Standard / Premium)
 */
const periodForKey: Record<string, string> = {
  monthly: "month",
  quarterly: "quarter",
  yearly: "year",
};

const plain =
  "block w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-faint-foreground focus:border-foreground";

/** Number input with a visible "$" so it is obvious the field is dollars. */
function DollarInput({ id, value, onChange, label }: { id: string; value: number; onChange: (value: number) => void; label: string }) {
  return (
    <div>
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="relative mt-1">
        <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          step={0.01}
          value={Number.isFinite(value) ? value : ""}
          onChange={(event) => onChange(event.target.value === "" ? 0 : Number(event.target.value))}
          className={`${plain} pl-7`}
        />
      </div>
    </div>
  );
}

function LineItemsEditor({
  initial = [],
  services = [],
  onChange,
}: {
  initial?: Line[];
  services?: ServiceOption[];
  onChange?: (lines: Line[]) => void;
}) {
  const [lines, setLines] = useState<Line[]>(initial.length ? initial : [blankLine()]);
  const commit = (next: Line[]) => {
    setLines(next);
    onChange?.(next);
  };
  const update = (index: number, patch: Partial<Line>) =>
    commit(lines.map((line, i) => (i === index ? { ...line, ...patch } : line)));

  /**
   * Picking a catalogue service prefills the line from its defaults: price,
   * one-off vs recurring, and the billing interval. Everything stays editable.
   */
  const applyService = (index: number, serviceId: string) => {
    const service = services.find((item) => item.id === serviceId);
    if (!service) {
      update(index, { service_id: "" });
      return;
    }
    const recurring = service.default_billing === "recurring";
    update(index, {
      service_id: service.id,
      description: lines[index]?.description ? lines[index].description : service.name,
      unit_amount:
        service.default_price_cents != null ? service.default_price_cents / 100 : lines[index]?.unit_amount ?? 0,
      is_recurring: recurring,
      billing_period: recurring
        ? periodForKey[service.billing_interval] ?? "month"
        : (lines[index]?.billing_period ?? "month"),
    });
  };

  const totals = quoteTotals(lines, 0, 0);

  return (
    <div>
      <input type="hidden" name="line_items" value={JSON.stringify(lines)} readOnly />
      <div className="space-y-4">
        {lines.map((line, index) => (
          <div key={index} className="space-y-4 rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Item {index + 1}</p>
              {lines.length > 1 ? (
                <button
                  type="button"
                  onClick={() => commit(lines.filter((_, i) => i !== index))}
                  className="text-xs text-red-600 underline-offset-4 hover:underline"
                >
                  Remove
                </button>
              ) : null}
            </div>
            {services.length > 0 ? (
              <div>
                <label htmlFor={`quote-service-${index}`} className="text-xs font-medium text-muted-foreground">
                  Start from a saved service (optional)
                </label>
                <select
                  id={`quote-service-${index}`}
                  value={line.service_id}
                  onChange={(event) => applyService(index, event.target.value)}
                  className={`${plain} mt-1`}
                >
                  <option value="">Type my own</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                      {service.default_price_cents != null ? ` · $${(service.default_price_cents / 100).toFixed(2)}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <div>
              <label htmlFor={`quote-line-${index}`} className="text-xs font-medium text-muted-foreground">What is it?</label>
              <input
                id={`quote-line-${index}`}
                value={line.description}
                onChange={(event) => update(index, { description: event.target.value })}
                placeholder="Website build"
                required
                className={`${plain} mt-1`}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={`quote-qty-${index}`} className="text-xs font-medium text-muted-foreground">How many?</label>
                <input
                  id={`quote-qty-${index}`}
                  type="number"
                  inputMode="decimal"
                  min={0.01}
                  step={0.01}
                  value={Number.isFinite(line.qty) ? line.qty : ""}
                  onChange={(event) => update(index, { qty: Number(event.target.value) })}
                  className={`${plain} mt-1`}
                />
              </div>
              <DollarInput
                id={`quote-price-${index}`}
                label="Price each"
                value={line.unit_amount}
                onChange={(value) => update(index, { unit_amount: value })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={line.is_recurring}
                onChange={(event) => update(index, { is_recurring: event.target.checked })}
                className="size-4 accent-black"
              />
              This repeats (a subscription)
              {line.is_recurring ? (
                <select
                  aria-label="How often it is billed"
                  value={line.billing_period}
                  onChange={(event) => update(index, { billing_period: event.target.value })}
                  className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                >
                  <option value="month">every month</option>
                  <option value="quarter">every quarter</option>
                  <option value="year">every year</option>
                </select>
              ) : null}
            </label>
            <div className="flex items-baseline justify-between border-t border-border pt-3">
              <span className="text-sm text-muted-foreground">
                {line.qty} × ${Number.isFinite(line.unit_amount) ? line.unit_amount.toFixed(2) : "0.00"}
              </span>
              <span className="text-base font-semibold">
                {moneyNode(lineTotalCents(line))}
                {line.is_recurring ? <span className="ml-1 text-xs font-normal text-muted-foreground">/ {line.billing_period}</span> : null}
              </span>
            </div>
            <details>
              <summary className="cursor-pointer text-xs text-muted-foreground">More options</summary>
              <div className="mt-3 space-y-3">
                <div>
                  <label htmlFor={`quote-selection-${index}`} className="text-xs font-medium text-muted-foreground">
                    Is it required?
                  </label>
                  <select
                    id={`quote-selection-${index}`}
                    value={line.selection}
                    onChange={(event) => update(index, { selection: event.target.value })}
                    className={`${plain} mt-1`}
                  >
                    <option value="fixed">Included — always part of the quote</option>
                    <option value="optional">Optional add-on — the customer ticks it</option>
                    <option value="choice">Package choice — the customer picks one</option>
                  </select>
                </div>
                {line.selection === "choice" ? (
                  <div>
                    <label htmlFor={`quote-group-${index}`} className="text-xs font-medium text-muted-foreground">
                      Which group of packages? (same name = pick one)
                    </label>
                    <input
                      id={`quote-group-${index}`}
                      value={line.option_group}
                      onChange={(event) => update(index, { option_group: event.target.value })}
                      placeholder="Package"
                      className={`${plain} mt-1`}
                    />
                  </div>
                ) : null}
                <div>
                  <label htmlFor={`quote-details-${index}`} className="text-xs font-medium text-muted-foreground">
                    Extra details shown under this item (optional)
                  </label>
                  <input
                    id={`quote-details-${index}`}
                    value={line.details}
                    onChange={(event) => update(index, { details: event.target.value })}
                    className={`${plain} mt-1`}
                  />
                </div>
              </div>
            </details>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => commit([...lines, blankLine()])}
        className="press mt-4 rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
      >
        + Add another item
      </button>
      <div className="mt-5 flex items-baseline justify-between rounded-xl bg-muted px-4 py-3">
        <span className="text-sm text-muted-foreground">Items so far</span>
        <span className="text-lg font-semibold">{moneyNode(totals.subtotal)}</span>
      </div>
    </div>
  );
}

function Fields({
  clients,
  services,
  quote,
  lockedClientId,
}: {
  lockedClientId?: string;
  clients: Option[];
  services: ServiceOption[];
  quote?: Quote;
}) {
  return (
    <div className="space-y-5">
      {/* The reference number is internal (unique in the database); it is kept, never typed or shown. */}
      <input type="hidden" name="number" value={quote?.number ?? suggestQuoteNumber("quote")} />
      <input type="hidden" name="status" value={quote?.status ?? "draft"} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel label="Name" htmlFor="quote-title" required />
          <TextInput id="quote-title" name="title" required defaultValue={quote?.title} placeholder="Website proposal" />
        </div>
        <div>
          <FieldLabel label="Type" htmlFor="quote-kind" hint="same link and accept flow; only the wording differs" />
          <SelectInput id="quote-kind" name="kind" defaultValue={quote?.kind ?? "quote"}>
            <option value="quote">Quote / proposal</option>
            <option value="estimate">Estimate</option>
          </SelectInput>
        </div>
        <div>
          <FieldLabel label="Client" htmlFor="quote-client" required />
          {lockedClientId ? (
            <>
              <input type="hidden" name="client_id" value={lockedClientId} />
              <p className="flex h-10 items-center text-sm">{clients.find((c) => c.id === lockedClientId)?.label ?? "This client"}</p>
            </>
          ) : (
            <SelectInput id="quote-client" name="client_id" required defaultValue={quote?.client_id}>
            <option value="">Choose a client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>{client.label}</option>
            ))}
          </SelectInput>
          )}
        </div>
        <div>
          <FieldLabel label="Issued on" htmlFor="quote-issued" required />
          <TextInput id="quote-issued" name="issued_on" type="date" required defaultValue={quote?.issued_on} />
        </div>
        <div>
          <FieldLabel label="Valid until" htmlFor="quote-valid" />
          <TextInput id="quote-valid" name="valid_until" type="date" defaultValue={quote?.valid_until} />
        </div>
        <div>
          <FieldLabel label="Currency" htmlFor="quote-currency" required />
          <TextInput id="quote-currency" name="currency" required defaultValue={quote?.currency ?? "USD"} />
        </div>
      </div>
      <LineItemsEditor initial={quote?.line_items} services={services} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel label="Discount" htmlFor="quote-discount" hint="currency units, capped at the accepted subtotal" />
          <TextInput id="quote-discount" name="discount_amount" type="number" min={0} step={0.01} defaultValue={quote ? quote.discount_cents / 100 : 0} />
        </div>
        <div>
          <FieldLabel label="Tax rate" htmlFor="quote-tax" hint="percent" />
          <TextInput id="quote-tax" name="tax_rate" type="number" min={0} max={100} step={0.01} defaultValue={quote?.tax_rate ?? 0} />
        </div>
      </div>
      <div>
        <FieldLabel label="Proposal notes" htmlFor="quote-notes" hint="shown to the customer" />
        <TextArea
          id="quote-notes"
          name="notes"
          rows={4}
          defaultValue={quote?.notes}
          placeholder="Intro, terms, or payment conditions shown on the public proposal page"
        />
      </div>
    </div>
  );
}

export function NewQuoteForm({
  clients,
  services = [],
  lockedClientId,
}: {
  lockedClientId?: string;
  clients: Option[];
  services?: ServiceOption[];
}) {
  const [state, action] = useActionState(createQuoteAction, initialState);
  const [initialLines] = useState<Line[]>(() => [blankLine()]);
  const [lines, setLines] = useState<Line[]>(initialLines);
  const [clientId, setClientId] = useState(lockedClientId ?? "");
  const [kind, setKind] = useState("quote");
  const [title, setTitle] = useState("");
  const [number, setNumber] = useState(() => suggestQuoteNumber("quote"));
  const [issued, setIssued] = useState(() => localDateIso(0));
  const [valid, setValid] = useState(() => localDateIso(30));
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const totals = quoteTotals(lines, discount, tax);
  const clientName = clients.find((client) => client.id === clientId)?.label ?? "";
  const word = kind === "estimate" ? "estimate" : "quote";

  return (
    <form action={action}>
      <input type="hidden" name="status" value="draft" />
      <input type="hidden" name="currency" value="USD" />
      <input type="hidden" name="client_id" value={clientId} />
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="title" value={title} />
      <input type="hidden" name="number" value={number} />
      <input type="hidden" name="issued_on" value={issued} />
      <input type="hidden" name="valid_until" value={valid} />
      <input type="hidden" name="discount_amount" value={discount} />
      <input type="hidden" name="tax_rate" value={tax} />
      <Wizard
        compact
        steps={[
          {
            title: "Who is it for?",
            hint: "Pick the client and what you are sending.",
            content: (
              <div className="space-y-4">
                {lockedClientId ? null : (
                  <div>
                    <label htmlFor="nq-client" className="text-xs font-medium text-muted-foreground">Client</label>
                    <select id="nq-client" required value={clientId} onChange={(event) => setClientId(event.target.value)} className={`${plain} mt-1`}>
                      <option value="">Choose a client</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>{client.label}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Type">
                  {[
                    ["quote", "Quote", "A proposal to accept"],
                    ["estimate", "Estimate", "A rough price"],
                  ].map(([value, label, hint]) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={kind === value}
                      onClick={() => {
                        setKind(value);
                        setNumber(suggestQuoteNumber(value));
                      }}
                      className={`press rounded-xl border p-4 text-left transition-colors ${kind === value ? "border-foreground bg-muted" : "border-border hover:bg-muted"}`}
                    >
                      <span className="block text-sm font-medium">{label}</span>
                      <span className="block text-xs text-muted-foreground">{hint}</span>
                    </button>
                  ))}
                </div>
                <div>
                  <label htmlFor="nq-title" className="text-xs font-medium text-muted-foreground">Name it (the customer sees this)</label>
                  <input id="nq-title" required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Website proposal" className={`${plain} mt-1`} />
                </div>
              </div>
            ),
          },
          {
            title: "Dates",
            hint: "Today is filled in for you. Change it only if you need to.",
            content: (
              <div className="space-y-4">
                <div>
                  <label htmlFor="nq-issued" className="text-xs font-medium text-muted-foreground">Issued on</label>
                  <input id="nq-issued" type="date" required value={issued} onChange={(event) => setIssued(event.target.value)} className={`${plain} mt-1`} />
                </div>
                <div>
                  <label htmlFor="nq-valid" className="text-xs font-medium text-muted-foreground">Good until (optional — 30 days is filled in)</label>
                  <input id="nq-valid" type="date" value={valid} onChange={(event) => setValid(event.target.value)} className={`${plain} mt-1`} />
                </div>
              </div>
            ),
          },
          {
            title: "What are you charging for?",
            hint: "One card per item. The dollar total of each item shows at the bottom of its card.",
            content: <LineItemsEditor initial={initialLines} services={services} onChange={setLines} />,
          },
          {
            title: "Discount, tax and a note",
            hint: "All optional. Skip with Next.",
            content: (
              <div className="space-y-4">
                <DollarInput id="nq-discount" label="Discount (dollars off)" value={discount} onChange={setDiscount} />
                <div>
                  <label htmlFor="nq-tax" className="text-xs font-medium text-muted-foreground">Sales tax (%)</label>
                  <input id="nq-tax" type="number" inputMode="decimal" min={0} max={100} step={0.01} value={tax} onChange={(event) => setTax(Number(event.target.value))} className={`${plain} mt-1`} />
                </div>
                <div>
                  <label htmlFor="nq-notes" className="text-xs font-medium text-muted-foreground">Message to the customer</label>
                  <textarea id="nq-notes" name="notes" rows={4} placeholder="Intro, terms, or payment conditions" className={`${plain} mt-1`} />
                </div>
              </div>
            ),
          },
          {
            title: "Check and create",
            hint: `This saves a draft ${word}. You send it from the ${word} page.`,
            content: (
              <div className="space-y-4 text-sm">
                <div className="rounded-xl border border-border p-4">
                  <p className="font-medium">{title || "Untitled"}</p>
                  <p className="mt-1 text-muted-foreground">
                    {[clientName || (lockedClientId ? "This client" : ""), `issued ${issued}`].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <ul className="divide-y divide-border rounded-xl border border-border">
                  {lines.map((line, index) => (
                    <li key={index} className="flex items-baseline justify-between gap-4 px-4 py-3">
                      <span>
                        {line.description || "Untitled item"}
                        <span className="block text-xs text-muted-foreground">
                          {line.qty} × ${line.unit_amount.toFixed(2)}
                          {line.is_recurring ? ` · every ${line.billing_period}` : ""}
                          {line.selection === "fixed" ? "" : line.selection === "optional" ? " · optional" : " · package choice"}
                        </span>
                      </span>
                      <span className="font-medium">{moneyNode(lineTotalCents(line))}</span>
                    </li>
                  ))}
                </ul>
                <dl className="space-y-1 rounded-xl bg-muted px-4 py-3">
                  <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{moneyNode(totals.subtotal)}</dd></div>
                  {totals.discountCents > 0 ? (
                    <div className="flex justify-between"><dt className="text-muted-foreground">Discount</dt><dd>−{moneyNode(totals.discountCents)}</dd></div>
                  ) : null}
                  {totals.taxCents > 0 ? (
                    <div className="flex justify-between"><dt className="text-muted-foreground">Tax</dt><dd>{moneyNode(totals.taxCents)}</dd></div>
                  ) : null}
                  <div className="flex justify-between border-t border-border pt-2 text-base font-semibold"><dt>Total</dt><dd>{moneyNode(totals.total)}</dd></div>
                  {totals.optional > 0 ? (
                    <p className="pt-1 text-xs text-muted-foreground">Plus {moneyNode(totals.optional)} of optional items the customer can add.</p>
                  ) : null}
                </dl>
              </div>
            ),
          },
        ]}
        finish={
          <div className="flex flex-wrap items-center gap-4">
            <SubmitButton>Create {word}</SubmitButton>
            <FormMessage {...state} />
          </div>
        }
      />
    </form>
  );
}

export function EditQuoteForm({
  clients,
  services = [],
  quote,
}: {
  clients: Option[];
  services?: ServiceOption[];
  quote: Quote;
}) {
  const [state, action] = useActionState(updateQuoteAction, initialState);
  return (
    <Shell title="Edit quote">
      <form action={action} className="space-y-5">
        <input type="hidden" name="id" value={quote.id} />
        <Fields clients={clients} services={services} quote={quote} />
        <div className="flex flex-wrap items-center gap-4">
          <SubmitButton>Save quote</SubmitButton>
          <FormMessage {...state} />
        </div>
      </form>
    </Shell>
  );
}

export function ConvertQuoteForm({ id }: { id: string }) {
  const [state, action] = useActionState(convertQuoteAction, initialState);
  return (
    <form action={action} className="flex flex-wrap items-center gap-4">
      <input type="hidden" name="id" value={id} />
      <SubmitButton>Convert to project</SubmitButton>
      <FormMessage {...state} />
    </form>
  );
}

export function RegenerateQuoteLinkForm({ id }: { id: string }) {
  const [state, action] = useActionState(regenerateQuoteTokenAction, initialState);
  return (
    <form action={action} className="mt-3 flex flex-wrap items-center gap-4">
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-xs font-medium text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground">
        Generate a new link (revokes the old one)
      </button>
      <FormMessage {...state} />
    </form>
  );
}

export function MarkSentForm({ id }: { id: string }) {
  const [state, action] = useActionState(markQuoteSentAction, initialState);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="id" value={id} />
      <SubmitButton pendingLabel="Saving…">Mark as sent</SubmitButton>
      <FormMessage {...state} />
    </form>
  );
}

export function ReopenQuoteForm({ id }: { id: string }) {
  const [state, action] = useActionState(reopenQuoteAction, initialState);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="id" value={id} />
      <SubmitButton pendingLabel="Saving…" className="bg-background text-foreground ring-1 ring-border">Move back to draft</SubmitButton>
      <FormMessage {...state} />
    </form>
  );
}

export type ChoosableLine = { id: string; description: string; amount_cents: number; selection: string; option_group: string | null };

/**
 * "Mark as accepted / declined" for when the customer answered outside the link. Asks first, lets you tick which
 * add-ons / packages they took, and records the answer exactly like the public page does (time, selection, totals).
 */
export function RespondQuoteDialog({
  id,
  decision,
  lines = [],
  currency = "USD",
  className = "",
}: {
  id: string;
  decision: "accepted" | "rejected";
  lines?: ChoosableLine[];
  currency?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const [state, formAction] = useActionState(respondToQuoteAction, initialState);
  const [picked, setPicked] = useState<string[]>([]);
  const accept = decision === "accepted";
  const choosable = accept ? lines.filter((line) => line.selection !== "fixed") : [];
  const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
  const toggle = (line: ChoosableLine) =>
    setPicked((current) => {
      if (current.includes(line.id)) return current.filter((value) => value !== line.id);
      const others =
        line.selection === "choice"
          ? current.filter((value) => lines.find((item) => item.id === value)?.option_group !== line.option_group)
          : current;
      return [...others, line.id];
    });
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`press rounded-md px-4 py-2 text-sm font-medium transition-opacity ${
          accept ? "bg-inverted text-inverted-foreground hover:opacity-80" : "border border-border hover:bg-muted"
        } ${className}`}
      >
        {accept ? "Mark accepted" : "Mark declined"}
      </button>
      <ModalContext.Provider value={{ close }}>
        <Modal open={open} onClose={close} title={accept ? "Mark this as accepted?" : "Mark this as declined?"}>
          <form action={formAction} className="space-y-5">
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="decision" value={decision} />
            {picked.map((value) => (
              <input key={value} type="hidden" name="selected" value={value} />
            ))}
            <p className="text-sm leading-6 text-muted-foreground">
              {accept
                ? "Use this when the customer said yes outside the link (call, text, in person). The time is recorded and the quote is locked, so it can no longer be edited or deleted."
                : "Use this when the customer said no. The time is recorded. You can move it back to draft later and edit it."}
            </p>
            {choosable.length > 0 ? (
              <fieldset>
                <legend className="text-sm font-medium">Which extras did they take?</legend>
                <ul className="mt-2 divide-y divide-border rounded-xl border border-border">
                  {choosable.map((line) => (
                    <li key={line.id}>
                      <label className="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm">
                        <input
                          type={line.selection === "choice" ? "radio" : "checkbox"}
                          checked={picked.includes(line.id)}
                          onChange={() => toggle(line)}
                          onClick={() => {
                            if (line.selection === "choice" && picked.includes(line.id)) toggle(line);
                          }}
                          className="size-4 accent-black"
                        />
                        <span className="grow">
                          {line.description}
                          <span className="block text-xs text-muted-foreground">
                            {line.selection === "choice" ? `Package choice${line.option_group ? ` · ${line.option_group}` : ""}` : "Optional add-on"}
                          </span>
                        </span>
                        <span>{money(line.amount_cents)}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </fieldset>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <SubmitButton pendingLabel="Saving…">{accept ? "Yes, mark accepted" : "Yes, mark declined"}</SubmitButton>
              <button type="button" onClick={close} className="press rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
                Cancel
              </button>
              <FormMessage {...state} />
            </div>
          </form>
        </Modal>
      </ModalContext.Provider>
    </>
  );
}
