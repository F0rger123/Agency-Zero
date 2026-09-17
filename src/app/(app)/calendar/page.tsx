import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Calendar" };

export default function CalendarPage() {
  return (
    <>
      <PageHeader
        title="Calendar"
        description="Deadlines, tasks, milestones, meetings, and planned work blocks in one view. Google Calendar integration is planned but not built."
      />
      <EmptyState tag="Phase 4 — Planned" title="The calendar arrives in Phase 4">
        <p>
          Together with workload planning: available hours per day, overloaded-day
          warnings, and daily/weekly views. The calendar_events table for meetings
          and work blocks is designed in docs/DATABASE_PLAN.md and lands with this
          phase. Google Calendar sync stays a deferred integration — nothing here
          pretends to sync.
        </p>
      </EmptyState>
    </>
  );
}
