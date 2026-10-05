import Link from "next/link";
import { Reveal } from "./reveal";
import { TextEffect } from "./text-effect";

/** Closing call-to-action reused at the foot of inner pages. */
export function CtaBand({ title = "Ready to get more customers?", note }: { title?: string; note?: string }) {
  return (
    <section className="border-t border-rule py-24 md:py-32">
      <div className="site-wrap grid items-end gap-10 md:grid-cols-12">
        <Reveal className="md:col-span-8">
          <h2 className="t-display max-w-[16ch]"><TextEffect text={title} effect="mask" className="block" /></h2>
          {note ? <p className="t-lead mt-6 max-w-lg">{note}</p> : null}
        </Reveal>
        <Reveal delay={120} className="md:col-span-4 md:justify-self-end">
          <Link href="/contact" className="btn btn-solid">
            Let&apos;s talk growth <span className="arrow" aria-hidden>→</span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
