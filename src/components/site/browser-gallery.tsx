import { webConcepts } from "@/content/concepts";
import { Photo } from "./photo";
import { ScrollScene } from "./scroll-scene";

/**
 * Concept-website gallery. Staggered 12-column layout (two large + three
 * medium); on md+ each card eases into place with scroll (`--p` from
 * ScrollScene) and has its own parallax drift. Below md: a swipe row.
 */
const spans = ["md:col-span-7", "md:col-span-5 md:mt-28", "md:col-span-4", "md:col-span-4 md:mt-10", "md:col-span-4"];

export function BrowserGallery() {
  return (
    <ScrollScene className="gallery">
      <ul className="gallery-row -mx-[var(--site-pad)] flex snap-x gap-4 overflow-x-auto px-[var(--site-pad)] pb-4 md:mx-0 md:grid md:grid-cols-12 md:gap-6 md:overflow-visible md:px-0 md:pb-0">
        {webConcepts.map((concept, i) => (
          <li
            key={concept.name}
            className={`gallery-card group w-[82vw] shrink-0 snap-center md:w-auto ${spans[i]}`}
            style={{ "--par": i % 2 ? -46 : 38 } as React.CSSProperties}
          >
            <div className="overflow-hidden border border-rule-strong bg-coal transition-colors duration-500 group-hover:border-bone/60">
              <div className="flex items-center gap-1.5 border-b border-rule px-4 py-2.5">
                <span className="size-1.5 rounded-full bg-bone/30" />
                <span className="size-1.5 rounded-full bg-bone/30" />
                <span className="size-1.5 rounded-full bg-bone/30" />
                <span className="t-label ml-3 truncate !text-[0.6rem]">{concept.name}</span>
              </div>
              <div className="overflow-hidden">
                <Photo
                  src={concept.src}
                  alt={concept.alt}
                  width={2160}
                  height={1350}
                  className="aspect-[16/10] w-full object-cover object-top transition-transform duration-[1400ms] ease-[var(--ease-out)] group-hover:scale-[1.035]"
                />
              </div>
            </div>
            <div className="mt-4 flex items-start justify-between gap-4">
              <div>
                <p className="font-medium tracking-tight">{concept.name}</p>
                <p className="t-label mt-1">{concept.kind}</p>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                {concept.concept ? <span className="t-label border border-rule-strong px-2 py-1 !text-bone/70">Concept</span> : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </ScrollScene>
  );
}
