import type { Metadata } from "next";
import Link from "next/link";
import { AsciiReactionLazy } from "@/components/site/ascii-reaction-lazy";
import { BrandMoment } from "@/components/site/brand-moment";
import { Marquee } from "@/components/site/marquee";
import { Reveal } from "@/components/site/reveal";
import { ContentSection } from "@/components/site/sections/content-section";
import { CtaSection } from "@/components/site/sections/cta-section";
import { ProcessSection } from "@/components/site/sections/process-section";
import { SeoSection } from "@/components/site/sections/seo-section";
import { ServicesSection } from "@/components/site/sections/services-section";
import { SoftwareSection } from "@/components/site/sections/software-section";
import { WebsitesSection } from "@/components/site/sections/websites-section";
import { WorkSection } from "@/components/site/sections/work-section";
import { TypeRotator } from "@/components/site/typed-text";
import { areas, breadcrumbJsonLd, webPageJsonLd } from "@/lib/seo";
import { services } from "@/lib/site-config";

export const metadata: Metadata = {
  title: { absolute: "Agency Zero | Web Design, Custom Software & SEO in York, PA" },
  description:
    "York, PA digital agency run by Luke Knight: custom software and CRMs, website design, SEO, Meta ads, social media management and video for small businesses in York County and Central Pennsylvania.",
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            webPageJsonLd("/", "Agency Zero: web design, custom software and SEO in York, PA", "York, PA digital agency run by Luke Knight."),
            breadcrumbJsonLd([{ name: "Home", path: "/" }]),
          ]),
        }}
      />
      <Hero />
      <BrandMoment />
      <Marquee items={["Custom software", "Website design", "SEO", "Meta ads", "Social media", "Video content"]} />
      <ServicesSection />
      <SoftwareSection />
      <WebsitesSection />
      <SeoSection />
      <ContentSection />
      <WorkSection />
      <ProcessSection />
      <LocalSection />
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
          <p className="t-label mb-6 flex items-center gap-4">
            <span className="inline-block size-1.5 rounded-full bg-bone" aria-hidden />
            Websites · SEO · Meta ads · Social · Software
          </p>
        </Reveal>

        <Reveal delay={90}>
          <h1 className="t-display !text-[clamp(3.4rem,14.5vw,15rem)] !leading-[0.92] !tracking-[-0.055em]">Agency Zero</h1>
        </Reveal>

        <div className="mt-10 grid items-end gap-10 md:mt-14 md:grid-cols-12">
          <Reveal delay={200} className="md:col-span-6">
            <p className="t-title max-w-[26ch] !text-[clamp(1.4rem,2.4vw,2.1rem)]">
              I build the software, websites and marketing behind better businesses.
            </p>
            <p className="t-label mt-6">
              Right now I&apos;m building{" "}
              <TypeRotator
                className="text-bone"
                phrases={["a custom CRM", "a new website", "an SEO plan", "a Meta ads campaign", "short-form video"]}
              />
            </p>
          </Reveal>
          <Reveal delay={300} className="md:col-span-6 md:justify-self-end">
            <div className="flex flex-wrap gap-4">
              <Link href="/contact" className="btn btn-solid">
                Let&apos;s talk growth <span className="arrow" aria-hidden>→</span>
              </Link>
              <Link href="/work" className="btn">
                See my work <span className="arrow" aria-hidden>→</span>
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

function LocalSection() {
  const nearby = areas.filter((area) => area.tier <= 3 && area.slug !== "york").slice(0, 14);
  return (
    <section className="border-t border-rule py-20 md:py-28">
      <div className="site-wrap grid gap-10 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <p className="t-label">Local to York, PA</p>
        </Reveal>
        <div className="lg:col-span-8">
          <Reveal delay={80}>
            <h2 className="speakable t-title !text-[clamp(1.4rem,2.3vw,2.1rem)] !leading-snug">
              Agency Zero is a York, PA web design, custom software and digital marketing agency, serving York County and Central Pennsylvania.
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="t-body mt-6 max-w-2xl">
              Looking for a website builder, software developer, CRM builder, SEO company, social media manager or Meta ads manager near
              you? I work with small businesses in York, {nearby.slice(0, 6).map((area) => area.name).join(", ")} and across the region, in
              person where it helps and by video call anywhere.
            </p>
            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-mist">
              {nearby.map((area) => (
                <li key={area.slug}>{area.name}</li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/areas" className="btn">
                Areas I serve <span className="arrow" aria-hidden>→</span>
              </Link>
              <Link href="/faq" className="btn">
                Common questions <span className="arrow" aria-hidden>→</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
