import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Invoices" };

export default function InvoicesPage() {
  return (
    <>
      <PageHeader
        title="Invoices"
        description="Invoices with deposits, partial payments, remaining balances, due dates, and paid / unpaid / overdue status. External payments are recorded manually; Stripe comes later."
      />
      <EmptyState tag="Phase 5 — Planned" title="Invoices arrive in Phase 5">
        <p>
          Manual-first by design (DECISIONS.md D-009): you record bank transfers,
          cash, and card payments by hand. Payment history per client and revenue
          tracking follow. Online payment via Stripe is a deferred integration —
          no payment buttons appear until it is real.
        </p>
      </EmptyState>
    </>
  );
}
