/**
 * Plain <img> with explicit dimensions (no layout shift) and lazy loading.
 * (next/image's optimiser isn't used on the Cloudflare Workers build, and these
 * assets are pre-sized by `npm run mockups`.)
 */
export function Photo({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={className}
    />
  );
}
