import Link from "next/link";
import { Photo } from "./photo";
import { services, type ServiceSlug } from "@/lib/site-config";
import type { WorkItem } from "@/content/work";

const label = (slug: ServiceSlug) => services.find((s) => s.slug === slug)?.short ?? slug;

/** A case-study card: business, problem, delivered, outcome, visual. */
export function WorkCard({ item, index }: { item: WorkItem; index: number }) {
  return (
    <article className="group relative flex h-full flex-col border border-rule bg-ink transition-colors duration-500 hover:border-rule-strong">
      {/* visual: real screenshot / mockup when provided, abstract pattern otherwise */}
      <div className="relative aspect-[16/10] overflow-hidden border-b border-rule bg-char">
        {item.image ? (
          <Photo
            src={item.image.src}
            alt={item.image.alt}
            width={item.image.width}
            height={item.image.height}
            className={`absolute inset-0 size-full transition-transform duration-[1400ms] ease-[var(--ease-out)] group-hover:scale-[1.035] ${item.image.fit === "contain" ? "object-contain p-5" : "object-cover object-top"}`}
          />
        ) : (
          <div
            className="absolute inset-0 opacity-70"
            style={{ backgroundImage: "repeating-linear-gradient(135deg, rgb(255 255 255 / 0.07) 0 1px, transparent 1px 16px)" }}
          />
        )}
        <span className="t-label absolute left-4 top-4 bg-ink/70 px-2 py-1">0{index + 1}</span>
        {item.placeholder ? (
          <span className="t-label absolute right-4 top-4 border border-rule-strong bg-ink/70 px-2 py-1 !text-bone/80">Example</span>
        ) : (
          <span className="t-label absolute right-4 top-4 border border-bone/60 bg-ink/70 px-2 py-1 !text-bone">Live product</span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="t-label">
          {item.client} · {item.sector}
        </p>
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
          {item.href ? (
            <a href={item.href} target="_blank" rel="noopener noreferrer" className="u-link t-label !text-bone">
              View live ↗
            </a>
          ) : (
            <Link href="/work" className="u-link t-label !text-bone">
              All work →
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
