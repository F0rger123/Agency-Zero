import type { Metadata } from "next";
import { CtaBand } from "@/components/site/cta-band";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";

export const metadata: Metadata = {
  title: "About",
  description:
    "Agency Zero is a studio that builds software, websites and marketing as one system for businesses that want to be taken seriously.",
  alternates: { canonical: "/about" },
};

const principles = [
  ["One system, not six vendors", "Software, site, search, ads and content designed to work together."],
  ["Craft over volume", "We take fewer projects and make each one properly."],
  ["Honest by default", "No guaranteed rankings, no invented numbers, no jargon to hide behind."],
  ["Built to be owned", "Clear handover, documentation and no unnecessary lock-in."],
] as const;

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="A studio for the systems behind better businesses."
        lead="Agency Zero builds custom software, premium websites and the marketing around them — so a business can run on tools that fit it and be found by the people looking for it."
      />

      <section className="border-t border-rule py-24 md:py-32">
        <div className="site-wrap grid gap-16 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <p className="t-label">Why Agency Zero</p>
          </Reveal>
          <Reveal delay={100} className="space-y-6 lg:col-span-7">
            <p className="t-title !text-[clamp(1.5rem,2.4vw,2.4rem)] max-w-[28ch]">
              Most agencies sell one thing. Most software vendors sell a product. We do the work that sits between them.
            </p>
            <p className="t-body max-w-xl">
              A business needs a place to run its operations, a presence people trust, and a steady way to be discovered.
              Those are normally three separate suppliers who never talk to each other. We build all three and keep them
              consistent — the same standard in the CRM as on the homepage.
            </p>
            <p className="t-body max-w-xl">
              {/* TODO(content): replace with the real founder/team story, location and background. */}
              Agency Zero is run by a small, senior team. You work directly with the people doing the work.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-rule bg-coal py-24 md:py-32">
        <div className="site-wrap">
          <Reveal>
            <p className="t-label">How we work</p>
          </Reveal>
          <dl className="mt-10 grid gap-px border border-rule bg-rule md:grid-cols-2">
            {principles.map(([title, body], i) => (
              <Reveal key={title} delay={i * 70} className="bg-coal p-8 md:p-10">
                <p className="t-label">0{i + 1}</p>
                <dt className="t-title mt-10 !text-[1.8rem]">{title}</dt>
                <dd className="t-body mt-4 max-w-sm">{body}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      <CtaBand title="Let's build something properly." />
    </>
  );
}
