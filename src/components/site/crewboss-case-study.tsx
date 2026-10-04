import { crewboss } from "@/content/work";
import { Photo } from "./photo";
import { Reveal } from "./reveal";
import { TextEffect } from "./text-effect";

/**
 * Featured case study: CrewBoss CRM. Header and the main screenshot lead; the story and the other
 * screenshots follow beneath, with nothing else competing.
 */
export function CrewbossCaseStudy() {
  return (
    <section className="border-t border-rule py-20 md:py-28">
      <div className="site-wrap">
        <Reveal>
          <p className="t-label">Featured · Custom software</p>
        </Reveal>
        <h2 className="t-display mt-6">
          <TextEffect text="CrewBoss CRM" effect="mask" className="block" />
        </h2>

        <Reveal delay={120} className="mt-12 md:mt-16">
          <figure>
            <div className="overflow-hidden border border-rule-strong bg-coal">
              <Photo src={crewboss.hero.src} alt={crewboss.hero.alt} width={crewboss.hero.width} height={crewboss.hero.height} className="w-full" />
            </div>
            <figcaption className="t-label mt-3">Home page and owner dashboard: revenue, jobs, schedule, live crew</figcaption>
          </figure>
        </Reveal>

        <div className="mt-16 grid gap-12 md:mt-24 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <p className="t-lead max-w-md">
              A complete operating system for a field-service trade. The office schedules and bills, the crew works from their
              phone, and an AI assistant handles the repetitive messages.
            </p>
            <dl className="mt-10 space-y-8">
              <div>
                <dt className="t-label">The problem</dt>
                <dd className="t-body mt-2">
                  Generic CRMs weren&apos;t built for crews in driveways. Scheduling, checklists, photos and customer texts lived in
                  separate places.
                </dd>
              </div>
              <div>
                <dt className="t-label">What I built</dt>
                <dd className="mt-3 grid gap-x-6 gap-y-2 text-sm text-mist sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {[
                    "Scheduling and crew assignment",
                    "Estimates, invoices and Stripe payments",
                    "Customer portal with e-sign and pay",
                    "Mobile field portal and checklists",
                    "Live crew tracking",
                    "Automations and an AI assistant",
                  ].map((item) => (
                    <span key={item} className="flex gap-3"><span className="text-ash">—</span>{item}</span>
                  ))}
                </dd>
              </div>
            </dl>
          </Reveal>

          <Reveal delay={100} className="lg:col-span-7">
            <figure>
              <div className="overflow-hidden border border-rule-strong bg-coal">
                <Photo src={crewboss.features.src} alt={crewboss.features.alt} width={crewboss.features.width} height={crewboss.features.height} className="w-full" />
              </div>
              <figcaption className="t-label mt-3">Everything the office and the field need, in one system</figcaption>
            </figure>
          </Reveal>
        </div>

        <Reveal delay={80} className="mt-12 md:mt-16">
          <figure>
            <div className="overflow-hidden border border-rule-strong bg-coal">
              <Photo src={crewboss.field.src} alt={crewboss.field.alt} width={crewboss.field.width} height={crewboss.field.height} className="w-full" />
            </div>
            <figcaption className="t-label mt-3">Mobile field portal: checklists, photos, clock in and out</figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
