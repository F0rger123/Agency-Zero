import type { ReactNode } from "react";

/** Small monochrome pill used to label planned / later work. */
export function PhaseTag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
      {children}
    </span>
  );
}

/**
 * Shared empty state: hairline rule, title, short explanation.
 * No fake action buttons — unbuilt features explain when they arrive.
 */
export function EmptyState({
  tag,
  title,
  children,
}: {
  tag?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="border-t border-border pt-10">
      {tag ? (
        <div className="mb-4">
          <PhaseTag>{tag}</PhaseTag>
        </div>
      ) : null}
      <h2 className="text-base font-medium tracking-tight">{title}</h2>
      {children ? (
        <div className="mt-2 max-w-prose text-sm leading-6 text-muted-foreground">
          {children}
        </div>
      ) : null}
    </div>
  );
}
