import { Reveal } from "../reveal";
import { Section, SectionHeading } from "../section";
import { ServicesWheel } from "../services-wheel";

export function ServicesSection() {
  return (
    <Section id="services" className="overflow-hidden">
      <div className="site-wrap">
        <SectionHeading
          effect="mask"
          eyebrow="What I do"
          title="Six disciplines. One standard."
          lead="Most businesses stitch these together from different vendors. I build and run them as one system, so the software, the site, the search presence and the content all pull in the same direction."
        />
        <Reveal delay={120} className="mt-16 md:mt-24">
          <ServicesWheel />
        </Reveal>
      </div>
    </Section>
  );
}
