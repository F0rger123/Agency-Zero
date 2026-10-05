import type { Metadata } from "next";
import Link from "next/link";
import { BarsDivider } from "@/components/site/bars-divider";
import { CtaBand } from "@/components/site/cta-band";
import { DotField } from "@/components/site/dot-field";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";
import { ServiceGlyph } from "@/components/site/service-glyph";
import { services } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Services: Websites, Software, SEO, Ads & Content",
  description:
    "Custom software and CRMs, websites, SEO and AI search, Meta ads, social media and video, delivered as one system by one person. Based in York, PA, working with businesses anywhere.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <div className="relative">
        <DotField />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,transparent_20%,#000_85%)]" aria-hidden />
        <PageHero
          eyebrow="Services"
          effect="typing"
          title="Six services. One standard."
          lead="Websites, software, search, ads, social and video usually come from different vendors that never talk to each other. Agency Zero handles them together, so they all point at the same goal."
        />
      </div>

      <section className="border-t border-rule">
        <ul className="site-wrap divide-y divide-rule">
          {services.map((service, i) => (
            <Reveal as="li" key={service.slug} delay={i * 40}>
              <Link
                href={`/services/${service.slug}`}
                className="group grid items-center gap-6 py-10 md:grid-cols-12 md:py-14"
              >
                <span className="t-label md:col-span-1">{service.index}</span>
                <h2 className="t-title md:col-span-5">{service.title}</h2>
                <p className="t-body md:col-span-4">{service.summary}</p>
                <span className="flex items-center justify-between gap-6 md:col-span-2 md:justify-end">
                  <ServiceGlyph slug={service.slug} className="size-14 text-ash transition-colors duration-500 group-hover:text-bone" />
                  <span className="t-label transition-transform duration-500 group-hover:translate-x-1">→</span>
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </section>

      <BarsDivider />

      <section className="border-t border-rule py-24 md:py-32">
        <div className="site-wrap grid gap-12 md:grid-cols-12">
          <Reveal className="md:col-span-3">
            <p className="t-label">Better together</p>
          </Reveal>
          <Reveal delay={100} className="md:col-span-9">
            <p className="t-title max-w-[26ch]">
              The software remembers the customer. The website wins them. Search helps them find you. Ads and content keep them coming.
            </p>
            <p className="t-lead mt-8 max-w-xl">
              You can start with one service. The work is built so the others slot in later without rebuilding anything. Consulting and coaching are available
              where they fit.
            </p>
            <p className="t-body mt-6 max-w-xl">
              Based in York, PA, with in-person work around the region. Everything else is delivered remotely, so I work with businesses anywhere.
            </p>
          </Reveal>
        </div>
      </section>

      <CtaBand title="Not sure what you need?" note="Tell me what you're working on and I'll tell you honestly where I can help." />
    </>
  );
}
