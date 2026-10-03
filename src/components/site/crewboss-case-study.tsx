import { crewboss } from "@/content/work";
import { Photo } from "./photo";
import { Reveal } from "./reveal";

/** Featured case study: CrewBoss, a CRM Agency Zero built (real screenshots from the live product's public site). */
export function CrewbossCaseStudy() {
  return (
    <section className="border-t border-rule py-20 md:py-28">
      <div className="site-wrap">
        <div className="grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <p className="t-label">Featured · Custom software</p>
            <h2 className="t-title mt-6 max-w-[18ch]">CrewBoss — a CRM built for pressure-washing businesses.</h2>
            <p className="t-lead mt-8 max-w-md">
              A complete operating system for a field-service trade: the office schedules and bills, the crew works from their phone,
              and an AI assistant handles the repetitive messages.
            </p>

            <dl className="mt-10 space-y-8">
              <div>
                <dt className="t-label">The problem</dt>
                <dd className="t-body mt-2">Generic CRMs weren&apos;t built for crews in driveways: scheduling, checklists, photos and customer texts lived in separate places.</dd>
              </div>
              <div>
                <dt className="t-label">What we built</dt>
                <dd className="mt-3 grid gap-x-6 gap-y-2 text-sm text-mist sm:grid-cols-2">
                  {[
                    "Scheduling & crew assignment",
                    "Estimates, invoices & Stripe payments",
                    "Customer portal with e-sign & pay",
                    "Mobile field portal & checklists",
                    "Live crew tracking",
                    "Drag-and-drop automations",
                    "AI assistant that acts in the CRM",
                    "Review & referral requests",
                  ].map((item) => (
                    <span key={item} className="flex gap-3"><span className="text-ash">—</span>{item}</span>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="t-label">Outcome</dt>
                <dd className="t-body mt-2">Live as a product with a free trial. Customer results will be added here as they are collected — no numbers until they are real.</dd>
              </div>
            </dl>

            <a href={crewboss.url} target="_blank" rel="noopener noreferrer" className="btn btn-solid mt-12">
              View live product <span className="arrow" aria-hidden>↗</span>
            </a>
          </Reveal>

          <Reveal delay={80} className="lg:col-span-7">
            <figure>
              <div className="overflow-hidden border border-rule-strong bg-coal">
                <Photo src={crewboss.hero.src} alt={crewboss.hero.alt} width={crewboss.hero.width} height={crewboss.hero.height} className="w-full" />
              </div>
              <figcaption className="t-label mt-3">Home page and owner dashboard — revenue, jobs, schedule, live crew</figcaption>
            </figure>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-12">
          <Reveal delay={60} className="lg:col-span-6">
            <figure>
              <div className="overflow-hidden border border-rule-strong bg-coal">
                <Photo src={crewboss.features.src} alt={crewboss.features.alt} width={crewboss.features.width} height={crewboss.features.height} className="w-full" />
              </div>
              <figcaption className="t-label mt-3">Everything the office and the field need — one system</figcaption>
            </figure>
          </Reveal>
          <div className="flex flex-col justify-between gap-5 lg:col-span-6">
            <Reveal delay={120}>
              <figure>
                <div className="overflow-hidden border border-rule-strong bg-coal">
                  <Photo src={crewboss.field.src} alt={crewboss.field.alt} width={crewboss.field.width} height={crewboss.field.height} className="w-full" />
                </div>
                <figcaption className="t-label mt-3">Mobile field portal — checklists, photos, clock in and out</figcaption>
              </figure>
            </Reveal>
            <Reveal delay={180}>
              <figure>
                <div className="overflow-hidden border border-rule-strong bg-coal">
                  <Photo src={crewboss.steps.src} alt={crewboss.steps.alt} width={crewboss.steps.width} height={crewboss.steps.height} className="w-full" />
                </div>
                <figcaption className="t-label mt-3">Up and running the same day</figcaption>
              </figure>
            </Reveal>
            <Reveal delay={240}>
              <a
                href={crewboss.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col justify-between gap-6 border border-rule-strong p-6 transition-colors duration-500 hover:bg-bone hover:text-ink"
              >
                <p className="t-label group-hover:!text-ink/60">Live product</p>
                <div>
                  <p className="t-title !text-[1.5rem]">Try it yourself.</p>
                  <p className="mt-3 font-mono text-xs uppercase tracking-[0.14em] opacity-70">smocks-crm.pages.dev ↗</p>
                </div>
              </a>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
