import Link from "next/link";
import { adCreative, contentReel } from "@/content/media";
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

const pipeline = [
  ["01", "Concept", "Angles and hooks built from what your customers actually ask."],
  ["02", "Script", "Short, specific scripts and shot lists — nothing improvised on the day."],
  ["03", "Shoot", "One planned session captures weeks of footage and stills."],
  ["04", "Edit", "Cut, captioned and formatted for each platform, with a review step."],
  ["05", "Publish", "Scheduled organic posts and ad-ready cuts, on-brand every time."],
  ["06", "Learn", "What held attention gets repeated; what didn't gets dropped."],
] as const;

/** A sample month plan: purely illustrative of how organic + paid are planned together. */
const week: { day: string; items: { t: "Reel" | "Post" | "Story" | "Ad" | "Shoot"; label: string }[] }[] = [
  { day: "Mon", items: [{ t: "Reel", label: "Hook-led how-to" }] },
  { day: "Tue", items: [{ t: "Story", label: "Behind the scenes" }] },
  { day: "Wed", items: [{ t: "Post", label: "Customer question" }, { t: "Ad", label: "Offer creative" }] },
  { day: "Thu", items: [{ t: "Reel", label: "Before / after" }] },
  { day: "Fri", items: [{ t: "Story", label: "Poll" }, { t: "Ad", label: "Retargeting" }] },
  { day: "Sat", items: [{ t: "Post", label: "Team spotlight" }] },
  { day: "Sun", items: [] },
];

const callSheet = [
  ["07:30", "Load-in & lighting setup", true],
  ["08:30", "Hero shots & stills", true],
  ["10:00", "Reel 1–4: talking-head scripts", true],
  ["12:00", "Lunch + review of footage", false],
  ["13:00", "B-roll: process & location", false],
  ["15:00", "Ad creative: vertical + square", false],
  ["16:30", "Wrap & backup", false],
] as const;

export function ContentSection() {
  return (
    <Section id="content" className="bg-coal">
      <div className="site-wrap">
        {/* intro + reels */}
        <div className="grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeading
              className="!grid-cols-1 !gap-6"
              eyebrow="04–06 — Ads, social & content"
              title="Attention, produced properly."
              lead="Paid and organic work best when they share one creative engine. I plan, shoot, edit, publish and measure it as a single pipeline — so every channel has something worth saying."
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

          <div className="lg:col-span-7">
            <div className="grid grid-cols-3 gap-3 md:gap-5">
              {contentReel.map((media, i) => (
                <Reveal key={media.caption} delay={i * 120} className={i === 1 ? "mt-8 md:mt-14" : i === 2 ? "mt-3 md:mt-6" : ""}>
                  <MediaFrame media={media} />
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        {/* ads */}
        <div className="mt-28 grid items-center gap-12 border-t border-rule pt-24 lg:grid-cols-12">
          <Reveal className="order-2 grid grid-cols-2 gap-4 md:gap-6 lg:order-1 lg:col-span-7">
            {adCreative.map((media, i) => (
              <div key={media.caption} className={i === 1 ? "mt-8 md:mt-14" : ""}>
                <MediaFrame media={media} />
              </div>
            ))}
          </Reveal>
          <div className="order-1 lg:order-2 lg:col-span-5">
            <Reveal>
              <p className="t-label">Paid social</p>
              <h3 className="t-title mt-6 max-w-[16ch]">Ads that look like they belong to your brand.</h3>
              <p className="t-body mt-6 max-w-md">
                Static, carousel and short-form creative designed for the feed, with the offer, hook and call to action planned
                before anything is produced. Then tested, measured and refreshed.
              </p>
            </Reveal>
            <ul className="mt-8 grid grid-cols-2 gap-px border border-rule bg-rule text-sm">
              {["Hook & offer", "Creative variants", "Pixel & tracking", "Weekly learning"].map((t, i) => (
                <Reveal key={t} as="li" delay={i * 60} className="bg-coal px-4 py-4">
                  <span className="t-label mr-3">0{i + 1}</span>
                  {t}
                </Reveal>
              ))}
            </ul>
          </div>
        </div>

        {/* pipeline */}
        <div className="mt-28 border-t border-rule pt-24">
          <Reveal>
            <p className="t-label">The pipeline</p>
            <h3 className="t-title mt-6 max-w-[22ch]">From idea to published — one organised process.</h3>
          </Reveal>
          <ol className="mt-12 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-6">
            {pipeline.map(([n, title, body], i) => (
              <Reveal as="li" key={n} delay={i * 60} className="bg-coal p-6">
                <p className="t-label">{n}</p>
                <p className="mt-8 text-lg tracking-tight">{title}</p>
                <p className="t-body mt-2 !text-[0.85rem] !leading-6">{body}</p>
              </Reveal>
            ))}
          </ol>
        </div>

        {/* calendar + call sheet */}
        <div className="mt-24 grid gap-5 lg:grid-cols-12">
          <Reveal className="border border-rule-strong bg-ink lg:col-span-8">
            <div className="flex items-center justify-between border-b border-rule px-5 py-3">
              <p className="t-label">Sample content week</p>
              <p className="t-label !text-[0.6rem]">Organic + paid, planned together</p>
            </div>
            <div className="grid grid-cols-7 divide-x divide-rule">
              {week.map((d) => (
                <div key={d.day} className="min-h-44 p-2.5 md:p-3">
                  <p className="t-label !text-[0.6rem]">{d.day}</p>
                  <div className="mt-3 space-y-2">
                    {d.items.map((item) => (
                      <div key={item.label} className={`border px-2 py-2 ${item.t === "Ad" ? "border-bone/70 bg-bone text-ink" : "border-rule-strong"}`}>
                        <p className={`font-mono text-[0.55rem] uppercase tracking-[0.14em] ${item.t === "Ad" ? "text-ink/70" : "text-ash"}`}>{item.t}</p>
                        <p className="mt-1 hidden text-[0.72rem] leading-4 md:block">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={120} className="border border-rule-strong bg-ink lg:col-span-4">
            <div className="border-b border-rule px-5 py-3">
              <p className="t-label">Shoot-day call sheet</p>
            </div>
            <ul className="divide-y divide-rule">
              {callSheet.map(([time, task, done]) => (
                <li key={time} className="flex items-center gap-4 px-5 py-3 text-sm">
                  <span className="font-mono text-[0.7rem] text-ash">{time}</span>
                  <span className={`flex-1 ${done ? "text-bone" : "text-mist"}`}>{task}</span>
                  <span className={`grid size-4 place-items-center border text-[0.6rem] ${done ? "border-bone bg-bone text-ink" : "border-rule-strong"}`} aria-hidden>
                    {done ? "✓" : ""}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal className="mt-12">
          <Link href="/services/content" className="btn">
            Video &amp; content <span className="arrow" aria-hidden>→</span>
          </Link>
        </Reveal>
      </div>
    </Section>
  );
}
