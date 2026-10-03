import Link from "next/link";
import { Reveal } from "../reveal";
import { Section, SectionHeading } from "../section";

/**
 * Three small illustrations of where customers look: Google, AI search, and
 * local discovery. Built in HTML/CSS; no ranking claims are made anywhere.
 */
function Panel({ label, children, delay }: { label: string; children: React.ReactNode; delay: number }) {
  return (
    <Reveal delay={delay} className="flex flex-col border border-rule bg-coal">
      <div className="border-b border-rule px-5 py-3">
        <p className="t-label">{label}</p>
      </div>
      <div className="flex-1 p-5">{children}</div>
    </Reveal>
  );
}

export function SeoSection() {
  return (
    <Section id="seo">
      <div className="site-wrap">
        <SectionHeading
          eyebrow="03 — SEO"
          title="Be easier to find, wherever people ask."
          lead="Customers now search in three places at once. We make sure your business is clear, credible and findable in all of them."
        />

        <div className="mt-16 grid gap-px md:mt-24 md:grid-cols-3">
          <Panel label="Google" delay={0}>
            <div className="flex items-center gap-3 border border-rule-strong px-3 py-2.5 text-sm">
              <span className="text-ash">⌕</span>
              <span>best accountant near me</span>
              <span className="caret ml-0.5 inline-block h-4 w-px bg-bone" />
            </div>
            <ul className="mt-5 space-y-4">
              {[true, false, false].map((you, i) => (
                <li key={i} className={`border-l pl-3 ${you ? "border-bone" : "border-rule"}`}>
                  <div className={`h-2 w-3/5 ${you ? "bg-bone" : "bg-bone/30"}`} />
                  <div className="mt-2 h-1.5 w-full bg-bone/15" />
                  <div className="mt-1.5 h-1.5 w-4/5 bg-bone/10" />
                  {you ? <p className="t-label mt-2 !text-bone">Your business</p> : null}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel label="AI search" delay={90}>
            <div className="space-y-3 text-sm">
              <p className="ml-auto w-fit max-w-[80%] border border-rule-strong px-3 py-2">Who should I hire for this?</p>
              <div className="max-w-[92%] space-y-2 text-mist">
                <div className="h-1.5 w-full bg-bone/20" />
                <div className="h-1.5 w-11/12 bg-bone/20" />
                <div className="h-1.5 w-2/3 bg-bone/20" />
                <p className="pt-1 text-bone">
                  Your business <span className="border border-rule-strong px-1.5 py-0.5 font-mono text-[0.65rem]">1</span>
                </p>
              </div>
              <p className="t-label pt-3">Cited as a source</p>
            </div>
          </Panel>

          <Panel label="Local discovery" delay={180}>
            <div className="relative aspect-[4/3] overflow-hidden border border-rule bg-[linear-gradient(rgb(255_255_255/0.05)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.05)_1px,transparent_1px)] bg-[size:28px_28px]">
              <span className="pin absolute left-[46%] top-[40%] block size-3 rounded-full bg-bone" />
              <span className="absolute left-[46%] top-[40%] block size-3 animate-ping rounded-full bg-bone/40 motion-reduce:hidden" />
              <div className="absolute inset-x-3 bottom-3 border border-rule-strong bg-ink/80 px-3 py-2 text-xs">
                Your business · Open now
              </div>
            </div>
            <p className="t-label mt-4">Maps &amp; local pack</p>
          </Panel>
        </div>

        <Reveal className="mt-12 flex flex-wrap items-center justify-between gap-6">
          <p className="t-body max-w-xl">
            We don&apos;t promise rankings — nobody honest can. We do the technical, content and local work that makes you
            easier to find and easier to choose.
          </p>
          <Link href="/services/seo" className="btn">
            SEO &amp; search <span className="arrow" aria-hidden>→</span>
          </Link>
        </Reveal>
      </div>
    </Section>
  );
}
