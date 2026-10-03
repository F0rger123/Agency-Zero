import Link from "next/link";
import { BrowserGallery } from "../browser-gallery";
import { DotField } from "../dot-field";
import { Reveal } from "../reveal";
import { Section, SectionHeading } from "../section";

const points = [
  ["Custom design", "Designed for your brand and audience — never a re-skinned template."],
  ["Responsive builds", "Crafted for phones, tablets and large screens, with accessibility built in."],
  ["Conversion-focused", "Layout, copy and calls to action arranged to turn attention into enquiries."],
  ["SEO foundations", "Clean structure, speed and metadata from the first commit."],
  ["Motion & visuals", "Interaction that supports the message — this site is a sample of the standard."],
] as const;

export function WebsitesSection() {
  return (
    <Section id="websites" className="overflow-hidden bg-ink">
      <DotField />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,#000_80%)]" aria-hidden />
      <div className="site-wrap relative">
        <SectionHeading
          eyebrow="02 — Websites"
          title="A website is the first thing your customers judge."
          lead="You are looking at the standard we build to. Every site we make is designed and engineered from scratch for the business behind it."
        />

        <Reveal className="mt-20 md:mt-28">
          <BrowserGallery />
        </Reveal>

        <ul className="mt-20 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-5">
          {points.map(([title, body], i) => (
            <Reveal key={title} as="li" delay={i * 60} className="bg-ink p-6">
              <p className="t-label">0{i + 1}</p>
              <p className="mt-4 text-sm font-medium">{title}</p>
              <p className="t-body mt-2 !text-[0.85rem] !leading-6">{body}</p>
            </Reveal>
          ))}
        </ul>

        <Reveal className="mt-12">
          <Link href="/services/websites" className="btn">
            Website design &amp; build <span className="arrow" aria-hidden>→</span>
          </Link>
        </Reveal>
      </div>
    </Section>
  );
}
