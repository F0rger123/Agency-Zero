import Link from "next/link";
import { BarsDivider } from "../bars-divider";
import { CodeField } from "../code-field";
import { CrmMockup } from "../crm-mockup";
import { Reveal } from "../reveal";

const benefits = [
  ["Less repetitive work", "Recurring admin becomes an automation instead of a Friday-afternoon chore."],
  ["Fewer disconnected tools", "Leads, quotes, projects, invoices and reporting in one place."],
  ["Built around your workflow", "Your stages, your language, your rules — not a template's."],
  ["Directly customisable", "When the business changes, the software changes with it."],
] as const;

/** Signature moment #4 — the custom-software feature, with the code backdrop. */
export function SoftwareSection() {
  return (
    <section id="software" className="relative overflow-hidden border-t border-rule bg-coal">
      <BarsDivider className="relative z-10" />
      <div className="relative py-24 md:py-36">
        <CodeField className="opacity-50 md:opacity-100" />
        <div className="absolute inset-x-0 top-0 h-1/5 bg-gradient-to-b from-coal to-transparent" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 h-1/5 bg-gradient-to-t from-coal to-transparent" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-r from-coal via-coal/70 to-transparent" aria-hidden />

        <div className="site-wrap relative grid items-center gap-16 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <Reveal>
              <p className="t-label">01 — Custom software &amp; CRMs</p>
            </Reveal>
            <Reveal delay={90}>
              <h2 className="t-display mt-8 !text-[clamp(2.4rem,4.6vw,5rem)]">
                Your business shouldn&apos;t have to adapt to its software.
              </h2>
            </Reveal>
            <Reveal delay={170}>
              <p className="t-title mt-6 !text-[clamp(1.5rem,2.6vw,2.6rem)] !text-ash">We build the software around your business.</p>
            </Reveal>

            <dl className="mt-14 grid gap-px border border-rule bg-rule sm:grid-cols-2">
              {benefits.map(([title, body], i) => (
                <Reveal key={title} delay={220 + i * 70} className="bg-coal p-6">
                  <dt className="text-sm font-medium">{title}</dt>
                  <dd className="t-body mt-2 !text-[0.9rem]">{body}</dd>
                </Reveal>
              ))}
            </dl>

            <Reveal delay={500}>
              <Link href="/services/software" className="btn btn-solid mt-12">
                Custom software <span className="arrow" aria-hidden>→</span>
              </Link>
            </Reveal>
          </div>

          <Reveal delay={200} className="lg:col-span-6">
            <div className="lg:translate-x-6 lg:[transform:perspective(1600px)_rotateY(-7deg)_rotateX(2deg)]">
              <CrmMockup />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
