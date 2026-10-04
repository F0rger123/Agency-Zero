import type { Metadata } from "next";
import { BarsDivider } from "@/components/site/bars-divider";
import { CrewbossCaseStudy } from "@/components/site/crewboss-case-study";
import { DotField } from "@/components/site/dot-field";
import { GlassCarousel } from "@/components/site/glass-carousel";
import { LensCarousel } from "@/components/site/lens-carousel";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";
import { CtaSection } from "@/components/site/sections/cta-section";
import { TextEffect } from "@/components/site/text-effect";
import { webConcepts } from "@/content/concepts";
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
          </Reveal>
          <h2 className="t-display mt-6 max-w-[18ch]">
            <TextEffect text="Five businesses, five different websites." effect="blur" className="block" />
          </h2>
          <Reveal delay={100}>
            <p className="t-lead mt-8 max-w-xl">
              Each concept is designed around what that business needs visitors to do: call, book, enquire or join. None of them is a
              template.
            </p>
          </Reveal>
          <Reveal className="mt-10 md:mt-16">
            <LensCarousel
              label="Concept website designs"
              items={webConcepts.map((concept) => ({
                src: concept.src,
                alt: concept.alt,
                title: concept.name,
                kind: concept.kind,
                tag: concept.concept ? "Concept" : undefined,
              }))}
            />
          </Reveal>
        </div>
      </section>

      <section id="content" className="relative overflow-hidden border-t border-rule bg-coal py-24 md:py-36">
        <div className="site-wrap">
          <Reveal>
            <p className="t-label">Concept · Video and ads</p>
          </Reveal>
          <h2 className="t-display mt-6 max-w-[18ch]">
            <TextEffect text="Short videos and ads that bring in customers." effect="words" className="block" />
          </h2>
          <Reveal delay={100}>
            <p className="t-lead mt-8 max-w-xl">
              Concept short videos for Instagram and Facebook, and Meta ads designed to get people to book, register or message.
            </p>
          </Reveal>
          <Reveal className="mt-10 md:mt-16">
            <GlassCarousel
              label="Concept short-form video and Meta ad creative"
              aspect="4/5"
              seconds={55}
              items={[...contentReel, ...adCreative].map((media) => ({
                src: media.image ?? "",
                alt: media.caption,
                title: media.label,
                kind: media.caption,
                width: media.ratio === "2/3" ? 1200 : 1500,
                height: media.ratio === "2/3" ? 1800 : 1875,
                tag: "Concept",
              }))}
            />
          </Reveal>
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
