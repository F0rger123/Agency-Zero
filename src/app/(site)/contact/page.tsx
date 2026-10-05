import type { Metadata } from "next";
import { InstagramButton } from "@/components/site/instagram-button";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";
import { site } from "@/lib/site-config";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact a York, PA Web Designer",
  description:
    "Get in touch with Agency Zero in York, PA. Tell me about your business and goals, whether that is a website, custom software, SEO, social media or Meta ads, and I'll reply within one working day.",
  alternates: { canonical: "/contact" },
};

const next = [
  ["I read it", "Every inquiry is read by me, the person who would do the work."],
  ["I reply", "Within one working day, with questions or a suggested next step."],
  ["I talk", "A short call to understand the business before anything is proposed."],
] as const;

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Tell me what you're building."
        lead="A few details are enough to start. No sales script — just a conversation about whether and how I can help."
      />

      <section className="border-t border-rule py-20 md:py-28">
        <div className="site-wrap grid gap-20 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <ContactForm />
          </Reveal>

          <aside className="lg:col-span-4 lg:col-start-9">
            <Reveal delay={100}>
              <p className="t-label">Prefer email?</p>
              <a href={`mailto:${site.email}?subject=${encodeURIComponent("Website inquiry")}`} className="u-link t-title mt-4 inline-block break-all !text-[clamp(1.2rem,2vw,1.7rem)]">
                {site.email}
              </a>
              <div className="mt-6">
                <InstagramButton />
              </div>
            </Reveal>

            <Reveal delay={180}>
              <p className="t-label mt-16">What happens next</p>
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
            </Reveal>
          </aside>
        </div>
      </section>
    </>
  );
}
