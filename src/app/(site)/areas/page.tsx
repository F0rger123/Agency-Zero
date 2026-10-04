import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand } from "@/components/site/cta-band";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";
import { areasByCounty, breadcrumbJsonLd, webPageJsonLd } from "@/lib/seo";
import { services } from "@/lib/site-config";

const description =
  "Agency Zero serves York, PA and surrounding areas: web design, custom software and CRMs, SEO, Meta ads and social media for businesses in York County, Harrisburg, Lancaster, Gettysburg and Central Pennsylvania.";

export const metadata: Metadata = {
  title: "Areas Served: York, PA & Central PA",
  description,
  alternates: { canonical: "/areas" },
  openGraph: { title: "Areas served: York, PA and Central Pennsylvania", description, url: "/areas" },
};

export default function AreasPage() {
  const groups = areasByCounty();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            webPageJsonLd("/areas", "Areas served by Agency Zero", description),
            breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Areas served", path: "/areas" }]),
          ]),
        }}
      />

      <PageHero
        eyebrow="Areas served"
        title="York, PA and the area around it."
        lead="Agency Zero is a York, PA digital agency. I work with businesses across York County, Central Pennsylvania and the Harrisburg, Lancaster and Gettysburg areas, in person where it helps and by video call anywhere."
      />

      <section className="border-t border-rule py-16 md:py-24">
        <div className="site-wrap grid gap-10 lg:grid-cols-12">
          <p className="t-label lg:col-span-4">The short answer</p>
          <div className="lg:col-span-8">
            <p className="speakable t-title !text-[clamp(1.15rem,1.7vw,1.5rem)] !leading-snug">
              Agency Zero builds websites and custom software and runs SEO, Meta ads and social media for small businesses in York, PA,
              Hanover, Red Lion, Dallastown, Harrisburg, Lancaster, Gettysburg, Carlisle and the rest of South Central Pennsylvania.
            </p>
            <p className="t-body mt-6 max-w-2xl">
              Everything I do works remotely, so a business anywhere in Pennsylvania can work with me. Being local simply means I know the
              area, the competition and how people here search, and I can meet in person around York when that is useful.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-rule py-16 md:py-24">
        <div className="site-wrap">
          <Reveal>
            <p className="t-label">Where I work</p>
          </Reveal>
          <div className="mt-10 grid gap-px border border-rule bg-rule md:grid-cols-2 lg:grid-cols-3">
            {groups.map(([county, list], i) => (
              <Reveal key={county} delay={i * 40} className="bg-ink p-7">
                <h2 className="t-title !text-[1.35rem]">{county}</h2>
                <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-mist">
                  {list.map((area) => (
                    <li key={area.slug}>
                      {area.name}
                      {"state" in area ? `, ${area.state}` : ", PA"}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-rule bg-coal py-16 md:py-24">
        <div className="site-wrap">
          <Reveal>
            <p className="t-label">What I do in York, PA</p>
          </Reveal>
          <ul className="mt-10 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <li key={service.slug} className="bg-coal">
                <Link href={`/services/${service.slug}`} className="group block p-7 transition-colors hover:bg-ink">
                  <p className="t-label">{service.index}</p>
                  <p className="t-title mt-6 !text-[1.35rem]">{service.title} in York, PA</p>
                  <p className="t-body mt-3 !text-[0.92rem]">{service.summary}</p>
                </Link>
              </li>
            ))}
          </ul>
          <p className="t-label mt-10">
            Common questions are answered on the{" "}
            <Link href="/faq" className="u-link">
              FAQ page
            </Link>
            .
          </p>
        </div>
      </section>

      <CtaBand title="Based in York or nearby? Let's talk." />
    </>
  );
}
