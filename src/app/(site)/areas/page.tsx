import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand } from "@/components/site/cta-band";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";
import { positioning } from "@/content/local-seo";
import { areasByCounty, breadcrumbJsonLd, webPageJsonLd } from "@/lib/seo";
import { services } from "@/lib/site-config";

const description =
  "Agency Zero is based in York, PA and available for in-person work around South Central Pennsylvania. Websites, software, SEO, Meta ads and social media are delivered remotely for businesses anywhere.";

export const metadata: Metadata = {
  title: "Where Agency Zero Works: York, PA & Remote",
  description,
  alternates: { canonical: "/areas" },
  openGraph: { title: "Where Agency Zero works: York, PA and remote", description, url: "/areas" },
};

export default function AreasPage() {
  const groups = areasByCounty();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            webPageJsonLd("/areas", "Where Agency Zero works", description),
            breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Where I work", path: "/areas" }]),
          ]),
        }}
      />

      <PageHero
        eyebrow="Where I work"
        title="Based in York, PA. Built to work anywhere."
        lead="If a job needs someone on site, I'm close by. If it can be done online, where you are doesn't matter."
      />

      <section className="border-t border-rule py-16 md:py-24">
        <div className="site-wrap grid gap-12 lg:grid-cols-12">
          <p className="t-label lg:col-span-4">The short answer</p>
          <div className="lg:col-span-8">
            <p className="speakable t-title !text-[clamp(1.15rem,1.7vw,1.5rem)] !leading-snug">
              Agency Zero is based in the York, Pennsylvania area. It does in-person work, such as video shoots and meetings, around York and the surrounding
              region, and delivers websites, custom software, SEO, Meta ads and social media remotely for businesses anywhere.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-rule py-16 md:py-24">
        <div className="site-wrap grid gap-px border border-rule bg-rule md:grid-cols-2">
          <Reveal className="bg-ink p-8 md:p-12">
            <p className="t-label">In person</p>
            <h2 className="t-title mt-8 !text-[1.8rem]">York, PA and the surrounding region</h2>
            <p className="t-body mt-5">{positioning.inPerson}</p>
            <ul className="t-body mt-6 space-y-2">
              <li>— Video and content shoots</li>
              <li>— In-person consultations and business meetings</li>
              <li>— On-site creative work and local production</li>
            </ul>
          </Reveal>
          <Reveal delay={80} className="bg-ink p-8 md:p-12">
            <p className="t-label">Remote</p>
            <h2 className="t-title mt-8 !text-[1.8rem]">Businesses anywhere</h2>
            <p className="t-body mt-5">{positioning.remote}</p>
            <ul className="t-body mt-6 space-y-2">
              <li>— Websites and custom software</li>
              <li>— SEO, AI-search optimization and local SEO</li>
              <li>— Meta ads, social media and consulting</li>
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-rule bg-coal py-16 md:py-24">
        <div className="site-wrap">
          <Reveal>
            <p className="t-label">Around York, in person</p>
            <p className="t-body mt-5 max-w-2xl">
              These are the places I can reach easily for shoots, meetings and on-site work. If you&apos;re a little further out, ask: it&apos;s often still possible.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-px border border-rule bg-rule md:grid-cols-2 lg:grid-cols-3">
            {groups.map(([county, list], i) => (
              <Reveal key={county} delay={i * 40} className="bg-coal p-7">
                <h2 className="t-title !text-[1.25rem]">{county}</h2>
                <p className="t-body mt-4 !text-[0.92rem]">{list.map((area) => area.name).join(", ")}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-rule py-16 md:py-24">
        <div className="site-wrap">
          <Reveal>
            <p className="t-label">What I do</p>
          </Reveal>
          <ul className="mt-10 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <li key={service.slug} className="bg-ink">
                <Link href={`/services/${service.slug}`} className="group block p-7 transition-colors hover:bg-coal">
                  <p className="t-label">{service.index}</p>
                  <p className="t-title mt-6 !text-[1.35rem]">{service.title}</p>
                  <p className="t-body mt-3 !text-[0.92rem]">{service.summary}</p>
                </Link>
              </li>
            ))}
          </ul>
          <p className="t-label mt-10">
            More answers on the{" "}
            <Link href="/faq" className="u-link">
              FAQ page
            </Link>
            .
          </p>
        </div>
      </section>

      <CtaBand title="Wherever you are, let's talk." />
    </>
  );
}
