import Link from "next/link";
import { BrowserGallery } from "../browser-gallery";
import { DotField } from "../dot-field";
import { Photo } from "../photo";
import { Reveal } from "../reveal";
import { Section, SectionHeading } from "../section";

/** Four small, specific pieces of evidence about *how* the sites are built — each with its own visual. */
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
          eyebrow="02 — Websites"
          title="A website is the first thing your customers judge."
          lead="You are looking at the standard we build to. Every site is designed and engineered from scratch for the business behind it — these are five concept directions, each with its own look, structure and job to do."
        />

        <Reveal className="mt-16 md:mt-24">
          <BrowserGallery />
        </Reveal>

        {/* responsive proof */}
        <Reveal className="mt-24 md:mt-36">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="t-label">Every screen</p>
              <h3 className="t-title mt-6 max-w-[14ch]">Designed once. Right everywhere.</h3>
              <p className="t-body mt-6 max-w-sm">
                We design the phone layout first, then scale up — so nothing is a squeezed-down desktop page. Tap targets, type
                sizes and image crops are chosen per breakpoint.
              </p>
              <Link href="/services/websites" className="btn mt-10">
                How we build sites <span className="arrow" aria-hidden>→</span>
              </Link>
            </div>
            <div className="lg:col-span-8">
              <Photo
                src="/images/mockups/devices.jpg"
                alt="A concept website shown on a laptop, a tablet and a phone"
                width={2000}
                height={1250}
                className="w-full border border-rule"
              />
            </div>
          </div>
        </Reveal>

        {/* how it's built */}
        <div className="mt-24 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
          <Detail
            index="01 · Design system"
            title="Type, colour and spacing decided once"
            delay={0}
            visual={
              <div className="flex h-full items-end justify-between">
                <div>
                  <p className="text-5xl font-semibold leading-none tracking-tighter">Aa</p>
                  <p className="t-label mt-3 !text-[0.6rem]">Display · 600</p>
                </div>
                <div className="flex gap-1.5">
                  {["#000", "#1a1a1a", "#7c7c7c", "#b3b3b3", "#f4f4f2"].map((c) => (
                    <span key={c} className="size-7 border border-rule-strong" style={{ background: c }} />
                  ))}
                </div>
              </div>
            }
          >
            A small set of tokens keeps every page consistent, and makes later changes a one-line edit.
          </Detail>

          <Detail
            index="02 · Speed"
            title="A performance budget from day one"
            delay={70}
            visual={
              <div className="flex h-full flex-col justify-center gap-3">
                {[
                  ["Images", "optimised + lazy", "78%"],
                  ["JavaScript", "kept lean", "58%"],
                  ["Layout shift", "reserved space", "92%"],
                ].map(([label, note, w]) => (
                  <div key={label}>
                    <div className="flex justify-between font-mono text-[0.6rem] uppercase tracking-[0.14em] text-ash">
                      <span>{label}</span>
                      <span>{note}</span>
                    </div>
                    <div className="mt-1.5 h-1 bg-rule">
                      <div className="h-full bg-bone" style={{ width: w }} />
                    </div>
                  </div>
                ))}
              </div>
            }
          >
            We set targets for loading, stability and weight, then test against them before launch. (Illustrative bars, not a score.)
          </Detail>

          <Detail
            index="03 · Accessibility"
            title="Usable by everyone, on any input"
            delay={140}
            visual={
              <div className="flex h-full flex-col justify-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="border-2 border-bone px-3 py-1.5 text-sm outline outline-2 outline-offset-4 outline-bone/50">Focus ring</span>
                  <span className="t-label !text-[0.6rem]">Keyboard</span>
                </div>
                <div className="flex gap-2 font-mono text-[0.65rem] uppercase tracking-[0.12em]">
                  <span className="border border-rule-strong px-2 py-1">Contrast AA</span>
                  <span className="border border-rule-strong px-2 py-1">Alt text</span>
                  <span className="border border-rule-strong px-2 py-1">Reduced motion</span>
                </div>
              </div>
            }
          >
            Visible focus, readable contrast, real labels and reduced-motion support are part of the build, not an afterthought.
          </Detail>

          <Detail
            index="04 · Search foundations"
            title="Structured so search engines understand it"
            delay={210}
            visual={
              <pre className="h-full overflow-hidden font-mono text-[0.62rem] leading-[1.55] text-mist">
{`<title>Emergency plumber — Northline</title>
<meta name="description" content="…">
<script type="application/ld+json">
{ "@type": "LocalBusiness",
  "name": "Northline", … }
</script>`}
              </pre>
            }
          >
            Titles, headings, structured data and sitemaps are written in as the site is built.
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
