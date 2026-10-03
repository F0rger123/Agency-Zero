import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand } from "@/components/site/cta-band";
import { InstagramButton } from "@/components/site/instagram-button";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";
import { services, site } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "About Luke Knight",
  description:
    "Agency Zero is run by Luke Knight: custom software for businesses, plus the website design, search presence and content that bring customers to them.",
  alternates: { canonical: "/about" },
};

const principles = [
  ["Plain language", "You get clear options, honest timelines and straight answers — never jargon to hide behind."],
  ["One person, start to finish", "You deal directly with the person doing the work, from the first call to launch and after."],
  ["You own the result", "Everything is documented and handed over. There is no lock-in."],
] as const;

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Luke"
        title="Hi, I'm Luke Knight."
        lead="I run Agency Zero on my own. I build custom software for businesses, and the website design, search work and content that bring customers to them."
      />

      <section className="border-t border-rule py-24 md:py-32">
        <div className="site-wrap grid gap-16 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <p className="t-label">Who runs it</p>
          </Reveal>
          <Reveal delay={100} className="space-y-6 lg:col-span-7">
            <p className="t-body max-w-xl">
              Agency Zero is run by {site.owner}. I design, write the code and produce the content myself, which is why the CRM, the
              website and the campaign for the same client look and feel like one thing.
            </p>
            <p className="t-body max-w-xl">
              I also build my own products. <Link href="/work" className="u-link text-bone">CrewBoss</Link>, a CRM for pressure-washing
              businesses, is live, and what I learn building it goes back into client work.
            </p>
            <p className="t-body max-w-xl">
              The quickest way to reach me is email at <a href={`mailto:${site.email}`} className="u-link text-bone">{site.email}</a>,
              and I post my work on Instagram.
            </p>
            <InstagramButton className="mt-2" />
          </Reveal>
        </div>
      </section>

      <section className="border-t border-rule bg-coal py-24 md:py-32">
        <div className="site-wrap grid gap-16 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <p className="t-label">What I do</p>
          </Reveal>
          <ul className="grid gap-x-10 gap-y-1 sm:grid-cols-2 lg:col-span-8">
            {services.map((service, i) => (
              <Reveal as="li" key={service.slug} delay={i * 40} className="border-b border-rule">
                <Link href={`/services/${service.slug}`} className="group flex items-baseline justify-between gap-4 py-4">
                  <span className="tracking-tight">{service.title}</span>
                  <span className="t-label transition-transform duration-500 group-hover:translate-x-1" aria-hidden>→</span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-rule py-24 md:py-32">
        <div className="site-wrap">
          <Reveal>
            <p className="t-label">How I work</p>
          </Reveal>
          <dl className="mt-10 grid gap-px border border-rule bg-rule md:grid-cols-3">
            {principles.map(([title, body], i) => (
              <Reveal key={title} delay={i * 70} className="bg-ink p-8 md:p-10">
                <p className="t-label">0{i + 1}</p>
                <dt className="t-title mt-12 !text-[1.7rem]">{title}</dt>
                <dd className="t-body mt-4">{body}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      <CtaBand title="Let's talk about your project." />
    </>
  );
}
