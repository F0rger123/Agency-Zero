import type { Metadata } from "next";
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

      <section className="border-t border-rule py-20 md:py-28">
        <div className="site-wrap">
          {hasPlaceholders ? (
            <Reveal>
              <p className="t-label mb-10 max-w-xl">
                Case studies are being added. Entries marked Example show the format that real projects will follow.
              </p>
            </Reveal>
          ) : null}
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {work.map((item, i) => (
              <Reveal key={item.slug} delay={i * 90}>
                <WorkCard item={item} index={i} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBand title="Want to be the next case study?" />
    </>
  );
}
