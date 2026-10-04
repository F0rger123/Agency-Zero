import { ScrollScene } from "./scroll-scene";

/**
 * About-page signature moment: scroll-linked word highlight.
 *
 * A tall sticky scene holds one large statement. As you scroll, each word lights up in turn, from dim grey to
 * full white, so the sentence is "read" at the speed you scroll. Behind it, the name sits as a faint outline.
 * Nothing moves sideways or overlaps: words keep their place and only their brightness changes. The progress
 * comes from ScrollScene's `--s` variable, so there are no React renders while scrolling. Under reduced motion
 * `--s` rests at 0.5 and half the sentence reads as lit, which is still legible.
 */
export function PersonMoment({ name, headline, statement }: { name: string; headline: string; statement: string }) {
  const lead = headline.split(" ");
  const rest = statement.split(" ");
  const total = lead.length + rest.length;
  const wordStyle = (index: number) => ({
    opacity: `clamp(0.14, calc((var(--s) * ${total + 4} - ${index}) * 0.8 + 0.14), 1)`,
    transition: "opacity 0.15s linear",
  });
  return (
    <ScrollScene className="relative h-[260svh] border-t border-rule bg-ink">
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <div className="depth-bottom absolute inset-0" aria-hidden />
        <p
          aria-hidden
          className="t-mega pointer-events-none absolute inset-x-0 bottom-[6%] select-none whitespace-nowrap text-center text-transparent [-webkit-text-stroke:1px_rgb(255_255_255/0.08)]"
        >
          {name.toUpperCase()}
        </p>
        <div className="site-wrap relative z-10">
          <p className="t-label mb-8">No hand-offs</p>
          <h2 className="t-display max-w-5xl">
            {lead.map((word, index) => (
              <span key={`h-${index}`} style={wordStyle(index)}>
                {word}
                {index < lead.length - 1 ? " " : ""}
              </span>
            ))}
          </h2>
          <p className="t-title mt-8 max-w-3xl !text-[clamp(1.3rem,2.5vw,2.2rem)] !leading-[1.3]">
            {rest.map((word, index) => (
              <span key={`s-${index}`} style={wordStyle(lead.length + index)}>
                {word}
                {index < rest.length - 1 ? " " : ""}
              </span>
            ))}
          </p>
        </div>
      </div>
    </ScrollScene>
  );
}
