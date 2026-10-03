import type { Metadata } from "next";
import { CrewbossCaseStudy } from "@/components/site/crewboss-case-study";
import { CtaBand } from "@/components/site/cta-band";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";
import { WorkCard } from "@/components/site/work-card";
import { work } from "@/content/work";

export const metadata: Metadata = {
  title: "Work",
  description: "Selected Agency Zero projects: the problem, what we delivered, and what changed.",
  alternates: { canonical: "/work" },
};

export default function WorkPage() {
  const hasPlaceholders = work.some((item) => item.placeholder);
  return (
    <>
      <PageHero
        eyebrow="Work"
        title="Proof beats promises."
        lead="Each project is shown as the problem we were handed, what we delivered and what changed — no inflated numbers."
      />

      <CrewbossCaseStudy />

      <section className="border-t border-rule py-20 md:py-28">
        <div className="site-wrap">
          <Reveal>
            <p className="t-label mb-10">More projects</p>
          </Reveal>
          {hasPlaceholders ? (
            <Reveal>
              <p className="t-label mb-10 max-w-xl">
                More case studies are being added. Entries marked Example show the format real projects will follow.
              </p>
            </Reveal>
          ) : null}
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {work.filter((item) => item.slug !== "crewboss").map((item, i) => (
              <Reveal key={item.slug} delay={i * 90}>
                <WorkCard item={item} index={i + 1} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBand title="Want to be the next case study?" />
    </>
  );
}
