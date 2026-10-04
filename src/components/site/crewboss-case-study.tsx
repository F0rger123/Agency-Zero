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
              {[
                [
                  "Automations that do the repeat work",
                  "New-lead replies, review requests, overdue-invoice reminders and 90-day re-service nudges run on their own once you set them up.",
                ],
                [
                  "An AI assistant that texts, reviews and schedules",
                  "It can text customers for you, ask for reviews, schedule jobs, manage the calendar and send invoices. It acts on your real data and asks before it does anything.",
                ],
                [
                  "Jobs, calendar and invoices in one place",
                  "Drag jobs onto the calendar, assign crew, send estimates customers can sign and pay online, and see who is paid and who is owed.",
                ],
                [
                  "Help growing the business",
                  "Referral links, automatic review requests and clear numbers on revenue and jobs show you what is working, so you learn how to grow.",
                ],
              ].map(([title, body]) => (
                <div key={title}>
                  <dt className="font-medium tracking-tight">{title}</dt>
                  <dd className="t-body mt-2 !text-[0.92rem]">{body}</dd>
                </div>
              ))}
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

      </div>
    </section>
  );
}
