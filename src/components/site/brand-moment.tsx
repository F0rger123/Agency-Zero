import { ScrollScene } from "./scroll-scene";

/**
 * Signature moment #1 — AGENCY ZER0, in depth.
 *
 * A tall scene with a sticky stage. As you scroll through it, three typographic
 * layers travel at different speeds and directions (back: huge outline, slow;
 * middle: solid wordmark; front: hairline outline, fast), then the statement
 * resolves over them. All motion is CSS driven by `--s` (see ScrollScene), so
 * it is compositor-only and costs no React renders.
 */
export function BrandMoment() {
  return (
    <ScrollScene className="brand-scene relative h-[320svh] bg-ink">
      <div className="brand-stage sticky top-0 flex h-[100svh] flex-col items-center justify-center overflow-hidden">
        <div className="depth-bottom absolute inset-0" aria-hidden />

        {/* back layer: giant, outlined, slow */}
        <div
          aria-hidden
          className="t-mega absolute left-1/2 top-[18%] w-max select-none whitespace-nowrap text-transparent [-webkit-text-stroke:1px_rgb(255_255_255/0.14)] will-change-transform"
          style={{ transform: "translateX(calc(-50% + (var(--s) - 0.5) * -26vw))" }}
        >
          AGENCY ZER0
        </div>

        {/* middle layer: solid wordmark, split to opposite sides */}
        <div className="relative z-10 flex flex-col items-start leading-none">
          <span
            className="t-mega block will-change-transform"
            style={{ transform: "translateX(calc((0.5 - var(--s)) * 34vw))" }}
          >
            AGENCY
          </span>
          <span
            className="t-mega block will-change-transform"
            style={{ transform: "translateX(calc((var(--s) - 0.5) * 34vw + 10vw))" }}
          >
            ZER<span className="text-bone/40">0</span>
          </span>
        </div>

        {/* front layer: hairline outline, fast, offset vertically */}
        <div
          aria-hidden
          className="t-mega pointer-events-none absolute left-1/2 top-[52%] z-20 w-max select-none whitespace-nowrap text-transparent [-webkit-text-stroke:1px_rgb(255_255_255/0.42)] will-change-transform"
          style={{ transform: "translateX(calc(-50% + (0.5 - var(--s)) * 64vw))" }}
        >
          ZER0 AGENCY
        </div>

        {/* statement resolves over the second half of the scroll */}
        <div
          className="brand-statement site-wrap absolute inset-x-0 bottom-[9%] z-30 grid items-end gap-6 md:grid-cols-12"
          style={{
            opacity: "clamp(0, calc((var(--s) - 0.52) * 4), 1)",
            transform: "translateY(calc((1 - clamp(0, (var(--s) - 0.52) * 4, 1)) * 40px))",
          }}
        >
          <p className="t-label md:col-span-3">My premise</p>
          <p className="t-title md:col-span-9 max-w-[22ch] md:max-w-[28ch]">
            Every business starts at zero. I build the systems that take it further.
          </p>
        </div>
      </div>
    </ScrollScene>
  );
}
