import Link from "next/link";
import { positioning } from "@/content/local-seo";
import { Reveal } from "../reveal";

/**
 * "Based in York, PA. Built to work anywhere." Two plain columns: what needs a person on site (around York) and what
 * doesn't (everything else). The first sentence is the quotable summary for search and answer engines.
 */
export function WhereSection() {
  return (
    <section className="border-t border-rule py-20 md:py-28">
      <div className="site-wrap">
        <Reveal>
          <p className="t-label">Where I work</p>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="t-display mt-6 max-w-[16ch] !text-[clamp(2.4rem,5vw,4.6rem)]">
            Based in York, PA. Built to work anywhere.
          </h2>
        </Reveal>
        <Reveal delay={140}>
          <p className="speakable t-lead mt-8 max-w-2xl">
            Agency Zero is based in the York, PA area. If a job needs someone on site, like a shoot or an in-person meeting, I&apos;m close by.
            If it can be done online, where you are doesn&apos;t matter.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-px border border-rule bg-rule md:grid-cols-2">
          <Reveal delay={200} className="bg-ink p-8 md:p-10">
            <p className="t-label">In person · York, PA and nearby</p>
            <p className="t-title mt-8 !text-[1.5rem]">Local when it matters.</p>
            <p className="t-body mt-4">
              Video and content shoots, in-person consultations, on-site creative work and business meetings in the York area and across the surrounding region.
            </p>
          </Reveal>
          <Reveal delay={260} className="bg-ink p-8 md:p-10">
            <p className="t-label">Remote · anywhere</p>
            <p className="t-title mt-8 !text-[1.5rem]">Remote where it doesn&apos;t.</p>
            <p className="t-body mt-4">
              Websites, custom software and CRMs, SEO and AI search, Meta ads, social media and consulting all run over video calls and shared tools, so businesses outside Pennsylvania are welcome.
            </p>
          </Reveal>
        </div>

        <Reveal delay={320} className="mt-10 flex flex-wrap gap-4">
          <Link href="/areas" className="btn">
            Where I work <span className="arrow" aria-hidden>→</span>
          </Link>
          <Link href="/faq" className="btn">
            Common questions <span className="arrow" aria-hidden>→</span>
          </Link>
        </Reveal>
        <p className="sr-only">{positioning.remote}</p>
      </div>
    </section>
  );
}
