import type { ReactNode } from "react";
import { Reveal } from "./reveal";
import { TypedText } from "./typed-text";

/** Header for inner pages: eyebrow, large headline, lead, optional aside visual. */
export function PageHero({
  eyebrow,
  title,
  lead,
  aside,
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <header className="relative overflow-hidden pb-20 pt-40 md:pb-28 md:pt-52">
      <div className="depth-top absolute inset-0" aria-hidden />
      <div className="site-wrap relative grid items-end gap-12 lg:grid-cols-12">
        <div className={aside ? "lg:col-span-8" : "lg:col-span-10"}>
          <Reveal>
            <p className="t-label mb-8 flex items-center gap-4">
              <span className="inline-block size-1.5 rounded-full bg-bone" aria-hidden />
              <TypedText text={eyebrow} speed={22} />
            </p>
          </Reveal>
          <Reveal delay={90}>
            <h1 className="t-display max-w-[18ch]">{typeof title === "string" ? <TypedText text={title} className="block" speed={30} delay={250} /> : title}</h1>
          </Reveal>
          {lead ? (
            <Reveal delay={190}>
              <p className="t-lead mt-10 max-w-xl">{lead}</p>
            </Reveal>
          ) : null}
        </div>
        {aside ? (
          <Reveal delay={260} className="lg:col-span-4">
            {aside}
          </Reveal>
        ) : null}
      </div>
    </header>
  );
}
