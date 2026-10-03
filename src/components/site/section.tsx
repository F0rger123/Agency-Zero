import type { ReactNode } from "react";
import { Reveal } from "./reveal";
import { TypedText } from "./typed-text";

/** Standard vertical rhythm for every section. */
export function Section({
  id,
  children,
  className = "",
  bordered = true,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  bordered?: boolean;
}) {
  return (
    <section id={id} className={`relative ${bordered ? "border-t border-rule" : ""} py-24 md:py-36 ${className}`}>
      {children}
    </section>
  );
}

/** Eyebrow + title (+ lead) used at the top of every section. */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  className = "",
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`grid gap-8 md:grid-cols-12 ${className}`}>
      <Reveal className="md:col-span-3">
        <p className="t-label"><TypedText text={eyebrow} speed={22} /></p>
      </Reveal>
      <div className="md:col-span-9">
        <Reveal delay={80}>
          <h2 className="t-display max-w-[18ch]">{typeof title === "string" ? <TypedText text={title} className="block" speed={24} delay={150} /> : title}</h2>
        </Reveal>
        {lead ? (
          <Reveal delay={160}>
            <p className="t-lead mt-8 max-w-xl">{lead}</p>
          </Reveal>
        ) : null}
      </div>
    </div>
  );
}
