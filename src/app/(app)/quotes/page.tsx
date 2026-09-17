import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Quotes" };

export default function QuotesPage() {
  return (
    <>
      <PageHeader
        title="Quotes"
        description="Quotes and proposals with line items, discounts, recurring services, taxes, secure public links, and accept/reject tracking."
      />
      <EmptyState tag="Phase 5 — Planned" title="Quotes arrive in Phase 5">
        <p>
          You will create quotes, send a secure public link to the customer, and
          track viewed / accepted / rejected dates — then convert accepted quotes
          into projects. The quote schema is designed in docs/DATABASE_PLAN.md §6.
        </p>
      </EmptyState>
    </>
  );
}
