import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Contracts" };

export default function ContractsPage() {
  return (
    <>
      <PageHeader
        title="Contracts"
        description="Contracts linked to quotes and projects, with templates, version history, secure public links, and electronic signing."
      />
      <EmptyState tag="Phase 5 — Planned" title="Contracts arrive in Phase 5">
        <p>
          Customers will view and electronically sign through a secure link; the
          signed timestamp and signed document are stored with version history.
          The contract schema is designed in docs/DATABASE_PLAN.md §6.
        </p>
      </EmptyState>
    </>
  );
}
