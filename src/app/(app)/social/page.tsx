import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Social" };

export default function SocialPage() {
  return (
    <>
      <PageHeader
        title="Social"
        description="The social content pipeline: ideas, scripts, filming, editing, client approval, scheduled, published — plus the content calendar."
      />
      <EmptyState tag="Phase 7 — Planned" title="The content pipeline arrives in Phase 7">
        <p>
          Each piece of content will move through the seven pipeline stages with
          client approval tracking and a scheduled/published calendar. Analytics
          per platform stays a deferred idea (docs/IDEAS_BACKLOG.md §3).
        </p>
      </EmptyState>
    </>
  );
}
