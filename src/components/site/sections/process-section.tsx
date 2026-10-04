import { GatewayFlow } from "../gateway-flow";
import { Reveal } from "../reveal";
import { Section, SectionHeading } from "../section";

const steps = [
  ["01", "Getting you customers", "A website, search presence and ads that bring in people who are ready to buy."],
  ["02", "Growing your social media", "Regular, on-brand content that builds an audience that knows and trusts you."],
  ["03", "Managing the day to day", "Replies to messages, comments and enquiries, and a plan that keeps everything moving."],
  ["04", "You do your job", "You get on with the work you are good at. A short, plain report keeps you in the picture."],
] as const;

export function ProcessSection() {
  return (
    <Section id="process" className="overflow-hidden bg-coal">
      <div className="site-wrap">
        <SectionHeading
          effect="typing"
          eyebrow="How I help"
          title="You run your business. I will bring in the customers."
          lead="Worry about the job you are good at. I take care of customer acquisition, social media growth and the management that goes with them, so you can stay focused on your customers."
        />
      </div>

      <div className="relative mt-16 h-[300px] md:mt-24 md:h-[380px]">
        <GatewayFlow />
        <div className="absolute inset-y-0 left-0 w-[12%] bg-gradient-to-r from-coal to-transparent" aria-hidden />
        <div className="absolute inset-y-0 right-0 w-[12%] bg-gradient-to-l from-coal to-transparent" aria-hidden />
        <div className="site-wrap relative flex h-full items-end justify-between pb-2">
          <p className="t-label">All the marketing to-dos</p>
          <p className="t-label">Handled, so you can get on</p>
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
