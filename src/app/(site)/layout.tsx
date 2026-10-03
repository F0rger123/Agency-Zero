import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import { site } from "@/lib/site-config";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://agencyzero.com"),
  title: {
    default: "Agency Zero — Software, website design, search & content",
    template: "%s — Agency Zero",
  },
  description:
    "Agency Zero builds custom software and CRMs, premium website design, SEO, Meta ads, social media and video content for businesses that want better systems and a stronger presence.",
  applicationName: site.name,
  authors: [{ name: site.owner }],
  creator: site.owner,
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_GB",
    title: "Agency Zero — Software, website design, search & content",
    description: "Custom software, website design, SEO, paid media and content — built as one system.",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Agency Zero — software, website design, search and content" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Agency Zero — Software, website design, search & content",
    description: "Custom software, website design, SEO, paid media and content — built as one system.",
    images: ["/og.jpg"],
  },
};

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://agencyzero.com").replace(/\/$/, "");

/** Site-wide structured data: the business, its owner and the website. Only facts that are on the pages. */
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ProfessionalService",
      "@id": `${siteUrl}/#business`,
      name: site.name,
      url: siteUrl,
      image: `${siteUrl}/og.jpg`,
      email: site.email,
      description:
        "Custom software and CRMs, website design, SEO, Meta ads, social media and video content for businesses.",
      founder: { "@id": `${siteUrl}/#owner` },
      sameAs: [site.instagram],
      knowsAbout: ["Custom software", "CRM development", "Website design", "Search engine optimisation", "Meta advertising", "Social media content"],
    },
    {
      "@type": "Person",
      "@id": `${siteUrl}/#owner`,
      name: site.owner,
      jobTitle: "Founder",
      worksFor: { "@id": `${siteUrl}/#business` },
      url: `${siteUrl}/about`,
      sameAs: [site.instagram],
    },
    { "@type": "WebSite", "@id": `${siteUrl}/#website`, url: siteUrl, name: site.name, publisher: { "@id": `${siteUrl}/#business` } },
  ],
};

export const viewport: Viewport = { themeColor: "#000000", colorScheme: "dark" };

/** Public marketing site shell. Everything inside is the dark "site" design system. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`site grain ${GeistSans.variable} ${GeistMono.variable} min-h-screen`}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:bg-bone focus:px-4 focus:py-2 focus:text-ink"
      >
        Skip to content
      </a>
      <noscript>
        <style>{`.reveal{opacity:1!important;transform:none!important}.typed-full::before{visibility:visible!important}.typed-live{display:none}.menu-item{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <div className="scroll-progress" aria-hidden />
      <SiteNav />
      <main id="main">{children}</main>
      <SiteFooter />
    </div>
  );
}
