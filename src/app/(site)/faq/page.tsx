import type { Metadata } from "next";
import { CtaBand } from "@/components/site/cta-band";
import { Faq } from "@/components/site/faq";
import { PageHero } from "@/components/site/page-hero";
import { siteFaqs } from "@/content/local-seo";
import { breadcrumbJsonLd, faqJsonLd, webPageJsonLd } from "@/lib/seo";

const description =
  "Answers about Agency Zero: web design, custom software and CRMs, SEO, AEO, Meta ads and social media for small businesses in York, PA and Central Pennsylvania.";

export const metadata: Metadata = {
  title: "FAQ: Web Design, SEO & Software, York PA",
  description,
  alternates: { canonical: "/faq" },
  openGraph: { title: "Agency Zero FAQ", description, url: "/faq" },
};

export default function FaqPage() {
  const all = siteFaqs.flatMap((group) => group.items);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            webPageJsonLd("/faq", "Agency Zero FAQ", description),
            faqJsonLd(all),
            breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "FAQ", path: "/faq" }]),
          ]),
        }}
      />

      <PageHero
        eyebrow="Questions"
        title="Straight answers."
        lead="What Agency Zero does, who it is for, where it works and what it costs, answered plainly."
      />

      {siteFaqs.map((group) => (
        <section key={group.group} className="border-t border-rule py-16 md:py-24">
          <div className="site-wrap grid gap-12 lg:grid-cols-12">
            <h2 className="t-label lg:col-span-4">{group.group}</h2>
            <div className="lg:col-span-8">
              <Faq items={group.items} />
            </div>
          </div>
        </section>
      ))}

      <CtaBand title="Still have a question? Ask me directly." />
    </>
  );
}
