import Link from "next/link";
import { contentReel } from "@/content/media";
import { MediaFrame } from "../media-frame";
import { Reveal } from "../reveal";
import { Section, SectionHeading } from "../section";

const channels = [
  ["Meta ads", "/services/meta-ads"],
  ["Organic social", "/services/social"],
  ["Video", "/services/content"],
  ["Short-form content", "/services/content"],
  ["Campaign creative", "/services/content"],
] as const;

export function ContentSection() {
  return (
    <Section id="content" className="bg-coal">
      <div className="site-wrap grid gap-16 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHeading
            className="!grid-cols-1 !gap-6"
            eyebrow="04–06 — Ads, social & content"
            title="Attention, produced properly."
            lead="Paid and organic work best when they share the same creative engine. We plan, shoot, edit, publish and measure it as one pipeline."
          />
          <ul className="mt-12 divide-y divide-rule border-y border-rule">
            {channels.map(([label, href], i) => (
              <Reveal key={label} as="li" delay={i * 60}>
                <Link href={href} className="group flex items-center justify-between py-4">
                  <span className="text-lg tracking-tight">{label}</span>
                  <span className="t-label transition-transform duration-500 group-hover:translate-x-1">→</span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-7 lg:self-center">
          <div className="grid grid-cols-3 gap-3 md:gap-5">
            {contentReel.map((media, i) => (
              <Reveal key={media.caption} delay={i * 120} className={i === 1 ? "mt-10 md:mt-16" : ""}>
                <MediaFrame media={media} />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
