import type { Metadata } from "next";
import Link from "next/link";
import { BarsDivider } from "@/components/site/bars-divider";
import { DotField } from "@/components/site/dot-field";
import { InstagramButton } from "@/components/site/instagram-button";
import { PageHero } from "@/components/site/page-hero";
import { PersonMoment } from "@/components/site/person-moment";
import { Reveal } from "@/components/site/reveal";
import { TypedText } from "@/components/site/typed-text";
import { CtaSection } from "@/components/site/sections/cta-section";
import { ServiceGlyph } from "@/components/site/service-glyph";
import { services, site } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "About Luke Knight",
  description:
    "Agency Zero is run by Luke Knight: custom software for businesses, plus the website design, search presence and content that bring customers to them.",
  alternates: { canonical: "/about" },
};

const principles = [
  ["Plain language", "You get clear options, honest timelines and straight answers, never jargon to hide behind."],
  ["One person, start to finish", "You deal directly with the person doing the work, from the first call to launch and after."],
  ["You own the result", "Everything is documented and handed over. There is no lock-in."],
] as const;

const steps = [
  ["01", "You tell me what you need", "A short message or call. I ask questions until I understand the business and what is getting in the way."],
  ["02", "I plan it", "A clear scope, price and timeline in writing before any work starts."],
  ["03", "I build it", "Design, code and content made together, with regular updates you can follow."],
  ["04", "We launch and I stay on", "Tested on real devices, handed over properly, and improved after launch."],
] as const;

export default function AboutPage() {
  return (
    <>
      <div className="relative">
        <DotField />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,transparent_20%,#000_85%)]" aria-hidden />
        <PageHero
          eyebrow="About Luke"
          title="Hi, I'm Luke Knight."
          lead="I run Agency Zero on my own. I build custom software for businesses, and the website design, search work and content that bring customers to them."
        />
      </div>

      <PersonMoment
        name="Luke Knight"
        statement="You talk to the person who designs, builds and publishes your work. Nothing gets lost between a salesperson, a manager and a developer."
      />

      <section className="border-t border-rule py-24 md:py-32">
        <div className="site-wrap grid gap-16 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <p className="t-label">Who runs it</p>
          </Reveal>
          <Reveal delay={100} className="space-y-6 lg:col-span-7">
            <p className="t-title max-w-[26ch]">Software, websites and marketing, made by one person so they fit together.</p>
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

      <BarsDivider />

      <section className="border-t border-rule bg-coal py-24 md:py-32">
        <div className="site-wrap">
          <Reveal>
            <p className="t-label">What I do</p>
            <h2 className="t-display mt-6 max-w-[16ch]"><TypedText text="Six things, one standard." className="block" speed={24} /></h2>
          </Reveal>
          <ul className="mt-14 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, i) => (
              <Reveal as="li" key={service.slug} delay={i * 60} className="bg-coal">
                <Link href={`/services/${service.slug}`} className="group flex h-full flex-col justify-between gap-12 p-7 md:p-9">
                  <div className="flex items-start justify-between">
                    <span className="t-label">{service.index}</span>
                    <ServiceGlyph slug={service.slug} className="size-14 text-ash transition-colors duration-500 group-hover:text-bone" />
                  </div>
                  <div>
                    <p className="t-title !text-[1.6rem]">{service.title}</p>
                    <p className="t-body mt-3 !text-[0.92rem]">{service.summary}</p>
                    <p className="t-label mt-6 transition-transform duration-500 group-hover:translate-x-1">Read more →</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-rule py-24 md:py-32">
        <div className="site-wrap">
          <Reveal>
            <p className="t-label">How a project runs</p>
            <h2 className="t-display mt-6 max-w-[18ch]"><TypedText text="Four steps, and you always know which one you are on." className="block" speed={24} /></h2>
          </Reveal>
          <ol className="mt-14 grid gap-px border border-rule bg-rule md:grid-cols-4">
            {steps.map(([n, title, body], i) => (
              <Reveal as="li" key={n} delay={i * 80} className="bg-ink p-7 md:p-8">
                <p className="t-label">{n}</p>
                <p className="t-title mt-12 !text-[1.5rem]">{title}</p>
                <p className="t-body mt-4 !text-[0.92rem]">{body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-rule bg-coal py-24 md:py-32">
        <div className="site-wrap">
          <Reveal>
            <p className="t-label">How I work</p>
          </Reveal>
          <dl className="mt-10 grid gap-px border border-rule bg-rule md:grid-cols-3">
            {principles.map(([title, body], i) => (
              <Reveal key={title} delay={i * 70} className="bg-coal p-8 md:p-10">
                <p className="t-label">0{i + 1}</p>
                <dt className="t-title mt-12 !text-[1.7rem]">{title}</dt>
                <dd className="t-body mt-4">{body}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      <CtaSection
        line1="A good project starts with one conversation."
        line2="Let's build it"
        word="together."
        secondary={{ href: "/work", label: "or see the work first" }}
      />
    </>
  );
}
