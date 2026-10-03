import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Marketing" };

export default function MarketingPage() {
  return (
    <>
      <PageHeader
        title="Marketing"
        description="Meta ads and SEO performance for client accounts — spend, CTR, CPC, CPM, leads, CPL, CPA, ROAS, frequency, plus Search Console and GA4 data."
      />
      <EmptyState tag="Phases 10–11 — Planned" title="Marketing data arrives with the integrations phases">
        <p>
          Client Meta ad accounts, Search Console, and GA4 are connected later
          (docs/BUILD_PROGRESS.md Phases 10–11). AI will detect problems,
          opportunities, and recommend changes — and will never make ad-spend
          changes without explicit approval (DECISIONS.md D-008).
        </p>
      </EmptyState>
    </>
  );
}
