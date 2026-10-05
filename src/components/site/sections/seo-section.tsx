import Link from "next/link";
import { Reveal } from "../reveal";
import { Section, SectionHeading } from "../section";

import { Photo } from "../photo";

/**
 * "Be found" section: one rendered visual (search results with a map pack, an AI answer and a business
 * profile on a phone), three short explanations, then what the work involves. The businesses shown are
 * fictional and the layout is illustrative: no rankings, ratings counts or results are claimed.
 */
const skills = [
  ["Technical audit & fixes", "Crawlability, speed, structure, broken links and errors that quietly hold a site back."],
  ["On-page optimization", "Titles, headings, copy and internal links aligned to how people actually search."],
  ["Local SEO", "Google Business Profile, citations, reviews and location pages for “near me” searches."],
  ["Content that answers", "Pages built around real customer questions — useful to people and quotable by AI."],
  ["Authority", "Earning credible mentions and links the slow, safe way."],
  ["Reporting", "What changed, what it did, and what happens next — in plain language."],
] as const;

const flow = ["Audit", "Fix foundations", "Publish & optimize", "Build authority", "Report & refine"] as const;

export function SeoSection() {
  return (
    <Section id="seo">
      <div className="site-wrap">
        <SectionHeading
          effect="words"
          eyebrow="03 — SEO & AI search"
          title="Get found on Google, maps and AI search."
          lead="Customers now look for a business in three places at once. I make sure yours is clear, credible and easy to find in all of them, and that what they find makes them get in touch."
        />

        <Reveal className="mt-14 md:mt-20">
          <figure>
            <div className="overflow-hidden border border-rule-strong bg-coal">
              <Photo
                src="/images/mockups/seo-search.jpg"
                alt="A search results page for 'emergency plumber near me' with a map of local businesses, an AI-written answer that cites the business, and the business's profile on a phone"
                width={3200}
                height={2000}
                className="w-full"
              />
            </div>
            <figcaption className="t-label mt-3">Illustration with fictional businesses. Search, maps and AI answers are where customers look.</figcaption>
          </figure>
        </Reveal>

        <div className="mt-px grid gap-px border border-t-0 border-rule bg-rule md:grid-cols-3">
          {[
            ["Search results", "Clear titles, descriptions and pages that match what people type, so you appear for the right searches."],
            ["Maps and local", "A complete Google Business Profile with hours, photos and reviews, so you show up when people search “near me”."],
            ["AI answers (AEO)", "Pages that answer real questions plainly, with clear structure, so AI assistants and search features can understand and quote your business."],
          ].map(([title, body], i) => (
            <Reveal key={title} delay={i * 80} className="bg-ink p-7">
              <p className="t-label">0{i + 1}</p>
              <p className="mt-6 font-medium">{title}</p>
              <p className="t-body mt-2 !text-[0.9rem] !leading-6">{body}</p>
            </Reveal>
          ))}
        </div>

        {/* what we do */}
        <div className="mt-24 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
          {skills.map(([title, body], i) => (
            <Reveal key={title} delay={i * 50} className="bg-ink p-7">
              <p className="t-label">0{i + 1}</p>
              <p className="mt-6 font-medium">{title}</p>
              <p className="t-body mt-2 !text-[0.9rem] !leading-6">{body}</p>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10">
          <ol className="flex flex-wrap items-center gap-x-3 gap-y-3 font-mono text-[0.68rem] uppercase tracking-[0.14em]">
            {flow.map((step, i) => (
              <li key={step} className="flex items-center gap-3">
                <span className="border border-rule-strong px-3 py-2 text-mist">{step}</span>
                {i < flow.length - 1 ? <span className="text-ash" aria-hidden>→</span> : null}
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal className="mt-14 flex flex-wrap items-center justify-between gap-6">
          <p className="t-body max-w-xl">
            I don&apos;t promise rankings, because nobody honest can. I do the technical, content and local work that makes you easier to find
            and easier to choose, and I report on it plainly.
          </p>
          <Link href="/services/seo" className="btn">
            SEO &amp; search <span className="arrow" aria-hidden>→</span>
          </Link>
        </Reveal>
      </div>
    </Section>
  );
}
