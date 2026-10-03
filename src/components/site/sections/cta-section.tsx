import Link from "next/link";
import { LayeredText } from "../layered-text";
import { Particles } from "../particles";
import { Reveal } from "../reveal";
import { TypedText } from "../typed-text";

export function CtaSection({
  line1 = "Your business doesn't need more noise.",
  line2 = "It needs better",
  word = "systems.",
  secondary = { href: "/work", label: "or see the work first" },
}: {
  line1?: string;
  line2?: string;
  word?: string;
  secondary?: { href: string; label: string };
} = {}) {
  return (
    <section className="relative isolate overflow-hidden border-t border-rule py-28 md:py-44">
      <Particles className="-z-10" />
      <div className="depth-bottom absolute inset-0 -z-10" aria-hidden />
      <div className="site-wrap">
        <Reveal>
          <p className="t-display !text-ash"><TypedText text={line1} className="block" speed={26} /></p>
        </Reveal>
        <Reveal delay={120}>
          <p className="t-display mt-2"><TypedText text={line2} className="block" speed={30} delay={900} /></p>
        </Reveal>
        <Reveal delay={200} className="mt-2 max-w-full overflow-visible">
          <LayeredText text={word} className="t-mega !text-[clamp(4rem,17vw,19rem)] !leading-[0.9]" />
        </Reveal>
        <Reveal delay={320} className="mt-14 flex flex-wrap items-center gap-6">
          <Link href="/contact" className="btn btn-solid">
            Start a project <span className="arrow" aria-hidden>→</span>
          </Link>
          <Link href={secondary.href} className="u-link t-label">
            {secondary.label}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
