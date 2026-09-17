import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Clients" };

export default function ClientsPage() {
  return (
    <>
      <PageHeader
        title="Clients"
        description="Clients, contacts, notes, files, communication history, services, and status — the CRM core of Agency Zero."
      />
      <EmptyState tag="Phase 2 — Planned" title="Client records arrive in Phase 2">
        <p>
          The database schema (clients table with status, soft delete, and full
          row-level security) is already live. The working interface — adding and
          managing clients, contacts, notes, files, and communication history — is
          the next build phase (docs/BUILD_PROGRESS.md).
        </p>
      </EmptyState>
    </>
  );
}
