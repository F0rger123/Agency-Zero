import Link from "next/link";
import { AsciiReactionLazy } from "@/components/site/ascii-reaction-lazy";
import { BrandMoment } from "@/components/site/brand-moment";
import { Reveal } from "@/components/site/reveal";
import { ContentSection } from "@/components/site/sections/content-section";
import { CtaSection } from "@/components/site/sections/cta-section";
import { ProcessSection } from "@/components/site/sections/process-section";
import { SeoSection } from "@/components/site/sections/seo-section";
import { ServicesSection } from "@/components/site/sections/services-section";
import { SoftwareSection } from "@/components/site/sections/software-section";
import { WebsitesSection } from "@/components/site/sections/websites-section";
import { WorkSection } from "@/components/site/sections/work-section";
import { services } from "@/lib/site-config";

const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Agency Zero",
  description:
    "Custom software and CRMs, website design, SEO, Meta ads, social media and video content, built as one system.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://agencyzero.com",
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }} />
      <Hero />
      <BrandMoment />
      <ServicesSection />
      <SoftwareSection />
      <WebsitesSection />
      <SeoSection />
      <ContentSection />
      <WorkSection />
      <ProcessSection />
      <CtaSection />
    </>
  );
}

function Hero() {
  return (
    <section className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden pt-28">
      {/* Atmosphere: the reaction field sits right/bottom; plain gradient overlays (cheaper than CSS masks)
          fade it out under the headline and at the edges. */}
      <div className="absolute inset-0 -z-10" aria-hidden>
        <AsciiReactionLazy />
        <div className="absolute inset-y-0 left-0 w-[70%] bg-gradient-to-r from-ink via-ink/70 to-transparent max-md:hidden" />
        <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-ink via-ink/70 to-transparent md:h-1/3 max-md:from-ink" />
        <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-ink to-transparent" />
      </div>
      <div className="depth-top absolute inset-0 -z-10" aria-hidden />

      <div className="site-wrap pb-10 md:pb-14">
        <Reveal>
          <p className="t-label mb-8 flex items-center gap-4">
            <span className="inline-block size-1.5 rounded-full bg-bone" aria-hidden />
            Agency Zero — software, website design, search &amp; content
          </p>
        </Reveal>

        <Reveal delay={90}>
          <h1 className="t-display max-w-[15ch] md:max-w-[17ch]">
            We build the systems, content and presence behind better businesses.
          </h1>
        </Reveal>

        <div className="mt-10 grid items-end gap-10 md:mt-14 md:grid-cols-12">
          <Reveal delay={200} className="md:col-span-5">
            <p className="t-lead max-w-md">
              Custom software. Website design. SEO. Paid media. Content. One person, one standard — so the work around your
              business finally fits together.
            </p>
          </Reveal>
          <Reveal delay={300} className="md:col-span-7 md:justify-self-end">
            <div className="flex flex-wrap gap-4">
              <Link href="/contact" className="btn btn-solid">
                Start a project <span className="arrow" aria-hidden>→</span>
              </Link>
              <Link href="/work" className="btn">
                See our work <span className="arrow" aria-hidden>→</span>
              </Link>
            </div>
          </Reveal>
        </div>

        <Reveal delay={400}>
          <ul className="mt-14 grid grid-cols-2 border-t border-rule sm:grid-cols-3 lg:grid-cols-6">
            {services.map((service) => (
              <li key={service.slug} className="border-b border-rule sm:border-r sm:last:border-r-0 lg:border-b-0">
                <Link
                  href={`/services/${service.slug}`}
                  className="group flex items-baseline justify-between gap-3 px-1 py-4 sm:px-4"
                >
                  <span className="t-label transition-colors group-hover:!text-bone">{service.index}</span>
                  <span className="text-sm text-mist transition-colors group-hover:text-bone">{service.short}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
