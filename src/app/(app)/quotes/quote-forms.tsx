"use client";

import { useActionState, useState } from "react";
import type { ReactNode } from "react";
import type { ActionState } from "@/lib/forms";
import { createQuoteAction, deleteQuoteAction, updateQuoteAction, convertQuoteAction, regenerateQuoteTokenAction } from "./actions";
import { FieldLabel, FormMessage, SelectInput, SubmitButton, TextArea, TextInput } from "@/components/form-controls";

const initialState: ActionState = {};
type Option = { id: string; label: string };
type Line = {
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
function LineItemsEditor({ initial = [] }: { initial?: Line[] }) {
  const [lines, setLines] = useState<Line[]>(initial.length ? initial : [blankLine()]);
  const update = (index: number, patch: Partial<Line>) =>
    setLines((current) => current.map((line, i) => (i === index ? { ...line, ...patch } : line)));

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <FieldLabel label="Line items" htmlFor="quote-line-0" required />
        <button
          type="button"
          onClick={() => setLines((current) => [...current, blankLine()])}
          className="text-xs font-medium underline decoration-border underline-offset-4"
        >
          Add line
        </button>
      </div>
      <input type="hidden" name="line_items" value={JSON.stringify(lines)} readOnly />
      <div className="mt-3 space-y-6">
        {lines.map((line, index) => (
          <div key={index} className="space-y-3 border-b border-border pb-6">
            <div className="grid gap-3 sm:grid-cols-[1fr_70px_90px_120px_auto]">
              <div>
                <label htmlFor={`quote-line-${index}`} className="sr-only">Description</label>
                <TextInput
                  id={`quote-line-${index}`}
                  name={`line_description_${index}`}
                  defaultValue={line.description}
                  onChange={(event) => update(index, { description: event.target.value })}
                  placeholder="Website build"
                />
              </div>
              <div>
                <label htmlFor={`quote-qty-${index}`} className="sr-only">Quantity</label>
                <TextInput
                  id={`quote-qty-${index}`}
                  name={`line_qty_${index}`}
                  type="number"
                  min={0.01}
                  step={0.01}
                  defaultValue={line.qty}
                  onChange={(event) => update(index, { qty: Number(event.target.value) })}
                />
              </div>
              <div>
                <label htmlFor={`quote-price-${index}`} className="sr-only">Unit price</label>
                <TextInput
                  id={`quote-price-${index}`}
                  name={`line_price_${index}`}
                  type="number"
                  min={0}
                  step={0.01}
                  defaultValue={line.unit_amount}
                  onChange={(event) => update(index, { unit_amount: Number(event.target.value) })}
                />
              </div>
              <div>
                <label htmlFor={`quote-selection-${index}`} className="sr-only">Inclusion</label>
                <SelectInput
                  id={`quote-selection-${index}`}
                  name={`line_selection_${index}`}
                  defaultValue={line.selection}
                  onChange={(event) => update(index, { selection: event.target.value })}
                >
                  <option value="fixed">Included</option>
                  <option value="optional">Optional add-on</option>
                  <option value="choice">Package choice</option>
                </SelectInput>
              </div>
              <div className="flex items-center justify-end gap-3">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={line.is_recurring}
                    onChange={(event) => update(index, { is_recurring: event.target.checked })}
                    className="size-4 accent-black"
                  />
                  Recurring
                </label>
                {lines.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setLines((current) => current.filter((_, i) => i !== index))}
                    className="text-xs text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_240px]">
              <div>
                <label htmlFor={`quote-details-${index}`} className="sr-only">Details</label>
                <TextInput
                  id={`quote-details-${index}`}
                  name={`line_details_${index}`}
                  defaultValue={line.details}
                  onChange={(event) => update(index, { details: event.target.value })}
                  placeholder="Details shown under this item on the proposal (optional)"
                />
              </div>
              <div className="flex items-start gap-3">
                {line.selection === "choice" ? (
                  <div className="grow">
                    <label htmlFor={`quote-group-${index}`} className="sr-only">Option group</label>
                    <TextInput
                      id={`quote-group-${index}`}
                      name={`line_group_${index}`}
                      defaultValue={line.option_group}
                      onChange={(event) => update(index, { option_group: event.target.value })}
                      placeholder="Option group, e.g. Package"
                    />
                  </div>
                ) : null}
                {line.is_recurring ? (
                  <div className="w-32">
                    <label htmlFor={`quote-period-${index}`} className="sr-only">Billing period</label>
                    <SelectInput
                      id={`quote-period-${index}`}
                      name={`line_period_${index}`}
                      defaultValue={line.billing_period}
                      required
                      onChange={(event) => update(index, { billing_period: event.target.value })}
                    >
                      <option value="month">Monthly</option>
                      <option value="quarter">Quarterly</option>
                      <option value="year">Yearly</option>
                    </SelectInput>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Included items are always part of the proposal. Optional add-ons are
        checkboxes for the customer. Package choices with the same option group
        are mutually exclusive — the customer picks at most one. Prices are
        stored as integer cents.
      </p>
    </div>
  );
}

function Fields({ clients, quote }: { clients: Option[]; quote?: Quote }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel label="Title" htmlFor="quote-title" required />
          <TextInput id="quote-title" name="title" required defaultValue={quote?.title} placeholder="Website proposal" />
        </div>
        <div>
          <FieldLabel label="Number" htmlFor="quote-number" required />
          <TextInput id="quote-number" name="number" required defaultValue={quote?.number} placeholder="Q-2026-001" />
        </div>
        <div>
          <FieldLabel label="Client" htmlFor="quote-client" required />
          <SelectInput id="quote-client" name="client_id" required defaultValue={quote?.client_id}>
            <option value="">Choose a client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>{client.label}</option>
            ))}
          </SelectInput>
        </div>
        <div>
          <FieldLabel label="Status" htmlFor="quote-status" required />
          <SelectInput id="quote-status" name="status" required defaultValue={quote?.status ?? "draft"}>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="viewed">Viewed</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </SelectInput>
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
      <LineItemsEditor initial={quote?.line_items} />
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

export function NewQuoteForm({ clients }: { clients: Option[] }) {
  const [state, action] = useActionState(createQuoteAction, initialState);
  return (
    <Shell title="Create quote">
      <form action={action} className="space-y-5">
        <Fields clients={clients} />
        <div className="flex flex-wrap items-center gap-4">
          <SubmitButton>Create quote</SubmitButton>
          <FormMessage {...state} />
        </div>
      </form>
    </Shell>
  );
}

export function EditQuoteForm({ clients, quote }: { clients: Option[]; quote: Quote }) {
  const [state, action] = useActionState(updateQuoteAction, initialState);
  return (
    <Shell title="Edit quote">
      <form action={action} className="space-y-5">
        <input type="hidden" name="id" value={quote.id} />
        <Fields clients={clients} quote={quote} />
        <div className="flex flex-wrap items-center gap-4">
          <SubmitButton>Save quote</SubmitButton>
          <FormMessage {...state} />
        </div>
      </form>
    </Shell>
  );
}

export function DeleteQuoteForm({ id }: { id: string }) {
  const [state, action] = useActionState(deleteQuoteAction, initialState);
  return (
    <form action={action} className="flex flex-wrap items-center gap-4">
      <input type="hidden" name="id" value={id} />
      <SubmitButton pendingLabel="Deleting…" className="bg-background px-0 py-0 text-sm font-normal text-muted-foreground ring-0 hover:text-foreground">Delete quote</SubmitButton>
      <FormMessage {...state} />
    </form>
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
