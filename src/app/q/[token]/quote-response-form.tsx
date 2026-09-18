"use client";

import { useActionState, useMemo, useState } from "react";
import type { ActionState } from "@/lib/forms";
import { FieldLabel, FormMessage, SubmitButton, TextInput } from "@/components/form-controls";
import { respondToQuoteAction } from "./actions";

const initialState: ActionState = {};

export type PublicLine = {
  id: string;
  sort_order: number;
  description: string;
  details: string | null;
  qty: number;
  unit_amount_cents: number;
  is_recurring: boolean;
  billing_period: string | null;
  amount_cents: number;
  option_group: string | null;
  selection: string;
};

const periodLabels: Record<string, string> = { month: "month", quarter: "quarter", year: "year" };

function makeMoney(currency: string) {
  return (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

/**
 * The customer-facing proposal document. Fixed items are always included;
 * optional add-ons are checkboxes; package choices with the same option
 * group are mutually exclusive radios. Totals recompute live exactly as the
 * server does on acceptance (migration 0008).
 */
export function QuoteDocument({
  token,
  status,
  currency,
  discountCents,
  taxRate,
  lines,
  acceptedAt,
  rejectedAt,
  respondedBy,
  selectedItemIds,
  acceptedSubtotalCents,
  acceptedTotalCents,
}: {
  token: string;
  status: string;
  currency: string;
  discountCents: number;
  taxRate: number;
  lines: PublicLine[];
  acceptedAt: string | null;
  rejectedAt: string | null;
  respondedBy: string | null;
  selectedItemIds: string[];
  acceptedSubtotalCents: number | null;
  acceptedTotalCents: number | null;
}) {
  const [state, action] = useActionState(respondToQuoteAction, initialState);
  const money = useMemo(() => makeMoney(currency), [currency]);
  const canRespond = status === "sent" || status === "viewed";
  const frozen = status === "accepted" || status === "rejected";

  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(selectedItemIds.map((id) => [id, true]))
  );
  const [choice, setChoice] = useState<Record<string, string | null>>(() => {
    const initial: Record<string, string | null> = {};
    for (const line of lines) {
      if (line.selection !== "choice" || !line.option_group) continue;
      if (!(line.option_group in initial)) initial[line.option_group] = null;
      if (selectedItemIds.includes(line.id)) initial[line.option_group] = line.id;
    }
    return initial;
  });

  const ordered = useMemo(() => [...lines].sort((a, b) => a.sort_order - b.sort_order), [lines]);
  const fixedLines = ordered.filter((line) => line.selection === "fixed");
  const optionalLines = ordered.filter((line) => line.selection === "optional");
  const choiceGroups = useMemo(() => {
    const groups = new Map<string, PublicLine[]>();
    for (const line of ordered) {
      if (line.selection !== "choice") continue;
      const key = line.option_group || "Package options";
      groups.set(key, [...(groups.get(key) ?? []), line]);
    }
    return [...groups.entries()];
  }, [ordered]);

  const isIncluded = (line: PublicLine) => {
    if (line.selection === "fixed") return true;
    if (line.selection === "optional") return checked[line.id] === true;
    return Boolean(line.option_group && choice[line.option_group] === line.id);
  };

  const included = ordered.filter(isIncluded);
  const subtotal = included.reduce((sum, line) => sum + line.amount_cents, 0);
  const discount = Math.min(discountCents, subtotal);
  const tax = Math.round((subtotal - discount) * (taxRate / 100));
  const total = subtotal - discount + tax;
  const recurringByPeriod = (() => {
    const byPeriod = new Map<string, number>();
    for (const line of included) {
      if (!line.is_recurring) continue;
      const period = periodLabels[line.billing_period ?? "month"] ?? "month";
      byPeriod.set(period, (byPeriod.get(period) ?? 0) + line.amount_cents);
    }
    return [...byPeriod.entries()];
  })();

  const selectedIds = included.filter((line) => line.selection !== "fixed").map((line) => line.id);

  const lineMeta = (line: PublicLine) =>
    `${line.qty} × ${money(line.unit_amount_cents)}${line.is_recurring ? ` · recurring per ${periodLabels[line.billing_period ?? "month"] ?? "month"}` : ""}`;

  return (
    <form action={action}>
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="selected_item_ids" value={JSON.stringify(selectedIds)} readOnly />

      <section aria-label="Included scope" className="mt-10">
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Scope of work</h2>
        <div className="mt-4 divide-y divide-border border-y border-border">
          {fixedLines.map((line) => (
            <div key={line.id} className="flex flex-wrap justify-between gap-4 py-5">
              <div>
                <p className="font-medium">{line.description}</p>
                {line.details ? <p className="mt-1 max-w-prose text-sm leading-6 text-muted-foreground">{line.details}</p> : null}
                <p className="mt-1 text-sm text-muted-foreground">{lineMeta(line)}</p>
              </div>
              <p className="font-medium">{money(line.amount_cents)}</p>
            </div>
          ))}
          {fixedLines.length === 0 ? (
            <p className="py-5 text-sm text-muted-foreground">This proposal is fully configurable below.</p>
          ) : null}
        </div>
      </section>

      {optionalLines.length > 0 ? (
        <section aria-label="Optional add-ons" className="mt-10">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Optional add-ons</h2>
          <p className="mt-2 text-sm text-muted-foreground">Tick the add-ons you want included in your accepted total.</p>
          <div className="mt-4 divide-y divide-border border-y border-border">
            {optionalLines.map((line) => (
              <label key={line.id} className={`flex flex-wrap items-start justify-between gap-4 py-5 ${frozen ? "" : "cursor-pointer"}`}>
                <span className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 accent-black"
                    checked={checked[line.id] === true}
                    disabled={frozen}
                    onChange={(event) => setChecked((current) => ({ ...current, [line.id]: event.target.checked }))}
                  />
                  <span>
                    <span className="font-medium">{line.description}</span>
                    {line.details ? <p className="mt-1 max-w-prose text-sm leading-6 text-muted-foreground">{line.details}</p> : null}
                    <span className="mt-1 block text-sm text-muted-foreground">{lineMeta(line)}</span>
                  </span>
                </span>
                <span className="font-medium">+ {money(line.amount_cents)}</span>
              </label>
            ))}
          </div>
        </section>
      ) : null}

      {choiceGroups.map(([group, groupLines]) => (
        <fieldset key={group} className="mt-10">
          <legend className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {group} — choose one
          </legend>
          <div className="mt-4 divide-y divide-border border-y border-border">
            {groupLines.map((line) => {
              const picked = choice[group] === line.id;
              return (
                <label key={line.id} className={`flex flex-wrap items-start justify-between gap-4 py-5 ${frozen ? "" : "cursor-pointer"}`}>
                  <span className="flex items-start gap-3">
                    <input
                      type="radio"
                      name={`ui-choice-${group}`}
                      className="mt-1 size-4 accent-black"
                      checked={picked}
                      disabled={frozen}
                      onChange={() => setChoice((current) => ({ ...current, [group]: line.id }))}
                      onClick={() => {
                        if (!frozen && picked) setChoice((current) => ({ ...current, [group]: null }));
                      }}
                    />
                    <span>
                      <span className="font-medium">{line.description}</span>
                      {line.details ? <p className="mt-1 max-w-prose text-sm leading-6 text-muted-foreground">{line.details}</p> : null}
                      <span className="mt-1 block text-sm text-muted-foreground">{lineMeta(line)}</span>
                    </span>
                  </span>
                  <span className="font-medium">{money(line.amount_cents)}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}

      <section aria-label="Totals" className="mt-10">
        {status === "accepted" && acceptedSubtotalCents != null && acceptedTotalCents != null ? (
          <dl className="ml-auto max-w-sm divide-y divide-border border-y border-border text-sm">
            <div className="flex justify-between py-3"><dt className="text-muted-foreground">Accepted subtotal</dt><dd>{money(acceptedSubtotalCents)}</dd></div>
            {discountCents > 0 ? (
              <div className="flex justify-between py-3"><dt className="text-muted-foreground">Discount</dt><dd>−{money(Math.min(discountCents, acceptedSubtotalCents))}</dd></div>
            ) : null}
            <div className="flex justify-between py-4 text-base font-semibold"><dt>Accepted total</dt><dd>{money(acceptedTotalCents)}</dd></div>
          </dl>
        ) : (
          <>
            <dl className="ml-auto max-w-sm divide-y divide-border border-y border-border text-sm">
              <div className="flex justify-between py-3"><dt className="text-muted-foreground">Subtotal</dt><dd>{money(subtotal)}</dd></div>
              {discount > 0 ? (
                <div className="flex justify-between py-3"><dt className="text-muted-foreground">Discount</dt><dd>−{money(discount)}</dd></div>
              ) : null}
              {tax > 0 ? (
                <div className="flex justify-between py-3"><dt className="text-muted-foreground">Tax ({taxRate}%)</dt><dd>{money(tax)}</dd></div>
              ) : null}
              <div className="flex justify-between py-4 text-base font-semibold"><dt>{canRespond ? "Your total" : "Total"}</dt><dd>{money(total)}</dd></div>
            </dl>
            {recurringByPeriod.length > 0 ? (
              <p className="mt-3 text-right text-sm text-muted-foreground">
                Recurring before discount and tax:{" "}
                {recurringByPeriod.map(([period, cents]) => `${money(cents)} / ${period}`).join(" · ")}
              </p>
            ) : null}
          </>
        )}
      </section>

      {canRespond ? (
        <section aria-label="Respond to this proposal" className="mt-12 border-t border-border pt-8">
          <div className="max-w-sm">
            <FieldLabel label="Your name" htmlFor="responded-by" hint="optional, recorded with your response" />
            <TextInput id="responded-by" name="responded_by" placeholder="Full name" />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button type="submit" name="decision" value="rejected" className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
              Reject quote
            </button>
            <SubmitButton pendingLabel="Accepting…">
              Accept quote{total > 0 ? ` · ${money(total)}` : ""}
            </SubmitButton>
            <FormMessage {...state} />
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            Accepting records your selection, the total above, and the time of your
            response, and freezes the quote for both sides.
          </p>
        </section>
      ) : (
        <p className="mt-12 border-t border-border pt-6 text-sm font-medium">
          This quote is {status}.
          {status === "accepted" && acceptedAt ? ` Accepted ${new Date(acceptedAt).toLocaleString()}` : ""}
          {status === "rejected" && rejectedAt ? ` Rejected ${new Date(rejectedAt).toLocaleString()}` : ""}
          {respondedBy ? ` · responded by ${respondedBy}` : ""}.
        </p>
      )}
    </form>
  );
}
