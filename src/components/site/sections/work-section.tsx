import Link from "next/link";
import { work } from "@/content/work";
import { Reveal } from "../reveal";
import { Section, SectionHeading } from "../section";
import { WorkCard } from "../work-card";

export function WorkSection() {
  return (
    <Section id="work">
      <div className="site-wrap">
        <SectionHeading
          eyebrow="Selected work"
          title="Proof beats promises."
          lead="A growing selection of projects. Each one is shown as the problem we were handed, what we delivered, and what changed."
        />
        <div className="mt-16 grid gap-5 md:mt-24 md:grid-cols-3">
          {work.map((item, i) => (
            <Reveal key={item.slug} delay={i * 110}>
              <WorkCard item={item} index={i} />
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-12">
          <Link href="/work" className="btn">
            View all work <span className="arrow" aria-hidden>→</span>
          </Link>
        </Reveal>
      </div>
    </Section>
  );
}
