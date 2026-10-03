"use client";

import { crmHref } from "@/lib/routes";
import Link from "next/link";
import { invoiceStatusLabel } from "@/lib/invoice-status";
import { FormSection } from "@/components/form-controls";
import { dateLabel, moneyLabel } from "@/lib/format";
import { NewInvoiceForm } from "../../invoices/invoice-forms";
import { clientFormOptions } from "../client-workspace-options";
import type { ClientWorkspaceData } from "../client-workspace-types";
import { Empty } from "../client-workspace-parts";

export function InvoicesTab({ data, currency }: { data: ClientWorkspaceData; currency: string }) {
  const options = clientFormOptions(data);
  return (
    <div className="space-y-12">
      <FormSection title="Invoices" description="Billing history with derived balances.">
        {data.invoices.length === 0 ? (
          <Empty>No invoices yet. Create the first one below.</Empty>
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
                      <Link href={crmHref(invoice.href)} className="underline decoration-border underline-offset-4">
                        {invoice.number}
                      </Link>
                      <span className="mt-1 block text-xs text-muted-foreground">{invoice.title}</span>
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
        <div className="mt-8">
          <NewInvoiceForm
            lockedClientId={data.client.id}
            clients={options.clients}
            projects={options.projects}
            quotes={options.quotes}
            contracts={options.contracts}
          />
        </div>
      </FormSection>
      <FormSection title="Payments" description="Manual payments recorded against this client's invoices.">
        {data.payments.length === 0 ? (
          <Empty>No payments recorded yet.</Empty>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {data.payments.map((payment) => (
              <li key={payment.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div>
                  <p className={payment.voided_at ? "font-medium line-through text-muted-foreground" : "font-medium"}>
                    {moneyLabel(payment.amount_cents)} · {payment.method.replaceAll("_", " ")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {payment.invoice_number} · {payment.kind}
                    {payment.reference ? ` · ${payment.reference}` : ""}
                    {payment.voided_at ? " · voided" : ""}
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">{dateLabel(payment.paid_on)}</span>
              </li>
            ))}
          </ul>
        )}
      </FormSection>
    </div>
  );
}
