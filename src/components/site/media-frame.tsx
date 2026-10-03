/**
 * Media placeholder architecture.
 *
 * Renders a real <video>/<img> when `src` is supplied, otherwise a clearly
 * labelled placeholder. Swap in assets by editing `src/content/media.ts` only —
 * no component changes. Videos are muted, looped, inline, lazy (`preload="none"`
 * with a poster) so they never block the page.
 */
export type MediaSpec = {
  label: string;
  caption: string;
  ratio: "9/16" | "16/9" | "4/5" | "1/1";
  video?: string;
  image?: string;
  poster?: string;
};

export function MediaFrame({ media, className = "" }: { media: MediaSpec; className?: string }) {
  const ratio = { "9/16": "aspect-[9/16]", "16/9": "aspect-video", "4/5": "aspect-[4/5]", "1/1": "aspect-square" }[media.ratio];
  return (
    <figure className={className}>
      <div className={`relative ${ratio} overflow-hidden border border-rule bg-char`}>
        {media.video ? (
          <video
            className="absolute inset-0 size-full object-cover"
            src={media.video}
            poster={media.poster}
            muted
            loop
            playsInline
            preload="none"
            autoPlay
          />
        ) : media.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="absolute inset-0 size-full object-cover" src={media.image} alt={media.caption} loading="lazy" />
        ) : (
          <div className="absolute inset-0 media-placeholder" aria-hidden>
            <span className="absolute inset-x-0 bottom-4 text-center t-label">Placeholder · {media.label}</span>
            <svg viewBox="0 0 24 24" className="absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 text-bone/60" fill="none" stroke="currentColor" strokeWidth="0.8">
              <path d="M9 7l8 5-8 5z" />
            </svg>
          </div>
        )}
      </div>
      <figcaption className="t-label mt-3">{media.caption}</figcaption>
    </figure>
  );
}
