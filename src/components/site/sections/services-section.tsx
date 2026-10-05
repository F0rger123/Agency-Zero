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
          title="Six services. One standard."
          lead="Websites, software, search, ads, social and video usually come from different vendors that never talk to each other. Agency Zero handles them together, so they all point at the same goal."
        />
        <Reveal delay={120} className="mt-16 md:mt-24">
          <ServicesWheel />
        </Reveal>
      </div>
    </Section>
  );
}
