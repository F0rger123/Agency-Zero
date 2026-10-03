import { ScrollScene } from "./scroll-scene";

/**
 * 3D "unfurling" gallery of website layouts. On md+ the five frames start fanned
 * and stacked, then unfurl flat with scroll (CSS 3D, driven by `--p`); each has
 * its own parallax drift. Below md it is a plain horizontal swipe row.
 * The layouts are abstract placeholders — swap `frames` for real screenshots.
 */
type Frame = { name: string; layout: "hero" | "grid" | "split" | "editorial" | "product" };

const frames: Frame[] = [
  { name: "Example · Studio", layout: "editorial" },
  { name: "Example · Local service", layout: "split" },
  { name: "Example · Brand", layout: "hero" },
  { name: "Example · Shop", layout: "product" },
  { name: "Example · Portfolio", layout: "grid" },
];

function Layout({ kind }: { kind: Frame["layout"] }) {
  const bar = "bg-bone/70";
  const dim = "bg-bone/15";
  switch (kind) {
    case "hero":
      return (
        <div className="flex h-full flex-col justify-end gap-2 p-4">
          <div className={`h-5 w-4/5 ${bar}`} />
          <div className={`h-5 w-3/5 ${bar}`} />
          <div className={`mt-2 h-1.5 w-2/5 ${dim}`} />
          <div className="mt-3 h-6 w-20 border border-bone/50" />
        </div>
      );
    case "grid":
      return (
        <div className="grid h-full grid-cols-2 gap-2 p-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className={i % 3 === 0 ? "bg-bone/25" : "bg-bone/10"} />
          ))}
        </div>
      );
    case "split":
      return (
        <div className="grid h-full grid-cols-2">
          <div className="flex flex-col justify-center gap-2 p-4">
            <div className={`h-3 w-full ${bar}`} />
            <div className={`h-3 w-2/3 ${bar}`} />
            <div className={`mt-2 h-1.5 w-3/4 ${dim}`} />
          </div>
          <div className="bg-bone/20" />
        </div>
      );
    case "editorial":
      return (
        <div className="flex h-full flex-col gap-3 p-4">
          <div className={`h-1.5 w-1/4 ${dim}`} />
          <div className={`h-7 w-full ${bar}`} />
          <div className={`h-7 w-4/5 ${bar}`} />
          <div className="mt-auto grid grid-cols-3 gap-2">
            <div className="h-10 bg-bone/20" />
            <div className="h-10 bg-bone/10" />
            <div className="h-10 bg-bone/20" />
          </div>
        </div>
      );
    case "product":
      return (
        <div className="grid h-full grid-cols-3 gap-2 p-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className="flex-1 bg-bone/15" />
              <div className={`h-1 w-3/4 ${dim}`} />
            </div>
          ))}
        </div>
      );
  }
}

export function BrowserGallery() {
  return (
    <ScrollScene className="gallery">
      <ul className="gallery-row -mx-[var(--site-pad)] flex snap-x gap-4 overflow-x-auto px-[var(--site-pad)] pb-4 md:mx-0 md:overflow-visible md:px-0 md:pb-0">
        {frames.map((frame, i) => {
          const k = i - 2;
          return (
            <li
              key={frame.name}
              className="gallery-card w-[72vw] shrink-0 snap-center md:w-auto"
              style={{ "--k": k, "--z": 120 - Math.abs(k) * 70, "--par": i % 2 ? -70 : 70 } as React.CSSProperties}
            >
              <div className="border border-rule-strong bg-coal">
                <div className="flex items-center gap-1.5 border-b border-rule px-3 py-2">
                  <span className="size-1.5 rounded-full bg-bone/30" />
                  <span className="size-1.5 rounded-full bg-bone/30" />
                  <span className="size-1.5 rounded-full bg-bone/30" />
                </div>
                <div className="aspect-[3/4]">
                  <Layout kind={frame.layout} />
                </div>
              </div>
              <p className="t-label mt-3">{frame.name}</p>
            </li>
          );
        })}
      </ul>
    </ScrollScene>
  );
}
