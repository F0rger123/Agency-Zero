import type { Metadata } from "next";
import { BarsDivider } from "@/components/site/bars-divider";
import { BrowserGallery } from "@/components/site/browser-gallery";
import { CrewbossCaseStudy } from "@/components/site/crewboss-case-study";
import { DotField } from "@/components/site/dot-field";
import { MediaFrame } from "@/components/site/media-frame";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";
import { TypedText } from "@/components/site/typed-text";
import { CtaSection } from "@/components/site/sections/cta-section";
import { adCreative, contentReel } from "@/content/media";

export const metadata: Metadata = {
  title: "Work",
  description: "Selected Agency Zero work: the CrewBoss CRM, plus concept website designs, short-form video and Meta ad creative.",
  alternates: { canonical: "/work" },
};

export default function WorkPage() {
  return (
    <>
      <div className="relative">
        <DotField />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,transparent_20%,#000_85%)]" aria-hidden />
        <PageHero
          eyebrow="Work"
          title="Proof beats promises."
          lead="A live product I built, then concept designs that show how I would approach websites, video and ads for other kinds of business."
        />
      </div>

      <CrewbossCaseStudy />

      <BarsDivider />

      <section id="websites" className="relative overflow-hidden border-t border-rule py-24 md:py-36">
        <div className="site-wrap">
          <Reveal>
            <p className="t-label">Concept · Website design</p>
            <h2 className="t-display mt-6 max-w-[18ch]"><TypedText text="Five businesses, five different websites." className="block" speed={24} /></h2>
            <p className="t-lead mt-8 max-w-xl">
              Each concept is designed around what that business needs visitors to do: call, book, enquire or join. None of them is a
              template.
            </p>
          </Reveal>
          <Reveal className="mt-16 md:mt-24">
            <BrowserGallery />
          </Reveal>
        </div>
      </section>

      <section id="content" className="border-t border-rule bg-coal py-24 md:py-36">
        <div className="site-wrap">
          <Reveal>
            <p className="t-label">Concept · Video and ads</p>
            <h2 className="t-display mt-6 max-w-[18ch]"><TypedText text="Content and ads that look like the brand." className="block" speed={24} /></h2>
            <p className="t-lead mt-8 max-w-xl">
              Short-form video for Instagram and Facebook Reels, and Meta ads with the offer, hook and call to action planned first.
            </p>
          </Reveal>

          <div className="mt-16 grid grid-cols-3 gap-3 md:mt-24 md:gap-6">
            {contentReel.map((media, i) => (
              <Reveal key={media.caption} delay={i * 120} className={i === 1 ? "mt-8 md:mt-16" : i === 2 ? "mt-4 md:mt-8" : ""}>
                <MediaFrame media={media} />
              </Reveal>
            ))}
          </div>

          <div className="mx-auto mt-20 grid max-w-3xl grid-cols-2 gap-4 md:mt-28 md:gap-8">
            {adCreative.map((media, i) => (
              <Reveal key={media.caption} delay={i * 120} className={i === 1 ? "mt-8 md:mt-14" : ""}>
                <MediaFrame media={media} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaSection
        line1="Your project could be next."
        line2="Let's make it"
        word="count."
        secondary={{ href: "/services", label: "or see what I offer" }}
      />
    </>
  );
}
