import { ScrollScene } from "./scroll-scene";

/**
 * About-page signature moment: a tall sticky scene (same technique as BrandMoment).
 * The owner's name drifts as a giant outline behind, while "ONE PERSON." and
 * "THE WHOLE JOB." slide in from opposite sides, then the statement resolves.
 * CSS-variable driven (see ScrollScene), so it adds no React renders.
 */
export function PersonMoment({ name, statement }: { name: string; statement: string }) {
  return (
    <ScrollScene className="relative h-[240svh] border-t border-rule bg-ink">
      <div className="sticky top-0 flex h-[100svh] flex-col items-center justify-start overflow-hidden pt-[18svh]">
        <div className="depth-bottom absolute inset-0" aria-hidden />

        <div
          aria-hidden
          className="t-mega absolute left-1/2 top-[10%] w-max select-none whitespace-nowrap text-transparent [-webkit-text-stroke:1px_rgb(255_255_255/0.14)] will-change-transform"
          style={{ transform: "translateX(calc(-50% + (var(--s) - 0.5) * -30vw))" }}
        >
          {name.toUpperCase()}
        </div>

        <div className="site-wrap relative z-10 flex w-full flex-col leading-none">
          <span className="t-mega block whitespace-nowrap !text-[clamp(2.4rem,9.5vw,10.5rem)] will-change-transform" style={{ transform: "translateX(calc((0.5 - var(--s)) * 22vw))" }}>
            ONE PERSON.
          </span>
          <span
            className="t-mega block whitespace-nowrap !text-[clamp(2.4rem,9.5vw,10.5rem)] will-change-transform"
            style={{ transform: "translateX(calc((var(--s) - 0.5) * 22vw + 4vw))" }}
          >
            THE WH<span className="text-bone/40">O</span>LE JOB.
          </span>
        </div>

        <div
          className="site-wrap absolute inset-x-0 bottom-[7%] z-30 grid items-end gap-6 md:grid-cols-12"
          style={{
            opacity: "clamp(0, calc((var(--s) - 0.45) * 4), 1)",
            transform: "translateY(calc((1 - clamp(0, (var(--s) - 0.45) * 4, 1)) * 40px))",
          }}
        >
          <p className="t-label md:col-span-3">No hand-offs</p>
          <p className="t-title !text-[clamp(1.3rem,2.4vw,2.2rem)] max-w-[34ch] md:col-span-9">{statement}</p>
        </div>
      </div>
    </ScrollScene>
  );
}
