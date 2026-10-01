"use client";

import Link from "next/link";
import { invoiceStatusLabel } from "@/lib/invoice-status";
import { FormSection } from "@/components/form-controls";
import { dateLabel, moneyLabel } from "@/lib/format";
import type { ProjectWorkspaceData } from "../project-workspace-types";
import { Empty } from "../project-workspace-parts";

export function FinancialsTab({ data, currency }: { data: ProjectWorkspaceData; currency: string }) {
  return (
    <div className="space-y-12">
      <FormSection title="Project financials" description="Value, billing, and collection for this project only.">
        <div className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">
          <div className="bg-background p-5">
            <p className="text-xl font-semibold tracking-tight">{moneyLabel(data.project.value_cents, currency)}</p>
            <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">Value</p>
          </div>
          <div className="bg-background p-5">
            <p className="text-xl font-semibold tracking-tight">{moneyLabel(data.totals.invoiced_cents, currency)}</p>
            <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">Invoiced</p>
          </div>
          <div className="bg-background p-5">
            <p className="text-xl font-semibold tracking-tight">{moneyLabel(data.totals.paid_cents, currency)}</p>
            <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">Collected</p>
          </div>
          <div className="bg-background p-5">
            <p className="text-xl font-semibold tracking-tight">
              {moneyLabel(data.totals.outstanding_cents, currency)}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">Outstanding</p>
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Linked quotes"
        description="Quotes for this client. Linked means the quote converted into this project."
      >
        {data.quotes.length === 0 ? (
          <Empty>No quotes for this client.</Empty>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {data.quotes.map((quote) => (
              <li key={quote.id} className="flex flex-wrap items-center justify-between gap-4 py-3">
                <Link href={quote.href} className="text-sm font-medium underline decoration-border underline-offset-4">
                  {quote.number} · {quote.title}
                </Link>
                <span className="text-sm text-muted-foreground">
                  {quote.linked ? "linked · " : ""}
                  {quote.status} · {moneyLabel(quote.total_cents, quote.currency || currency)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </FormSection>

      <FormSection title="Linked contracts" description="Contracts tied to this project or to its converted quote.">
        {data.contracts.length === 0 ? (
          <Empty>No contracts linked to this project.</Empty>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {data.contracts.map((contract) => (
              <li key={contract.id} className="flex flex-wrap items-center justify-between gap-4 py-3">
                <Link
                  href={contract.href}
                  className="text-sm font-medium underline decoration-border underline-offset-4"
                >
                  {contract.title}
                </Link>
                <span className="text-sm text-muted-foreground">
                  {contract.linked ? "linked · " : ""}
                  {contract.status} · v{contract.version}
                  {contract.signed_at ? ` · signed ${dateLabel(contract.signed_at)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </FormSection>

      <FormSection
        title="Invoices & payments"
        description="Invoices raised against this project and the payments recorded on them."
      >
        {data.invoices.length === 0 ? (
          <Empty>No invoices yet for this project.</Empty>
        ) : (
          <div className="overflow-x-auto border-y border-border">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border text-[11px] uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-3 py-3 font-medium">Invoice</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Due</th>
                  <th className="px-3 py-3 font-medium">Total</th>
                  <th className="px-3 py-3 font-medium">Paid</th>
                  <th className="px-3 py-3 font-medium">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-3 py-4 font-medium">
                      <Link href={invoice.href} className="underline decoration-border underline-offset-4">
                        {invoice.number}
                      </Link>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {invoice.linked ? "linked · " : ""}
                        {invoice.title}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-muted-foreground">
                      {invoiceStatusLabel(invoice.status, invoice.due_on, invoice.balance_cents)}
                    </td>
                    <td className="px-3 py-4 text-muted-foreground">{dateLabel(invoice.due_on)}</td>
                    <td className="px-3 py-4 text-muted-foreground">
                      {moneyLabel(invoice.total_cents, invoice.currency || currency)}
                    </td>
                    <td className="px-3 py-4 text-muted-foreground">
                      {moneyLabel(invoice.paid_cents, invoice.currency || currency)}
                    </td>
                    <td className="px-3 py-4">{moneyLabel(invoice.balance_cents, invoice.currency || currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data.payments.length === 0 ? null : (
          <ul className="mt-6 divide-y divide-border border-y border-border">
            {data.payments.map((payment) => (
              <li key={payment.id} className="flex flex-wrap items-center justify-between gap-4 py-3">
                <span
                  className={
                    payment.voided_at ? "text-sm font-medium line-through text-muted-foreground" : "text-sm font-medium"
                  }
                >
                  {moneyLabel(payment.amount_cents)} · {payment.method.replaceAll("_", " ")}
                </span>
                <span className="text-sm text-muted-foreground">
                  {payment.invoice_number} · {payment.kind} · {dateLabel(payment.paid_on)}
                  {payment.voided_at ? " · voided" : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </FormSection>
    </div>
  );
}
