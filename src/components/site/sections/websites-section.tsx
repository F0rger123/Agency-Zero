import Link from "next/link";
import { LensCarousel } from "../lens-carousel";
import { webConcepts } from "@/content/concepts";
import { DotField } from "../dot-field";
import { Photo } from "../photo";
import { Reveal } from "../reveal";
import { Section, SectionHeading } from "../section";

/** Four plain-language reasons a site built this way works better — each with a simple visual. */
function Detail({ index, title, children, visual, delay }: { index: string; title: string; children: React.ReactNode; visual: React.ReactNode; delay: number }) {
  return (
    <Reveal delay={delay} className="flex flex-col bg-ink">
      <div className="h-40 border-b border-rule p-5">{visual}</div>
      <div className="flex-1 p-6">
        <p className="t-label">{index}</p>
        <p className="mt-4 font-medium">{title}</p>
        <p className="t-body mt-2 !text-[0.88rem] !leading-6">{children}</p>
      </div>
    </Reveal>
  );
}

export function WebsitesSection() {
  return (
    <Section id="websites" className="overflow-hidden bg-ink">
      <DotField />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,#000_80%)]" aria-hidden />
      <div className="site-wrap relative">
        <SectionHeading
          effect="blur"
          eyebrow="02 — Website design"
          title="A website is the first thing your customers judge."
          lead="Every site is designed and built from scratch for the business behind it, never from a template. These are five concept designs for different kinds of business. Each has its own look and its own job: more calls, more bookings, more inquiries."
        />

        <Reveal className="mt-12 md:mt-20">
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

        {/* responsive proof */}
        <Reveal className="mt-24 md:mt-36">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="t-label">Phone, tablet and laptop</p>
              <h3 className="t-title mt-6 max-w-[14ch]">One site. Works on every screen.</h3>
              <p className="t-body mt-6 max-w-sm">
                Most visitors find you on their phone, so I design the phone version first and then scale up. Text stays easy to
                read, buttons are easy to tap, and nothing looks like a squashed desktop page.
              </p>
              <Link href="/services/websites" className="btn mt-10">
                See website design <span className="arrow" aria-hidden>→</span>
              </Link>
            </div>
            <div className="lg:col-span-8">
              <Photo
                src="/images/mockups/devices.jpg"
                alt="The same concept website designed for a laptop, a tablet and a phone"
                width={2070}
                height={1150}
                className="w-full border border-rule"
              />
            </div>
          </div>
        </Reveal>

        {/* why it works: plain language, simple visuals */}
        <div className="mt-24 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
          <Detail
            index="Looks right everywhere"
            title="Easy to use on a phone"
            delay={0}
            visual={
              <div className="flex h-full items-end justify-center gap-4">
                <div className="h-full w-24 border border-rule-strong p-2"><div className="h-2 w-10 bg-bone/70" /><div className="mt-2 h-1.5 w-full bg-bone/25" /><div className="mt-1 h-1.5 w-3/4 bg-bone/25" /><div className="mt-3 h-6 w-full bg-bone/80" /></div>
                <div className="h-4/5 w-12 border border-rule-strong p-1.5"><div className="h-1.5 w-6 bg-bone/70" /><div className="mt-2 h-1 w-full bg-bone/25" /><div className="mt-3 h-4 w-full bg-bone/80" /></div>
              </div>
            }
          >
            Your site is laid out separately for phones, tablets and computers, so it is never fiddly to read or tap.
          </Detail>

          <Detail
            index="Loads quickly"
            title="No waiting around"
            delay={70}
            visual={
              <div className="flex h-full flex-col justify-center gap-3">
                <div className="flex items-center justify-between font-mono text-[0.65rem] uppercase tracking-[0.14em] text-ash">
                  <span>Page loading</span>
                  <span className="text-bone">Done</span>
                </div>
                <div className="h-1.5 bg-rule"><div className="h-full w-full bg-bone" /></div>
                <p className="text-sm text-mist">Images are sized and compressed so pages open fast, even on mobile data.</p>
              </div>
            }
          >
            Slow sites lose visitors before they read a word. I keep pages light and test them before launch.
          </Detail>

          <Detail
            index="Easy for everyone"
            title="Readable and simple to navigate"
            delay={140}
            visual={
              <div className="flex h-full flex-col justify-center gap-3">
                <p className="text-xl font-medium tracking-tight">Clear, readable text</p>
                <span className="inline-block w-fit border-2 border-bone px-4 py-2 text-sm font-medium">Large, obvious buttons</span>
              </div>
            }
          >
            Good contrast, large text and clear buttons make the site comfortable for everyone, including people with poor eyesight.
          </Detail>

          <Detail
            index="Easy to find on Google"
            title="Set up for search from day one"
            delay={210}
            visual={
              <ul className="flex h-full flex-col justify-center gap-2.5 text-sm">
                {["Clear page titles", "Short descriptions people want to click", "Address, hours and map included", "Quick to load on a phone"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-mist">
                    <span className="grid size-4 shrink-0 place-items-center border border-bone/60 text-[0.55rem] text-bone" aria-hidden>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            }
          >
            Every page is written and built so Google can show your business properly when people search for what you do.
          </Detail>
        </div>

        <Reveal className="mt-12">
          <Link href="/services/websites" className="btn btn-solid">
            Website design &amp; build <span className="arrow" aria-hidden>→</span>
          </Link>
        </Reveal>
      </div>
    </Section>
  );
}
