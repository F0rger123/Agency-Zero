import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import { site } from "@/lib/site-config";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://agencyzero.com"),
  title: {
    default: "Agency Zero — Software, websites, search & content",
    template: "%s — Agency Zero",
  },
  description:
    "Agency Zero builds custom software and CRMs, premium websites, SEO, Meta ads, social media and video content for businesses that want better systems and a stronger presence.",
  openGraph: {
    type: "website",
    siteName: site.name,
    title: "Agency Zero — Software, websites, search & content",
    description: "Custom software, websites, SEO, paid media and content — built as one system.",
  },
  twitter: { card: "summary_large_image" },
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
      <SiteNav />
      <main id="main">{children}</main>
      <SiteFooter />
    </div>
  );
}
