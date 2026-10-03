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
  title: "Services",
  description:
    "Custom software and CRMs, website design, SEO, Meta ads, social media and video content — six disciplines delivered as one system.",
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
          title="Six disciplines. One standard."
          lead="Most businesses stitch these together from different vendors. I build and run them together, so your software, site, search presence and content all pull in the same direction."
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
              The software remembers the customer. The site wins them. Search finds them. Ads and content keep them coming.
            </p>
            <p className="t-lead mt-8 max-w-xl">
              You can start with one service. The work is designed so the others slot in later without rebuilding anything.
            </p>
          </Reveal>
        </div>
      </section>

      <CtaBand note="Tell me what you're working on and I'll tell you honestly where I can help." />
    </>
  );
}
