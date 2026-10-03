import Link from "next/link";
import { services, type ServiceSlug } from "@/lib/site-config";
import type { WorkItem } from "@/content/work";

const label = (slug: ServiceSlug) => services.find((s) => s.slug === slug)?.short ?? slug;

/** A case-study card: business, problem, delivered, outcome, visual. */
export function WorkCard({ item, index }: { item: WorkItem; index: number }) {
  return (
    <article className="group relative flex h-full flex-col border border-rule bg-ink transition-colors duration-500 hover:border-rule-strong">
      {/* visual — abstract placeholder composition */}
      <div className="relative aspect-[16/9] overflow-hidden md:aspect-[4/3] border-b border-rule bg-char">
        <div
          className="absolute inset-0 opacity-70 transition-transform duration-[1200ms] ease-[var(--ease-out)] group-hover:scale-[1.04]"
          style={{
            backgroundImage:
              index % 3 === 0
                ? "repeating-linear-gradient(90deg, rgb(255 255 255 / 0.08) 0 1px, transparent 1px 28px)"
                : index % 3 === 1
                  ? "radial-gradient(circle at 30% 70%, rgb(255 255 255 / 0.12), transparent 55%), repeating-linear-gradient(0deg, rgb(255 255 255 / 0.05) 0 1px, transparent 1px 22px)"
                  : "repeating-linear-gradient(135deg, rgb(255 255 255 / 0.07) 0 1px, transparent 1px 16px)",
          }}
        />
        <span className="t-label absolute left-4 top-4">0{index + 1}</span>
        {item.placeholder ? (
          <span className="t-label absolute right-4 top-4 border border-rule-strong px-2 py-1 !text-bone/70">Example</span>
        ) : null}
        <p className="absolute inset-x-4 bottom-4 text-sm text-mist">{item.sector}</p>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="t-label">{item.client}</p>
        <h3 className="mt-3 text-xl font-medium leading-snug tracking-tight">{item.title}</h3>

        <dl className="mt-6 space-y-4 text-sm">
          <div>
            <dt className="t-label">Problem</dt>
            <dd className="mt-1 text-mist">{item.problem}</dd>
          </div>
          <div>
            <dt className="t-label">Delivered</dt>
            <dd className="mt-1 text-mist">{item.delivered.join(" · ")}</dd>
          </div>
          <div>
            <dt className="t-label">Outcome</dt>
            <dd className="mt-1 text-mist">{item.outcome}</dd>
          </div>
        </dl>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-8">
          <p className="t-label">{item.services.map(label).join(" / ")}</p>
          <Link href="/work" className="u-link t-label !text-bone">
            All work →
          </Link>
        </div>
      </div>
    </article>
  );
}
