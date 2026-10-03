import { GatewayFlow } from "../gateway-flow";
import { Reveal } from "../reveal";
import { Section, SectionHeading } from "../section";

const steps = [
  ["01", "Discover", "We learn the business, the customers and what is actually getting in the way."],
  ["02", "Build", "Design and engineering together — software, site and creative made as one system."],
  ["03", "Launch", "Carefully shipped, tested on real devices, and handed over with everything documented."],
  ["04", "Improve", "We measure, learn and keep refining — the work doesn't stop at go-live."],
] as const;

export function ProcessSection() {
  return (
    <Section id="process" className="overflow-hidden bg-coal">
      <div className="site-wrap">
        <SectionHeading eyebrow="Process" title="From tangled to clear." />
      </div>

      <div className="relative mt-16 h-[300px] md:mt-24 md:h-[380px]">
        <GatewayFlow />
        <div className="absolute inset-y-0 left-0 w-[12%] bg-gradient-to-r from-coal to-transparent" aria-hidden />
        <div className="absolute inset-y-0 right-0 w-[12%] bg-gradient-to-l from-coal to-transparent" aria-hidden />
        <div className="site-wrap relative flex h-full items-end justify-between pb-2">
          <p className="t-label">Problem</p>
          <p className="t-label">Solution</p>
        </div>
      </div>

      <div className="site-wrap mt-16">
        <div className="grid gap-px border border-rule bg-rule md:grid-cols-4">
          {steps.map(([n, title, body], i) => (
            <Reveal key={n} delay={i * 90} className="bg-coal p-7 md:p-8">
              <p className="t-label">{n}</p>
              <p className="t-title mt-10 !text-[1.9rem]">{title}</p>
              <p className="t-body mt-4 !text-[0.92rem]">{body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
