import type { Metadata } from "next";
import { InstagramButton } from "@/components/site/instagram-button";
import { site } from "@/lib/site-config";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact Agency Zero",
  description:
    "Tell Agency Zero what you need: a website, custom software or CRM, SEO, Meta ads, social media or video. Based in York, PA and working with businesses anywhere. Replies within one business day.",
  alternates: { canonical: "/contact" },
  openGraph: { url: "/contact", title: "Contact Agency Zero" },
};

const next = [
  ["I read it", "Every message comes straight to me, the person who would do the work."],
  ["I reply", "Within one business day, with questions or a suggested next step."],
  ["We talk", "A short call to understand your business before anything is proposed."],
] as const;

/**
 * The contact page is the destination of every "Let's talk" button, so the form is on screen immediately:
 * a compact header, no scroll-triggered reveals and no long hero above it.
 */
export default function ContactPage() {
  return (
    <>
      <header className="relative pb-10 pt-28 md:pb-14 md:pt-36 max-md:hidden">
        <div className="site-wrap">
          <p className="t-label mb-5 flex items-center gap-4">
            <span className="inline-block size-1.5 rounded-full bg-bone" aria-hidden />
            Contact
          </p>
          <h1 className="t-display !text-[clamp(2.8rem,6vw,5.5rem)]">Let&apos;s talk.</h1>
          <p className="t-lead mt-5 max-w-xl">
            Tell me what you&apos;re working on. A few details are enough to start, and I reply within one business day.
          </p>
        </div>
      </header>

      <section className="border-t border-rule py-12 max-md:border-0 max-md:py-0 md:py-16">
        <div className="site-wrap grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h1 className="sr-only md:hidden">Contact Agency Zero</h1>
            <ContactForm />
          </div>

          <aside className="max-md:hidden lg:col-span-4 lg:col-start-9">
            <p className="t-label">Prefer email?</p>
            <a href={`mailto:${site.email}?subject=${encodeURIComponent("Website inquiry")}`} className="u-link t-title mt-4 inline-block break-all !text-[clamp(1.2rem,2vw,1.7rem)]">
              {site.email}
            </a>
            <div className="mt-6">
              <InstagramButton />
            </div>

            <p className="t-label mt-14">Where I work</p>
            <p className="t-body mt-4 !text-[0.95rem]">
              Based in the York, PA area and available for in-person work across the region. Most services, including websites, software, SEO and ads, are
              delivered remotely, so your location rarely matters.
            </p>

            <p className="t-label mt-14">What happens next</p>
            <ol className="mt-6 divide-y divide-rule border-y border-rule">
              {next.map(([title, body], i) => (
                <li key={title} className="flex gap-5 py-5">
                  <span className="t-label pt-1">0{i + 1}</span>
                  <div>
                    <p className="font-medium">{title}</p>
                    <p className="t-body mt-1 !text-[0.9rem]">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </section>
    </>
  );
}
