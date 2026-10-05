import type { FaqItem } from "@/components/site/faq";
import seoData from "@/content/seo-data.json";
import { services, site } from "@/lib/site-config";

/**
 * Public origin. Defaults to the production domain; NEXT_PUBLIC_SITE_URL (a BUILD-time variable) overrides it, e.g. for a
 * local build. Because canonicals always point at the real domain, a workers.dev address never competes with it.
 */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://theagencyzero.com").replace(/\/$/, "");

export const home = seoData.home;
export const areas = seoData.areas;
export const regions = seoData.regions;

/** "York, PA" style label for an area. */
export const areaLabel = (area: (typeof areas)[number]) => `${area.name}, ${"state" in area ? area.state : "PA"}`;

/** Areas grouped by county, York County first. */
export function areasByCounty() {
  const groups = new Map<string, (typeof areas)[number][]>();
  for (const area of areas) {
    const list = groups.get(area.county) ?? [];
    list.push(area);
    groups.set(area.county, list);
  }
  return [...groups.entries()].sort(([a], [b]) => (a === "York County" ? -1 : b === "York County" ? 1 : a.localeCompare(b)));
}

export const absolute = (path: string) => `${siteUrl}${path === "/" ? "" : path}`;

/** schema.org FAQPage for a list of visible Q&As (the same text that is rendered on the page). */
export function faqJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.bullets?.length ? `${item.a} ${item.bullets.join(". ")}.` : item.a },
    })),
  };
}

export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((step, index) => ({ "@type": "ListItem", position: index + 1, name: step.name, item: absolute(step.path) })),
  };
}

/** WebPage node marking the quotable summary as speakable (voice assistants, answer engines). */
export function webPageJsonLd(path: string, name: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${absolute(path)}#webpage`,
    url: absolute(path),
    name,
    description,
    isPartOf: { "@id": `${siteUrl}/#website` },
    about: { "@id": `${siteUrl}/#business` },
    inLanguage: "en-US",
    speakable: { "@type": "SpeakableSpecification", cssSelector: [".speakable"] },
  };
}

const placeNodes = areas
  .filter((area) => area.tier <= 3)
  .map((area) => ({
    "@type": "City",
    name: area.name,
    containedInPlace: { "@type": "AdministrativeArea", name: area.county },
  }));

/** Site-wide business graph. Facts only: no street address, phone, rating or review markup is invented. */
export const siteGraph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["ProfessionalService", "LocalBusiness"],
      "@id": `${siteUrl}/#business`,
      name: site.name,
      alternateName: ["Agency Zero York PA", "Agency Zer0", "AgencyZero", "The Agency Zero", "theagencyzero.com"],
      disambiguatingDescription:
        "Agency Zero (theagencyzero.com) is the York, Pennsylvania marketing, web design and custom software agency run by Luke Knight.",
      url: siteUrl,
      image: `${siteUrl}/og.jpg`,
      logo: { "@type": "ImageObject", url: `${siteUrl}/logo.png`, width: 512, height: 512 },
      email: site.email,
      description:
        "Agency Zero is a York, PA agency run by Luke Knight: custom software and CRMs, websites, SEO and AI-search optimization, Meta ads, social media management and video content. Available in person around York and delivered remotely for businesses anywhere.",
      slogan: "Software, websites and marketing behind better businesses.",
      founder: { "@id": `${siteUrl}/#owner` },
      address: { "@type": "PostalAddress", addressLocality: home.city, addressRegion: home.stateCode, addressCountry: "US" },
      // In-person work is local (York, PA and the surrounding region); remote work is available to businesses across the US.
      areaServed: [
        { "@type": "Country", name: "United States" },
        { "@type": "State", name: home.state },
        ...placeNodes,
      ],
      contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: site.email, availableLanguage: "English", areaServed: "US" },
      sameAs: [site.instagram, ...(site.gbp ? [site.gbp] : [])],
      hasMap: site.gbp || undefined,
      knowsAbout: [
        "Custom software development", "CRM development", "Website design", "Search engine optimization", "Local SEO",
        "Answer engine optimization", "Meta advertising", "Social media management", "Video production",
      ],
      makesOffer: services.map((service) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: service.title, description: service.summary, url: absolute(`/services/${service.slug}`) },
      })),
    },
    {
      "@type": "Person",
      "@id": `${siteUrl}/#owner`,
      name: site.owner,
      jobTitle: "Founder of Agency Zero",
      worksFor: { "@id": `${siteUrl}/#business` },
      url: absolute("/about"),
      sameAs: [site.instagram],
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: site.name,
      alternateName: ["Agency Zero York PA", "theagencyzero.com"],
      inLanguage: "en-US",
      publisher: { "@id": `${siteUrl}/#business` },
    },
  ],
};
