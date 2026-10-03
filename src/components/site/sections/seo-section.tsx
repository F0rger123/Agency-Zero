import Link from "next/link";
import { Reveal } from "../reveal";
import { Section, SectionHeading } from "../section";

/**
 * Where customers look — three detailed illustrations (Google results, an AI
 * answer with citations, a local map pack) plus how the work is done.
 * Everything is HTML/CSS. Businesses shown are fictional and the layout is
 * illustrative: no rankings, ratings counts or results are claimed.
 */
function Window({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col border border-rule-strong bg-coal ${className}`}>
      <div className="flex items-center gap-2 border-b border-rule px-4 py-3">
        <span className="size-1.5 rounded-full bg-bone/30" />
        <span className="size-1.5 rounded-full bg-bone/30" />
        <span className="size-1.5 rounded-full bg-bone/30" />
        <span className="t-label ml-3">{label}</span>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

const Stars = () => <span className="tracking-[0.15em] text-bone">★★★★★</span>;

function Result({ you, url, title, snippet, extra }: { you?: boolean; url: string; title: string; snippet: string; extra?: React.ReactNode }) {
  return (
    <li className={`relative py-5 pl-5 ${you ? "" : "opacity-55"}`}>
      <span className={`absolute left-0 top-5 h-[calc(100%-2.5rem)] w-px ${you ? "bg-bone" : "bg-rule-strong"}`} aria-hidden />
      <p className="font-mono text-[0.68rem] text-ash">{url}</p>
      <p className={`mt-1.5 text-lg leading-snug tracking-tight ${you ? "text-bone underline decoration-rule-strong underline-offset-4" : "text-mist"}`}>{title}</p>
      <p className="mt-1.5 max-w-xl text-sm leading-6 text-mist">{snippet}</p>
      {extra}
      {you ? <p className="t-label mt-3 !text-bone">← Your business</p> : null}
    </li>
  );
}

const skills = [
  ["Technical audit & fixes", "Crawlability, speed, structure, broken links and errors that quietly hold a site back."],
  ["On-page optimisation", "Titles, headings, copy and internal links aligned to how people actually search."],
  ["Local SEO", "Google Business Profile, citations, reviews and location pages for “near me” searches."],
  ["Content that answers", "Pages built around real customer questions — useful to people and quotable by AI."],
  ["Authority", "Earning credible mentions and links the slow, safe way."],
  ["Reporting", "What changed, what it did, and what happens next — in plain language."],
] as const;

const flow = ["Audit", "Fix foundations", "Publish & optimise", "Build authority", "Report & refine"] as const;

export function SeoSection() {
  return (
    <Section id="seo">
      <div className="site-wrap">
        <SectionHeading
          eyebrow="03 — SEO"
          title="Be easier to find, wherever people ask."
          lead="Customers now look for a business in three places at once. We make sure yours is clear, credible and findable in all of them — and that what they find makes them get in touch."
        />

        {/* 1 + 2: Google and AI side by side */}
        <div className="mt-16 grid gap-5 md:mt-24 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <Window label="Google" className="h-full">
              <div className="p-5 md:p-7">
                <div className="flex items-center gap-3 border border-rule-strong px-4 py-3 text-[0.95rem]">
                  <span className="text-ash" aria-hidden>⌕</span>
                  <span>emergency plumber near me</span>
                  <span className="caret ml-0.5 inline-block h-4 w-px bg-bone" aria-hidden />
                </div>
                <div className="mt-4 flex flex-wrap gap-2 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-ash">
                  {["All", "Maps", "News", "Images", "Shopping"].map((tab, i) => (
                    <span key={tab} className={`border-b pb-1.5 pr-3 ${i === 0 ? "border-bone text-bone" : "border-transparent"}`}>{tab}</span>
                  ))}
                </div>

                <ul className="mt-2 divide-y divide-rule">
                  <Result
                    you
                    url="northline-plumbing.co.uk › emergency-plumber"
                    title="Emergency Plumber — Same-Day Callouts | Northline Plumbing & Heating"
                    snippet="Burst pipe or no heating? Local, licensed engineers with fixed upfront pricing. Book online in two minutes or call now."
                    extra={
                      <>
                        <p className="mt-2 text-sm"><Stars /> <span className="text-ash">· Customer reviews</span></p>
                        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-mist">
                          {["Boiler repair", "Leak detection", "Pricing", "Areas covered"].map((l) => (
                            <span key={l} className="underline decoration-rule-strong underline-offset-4">{l}</span>
                          ))}
                        </div>
                      </>
                    }
                  />
                  <Result url="aggregator-directory.com › plumbers" title="Top plumbers near you — compare quotes" snippet="Find and compare local tradespeople. Sponsored listings may appear first." />
                  <Result url="another-plumber.co.uk" title="Plumbing services | Another Plumber Ltd" snippet="Plumbing, heating and bathroom installations. Contact us for a quotation." />
                </ul>
                <p className="t-label mt-3 !text-[0.6rem]">Illustrative layout — fictional businesses</p>
              </div>
            </Window>
          </Reveal>

          <Reveal delay={100} className="lg:col-span-5">
            <Window label="AI search" className="h-full">
              <div className="space-y-5 p-5 md:p-7">
                <p className="ml-auto w-fit max-w-[85%] border border-rule-strong px-4 py-2.5 text-sm">
                  Who can fix a burst pipe tonight in Leeds?
                </p>
                <div className="space-y-3 text-[0.95rem] leading-7 text-mist">
                  <p>
                    For an out-of-hours burst pipe, look for a licensed plumber that advertises <span className="text-bone">same-day callouts</span> and
                    fixed pricing. <span className="text-bone underline decoration-rule-strong underline-offset-4">Northline Plumbing &amp; Heating</span>{" "}
                    <sup className="border border-rule-strong px-1.5 py-0.5 font-mono text-[0.6rem] text-bone">1</sup> lists emergency cover and the
                    areas it serves, and explains its pricing upfront <sup className="border border-rule-strong px-1.5 py-0.5 font-mono text-[0.6rem] text-bone">2</sup>.
                  </p>
                  <p>Turn off the stop valve first, then call a plumber while you drain the system.</p>
                </div>
                <div>
                  <p className="t-label">Sources</p>
                  <ul className="mt-3 space-y-2 font-mono text-[0.68rem]">
                    <li className="flex gap-3 border border-bone/60 px-3 py-2 text-bone"><span>1</span>northline-plumbing.co.uk/emergency-plumber</li>
                    <li className="flex gap-3 border border-rule px-3 py-2 text-ash"><span>2</span>northline-plumbing.co.uk/pricing</li>
                    <li className="flex gap-3 border border-rule px-3 py-2 text-ash"><span>3</span>watersafe.org.uk</li>
                  </ul>
                </div>
                <p className="t-label !text-[0.6rem]">Being a clear, well-structured source is what gets you cited</p>
              </div>
            </Window>
          </Reveal>
        </div>

        {/* 3: local pack, full width */}
        <Reveal delay={80} className="mt-5">
          <Window label="Maps · local discovery">
            <div className="grid md:grid-cols-12">
              <div className="relative min-h-64 border-b border-rule md:col-span-7 md:border-b-0 md:border-r">
                <svg viewBox="0 0 700 360" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
                  <rect width="700" height="360" fill="#0a0a0a" />
                  <g stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none">
                    <path d="M0 80H700M0 170H700M0 270H700M110 0V360M250 0V360M410 0V360M560 0V360" />
                  </g>
                  <g stroke="rgba(255,255,255,0.22)" strokeWidth="2" fill="none">
                    <path d="M0 330C140 260 260 300 380 190S600 90 700 40" />
                    <path d="M180 0C190 120 140 240 210 360" />
                  </g>
                  <rect x="470" y="210" width="110" height="70" fill="rgba(255,255,255,0.05)" />
                  <rect x="60" y="195" width="120" height="60" fill="rgba(255,255,255,0.04)" />
                  <g>
                    <circle cx="372" cy="196" r="22" fill="rgba(255,255,255,0.12)" />
                    <circle cx="372" cy="196" r="7" fill="#f4f4f2" />
                    <circle cx="238" cy="118" r="5" fill="#7c7c7c" />
                    <circle cx="520" cy="130" r="5" fill="#7c7c7c" />
                  </g>
                </svg>
                <span className="t-label absolute left-4 top-4 border border-rule-strong bg-ink/70 px-2 py-1">Plumbers near you</span>
              </div>
              <ul className="divide-y divide-rule md:col-span-5">
                {[
                  { n: "Northline Plumbing & Heating", you: true, meta: "Plumber · Open now · Closes 6 pm" },
                  { n: "Another Plumber Ltd", meta: "Plumber · Opens 8 am" },
                  { n: "City Heating Services", meta: "Heating engineer · Open now" },
                ].map((b) => (
                  <li key={b.n} className={`p-5 ${b.you ? "" : "opacity-55"}`}>
                    <p className={`font-medium ${b.you ? "text-bone" : ""}`}>{b.n}</p>
                    <p className="mt-1 text-sm"><Stars /> <span className="text-ash">· {b.meta}</span></p>
                    <div className="mt-3 flex gap-2 font-mono text-[0.62rem] uppercase tracking-[0.12em]">
                      <span className="border border-rule-strong px-3 py-1.5">Call</span>
                      <span className="border border-rule-strong px-3 py-1.5">Directions</span>
                      <span className="border border-rule-strong px-3 py-1.5">Website</span>
                    </div>
                    {b.you ? <p className="t-label mt-3 !text-bone">← Complete profile, photos, hours, reviews answered</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          </Window>
        </Reveal>

        {/* what we do */}
        <div className="mt-24 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
          {skills.map(([title, body], i) => (
            <Reveal key={title} delay={i * 50} className="bg-ink p-7">
              <p className="t-label">0{i + 1}</p>
              <p className="mt-6 font-medium">{title}</p>
              <p className="t-body mt-2 !text-[0.9rem] !leading-6">{body}</p>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10">
          <ol className="flex flex-wrap items-center gap-x-3 gap-y-3 font-mono text-[0.68rem] uppercase tracking-[0.14em]">
            {flow.map((step, i) => (
              <li key={step} className="flex items-center gap-3">
                <span className="border border-rule-strong px-3 py-2 text-mist">{step}</span>
                {i < flow.length - 1 ? <span className="text-ash" aria-hidden>→</span> : null}
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal className="mt-14 flex flex-wrap items-center justify-between gap-6">
          <p className="t-body max-w-xl">
            We don&apos;t promise rankings — nobody honest can. We do the technical, content and local work that makes you easier to find
            and easier to choose, and we report on it plainly.
          </p>
          <Link href="/services/seo" className="btn">
            SEO &amp; search <span className="arrow" aria-hidden>→</span>
          </Link>
        </Reveal>
      </div>
    </Section>
  );
}
