import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import { siteGraph, siteUrl } from "@/lib/seo";
import { site } from "@/lib/site-config";

const title = "Agency Zero — Web Design, Custom Software & SEO in York, PA";
const description =
  "Agency Zero is a York, PA digital agency: custom software and CRMs, website design, SEO, Meta ads, social media management and video. One person, the whole job. Serving York County and Central Pennsylvania.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: "%s | Agency Zero" },
  description,
  applicationName: site.name,
  authors: [{ name: site.owner, url: `${siteUrl}/about` }],
  creator: site.owner,
  publisher: site.name,
  category: "Digital marketing and software development",
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_US",
    title,
    description: "Custom software, website design, SEO, Meta ads, social media and video for York, PA businesses, built as one system.",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Agency Zero: software, website design, SEO and content in York, PA" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: "Custom software, website design, SEO, Meta ads and content for York, PA businesses.",
    images: ["/og.jpg"],
  },
  // Geo hints (low weight, harmless). No coordinates or street address are published.
  other: { "geo.region": "US-PA", "geo.placename": "York, Pennsylvania" },
  // Set these env vars after claiming the site in Search Console / Bing Webmaster Tools.
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } : undefined,
  },
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
        <style>{`.reveal{opacity:1!important;transform:none!important}.fx-word,.fx-inner{opacity:1!important;transform:none!important;filter:none!important}.menu-item{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteGraph) }} />
      <div className="site-texture" aria-hidden />
      <div className="scroll-progress" aria-hidden />
      <SiteNav />
      <main id="main">{children}</main>
      <SiteFooter />
    </div>
  );
}
