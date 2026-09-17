import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <>
      <PageHeader
        title="Projects"
        description="Multiple projects per client, with milestones, deadlines, status, progress, value, and estimated vs actual hours."
      />
      <EmptyState tag="Phase 3 — Planned" title="Project management arrives in Phase 3">
        <p>
          The projects table (client link, status, value, minutes, deadline,
          progress) is already in the database with row-level security. The
          working interface — creating projects, tracking milestones, deadlines,
          and progress — arrives in Phase 3 (docs/BUILD_PROGRESS.md).
        </p>
      </EmptyState>
    </>
  );
}
