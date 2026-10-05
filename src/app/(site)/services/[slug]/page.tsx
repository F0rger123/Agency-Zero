import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CrmMockup } from "@/components/site/crm-mockup";
import { Faq } from "@/components/site/faq";
import { CtaBand } from "@/components/site/cta-band";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";
import { ServiceGlyph } from "@/components/site/service-glyph";
import { servicePages } from "@/content/services";
import { localFaqs, serviceSeo, shortAnswers } from "@/content/local-seo";
import { absolute, breadcrumbJsonLd, faqJsonLd, siteUrl, webPageJsonLd } from "@/lib/seo";
import { services, type ServiceSlug } from "@/lib/site-config";

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = servicePages[slug as ServiceSlug];
  if (!page) return {};
  const seo = serviceSeo[slug as ServiceSlug];
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: `/services/${slug}` },
    openGraph: { title: seo.title, description: seo.description, url: `/services/${slug}` },
  };
}

export default async function ServicePageRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = servicePages[slug as ServiceSlug];
  const meta = services.find((s) => s.slug === slug);
  if (!page || !meta) notFound();

  const seo = serviceSeo[slug as ServiceSlug];
  const faqs = [...page.faqs, ...localFaqs[slug as ServiceSlug]];
  const path = `/services/${slug}`;
  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${absolute(path)}#service`,
    name: page.title,
    serviceType: seo.serviceType,
    description: seo.description,
    provider: { "@id": `${siteUrl}/#business` },
    areaServed: [{ "@type": "City", name: "York, PA" }, { "@type": "AdministrativeArea", name: "York County, PA" }, { "@type": "State", name: "Pennsylvania" }, { "@type": "Country", name: "United States" }],
    url: absolute(path),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([
            serviceLd,
            webPageJsonLd(path, seo.title, seo.description),
            faqJsonLd(faqs),
            breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Services", path: "/services" }, { name: page.title, path }]),
          ]) }} />

      <PageHero
        eyebrow={`${meta.index} — ${page.title}`}
        title={page.headline}
        lead={page.intro}
        aside={
          slug === "software" ? (
            <CrmMockup />
          ) : (
            <ServiceGlyph slug={meta.slug} className="mx-auto size-48 text-bone/70 lg:size-64" />
          )
        }
      />

      <section className="border-t border-rule py-12 md:py-16">
        <div className="site-wrap grid gap-6 lg:grid-cols-12">
          <p className="t-label lg:col-span-4">The short answer</p>
          <div className="lg:col-span-8">
            <p className="speakable t-title !text-[clamp(1.15rem,1.7vw,1.5rem)] !leading-snug">{shortAnswers[slug as ServiceSlug]}</p>
            <p className="t-body mt-6 max-w-2xl !text-[0.95rem]">
              {page.where}{" "}
              <Link href="/areas" className="u-link text-bone">
                Where I work
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-rule py-24 md:py-32">
        <div className="site-wrap grid gap-16 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <p className="t-label">Who it&apos;s for</p>
            <ul className="mt-8 space-y-5">
              {page.audience.map((item) => (
                <li key={item} className="flex gap-4 text-mist">
                  <span className="text-ash">—</span>
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>

          <div className="lg:col-span-8">
            <Reveal>
              <p className="t-label">What&apos;s included</p>
            </Reveal>
            <dl className="mt-8 grid gap-px border border-rule bg-rule sm:grid-cols-2">
              {page.includes.map((item, i) => (
                <Reveal key={item.title} delay={i * 50} className="bg-ink p-7">
                  <dt className="font-medium">{item.title}</dt>
                  <dd className="t-body mt-3 !text-[0.92rem]">{item.body}</dd>
                </Reveal>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="border-t border-rule bg-coal py-24 md:py-32">
        <div className="site-wrap">
          <Reveal>
            <p className="t-label">How it works</p>
          </Reveal>
          <ol className="mt-10 grid gap-px border border-rule bg-rule md:grid-cols-4">
            {page.process.map((step, i) => (
              <Reveal as="li" key={step.title} delay={i * 80} className="bg-coal p-7">
                <p className="t-label">0{i + 1}</p>
                <p className="t-title mt-10 !text-[1.7rem]">{step.title}</p>
                <p className="t-body mt-4 !text-[0.92rem]">{step.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-rule py-24 md:py-32">
        <div className="site-wrap grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <p className="t-label">Questions</p>
          </Reveal>
          <div className="lg:col-span-8">
            <Faq items={faqs} />
          </div>
        </div>
      </section>

      <section className="border-t border-rule py-16">
        <div className="site-wrap">
          <p className="t-label">Other services</p>
          <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
            {services
              .filter((s) => s.slug !== slug)
              .map((s) => (
                <li key={s.slug}>
                  <Link href={`/services/${s.slug}`} className="u-link text-mist hover:text-bone">
                    {s.short}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      </section>

      <CtaBand title={page.ctaTitle} />
    </>
  );
}
