import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Tasks" };

export default function TasksPage() {
  return (
    <>
      <PageHeader
        title="Tasks"
        description="Tasks and subtasks with priorities, due dates, time estimates, dependencies, recurrence, and waiting-on-client status."
      />
      <EmptyState tag="Phase 3 — Planned" title="Task management arrives in Phase 3">
        <p>
          The tasks table (subtasks, priorities, due dates, minutes, dependencies,
          recurrence, blocked/waiting-on-client status) is already in the database
          with row-level security. The working interface arrives in Phase 3
          (docs/BUILD_PROGRESS.md).
        </p>
      </EmptyState>
    </>
  );
}
