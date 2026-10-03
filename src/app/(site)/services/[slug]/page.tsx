import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CrmMockup } from "@/components/site/crm-mockup";
import { CtaBand } from "@/components/site/cta-band";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";
import { ServiceGlyph } from "@/components/site/service-glyph";
import { servicePages } from "@/content/services";
import { services, site, type ServiceSlug } from "@/lib/site-config";

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = servicePages[slug as ServiceSlug];
  if (!page) return {};
  return {
    title: page.title,
    description: page.metaDescription,
    alternates: { canonical: `/services/${slug}` },
    openGraph: { title: `${page.title} — Agency Zero`, description: page.metaDescription },
  };
}

export default async function ServicePageRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = servicePages[slug as ServiceSlug];
  const meta = services.find((s) => s.slug === slug);
  if (!page || !meta) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: page.title,
    description: page.metaDescription,
    provider: { "@type": "Organization", name: site.name },
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, faqLd]) }} />

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
            <div className="divide-y divide-rule border-y border-rule">
              {page.faqs.map((faq) => (
                <details key={faq.q} className="group py-6">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg tracking-tight [&::-webkit-details-marker]:hidden">
                    {faq.q}
                    <span className="t-label transition-transform duration-300 group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </summary>
                  <p className="t-body mt-4 max-w-2xl">{faq.a}</p>
                </details>
              ))}
            </div>
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

      <CtaBand title={`Talk to us about ${page.title.toLowerCase()}.`} />
    </>
  );
}
