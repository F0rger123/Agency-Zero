import { site } from "@/lib/site-config";

/** Instagram glyph (outline camera mark) drawn inline so it needs no image or icon package. */
export function InstagramIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Button that opens the Agency Zero Instagram profile in a new tab. */
export function InstagramButton({ className = "" }: { className?: string }) {
  return (
    <a
      href={site.instagram}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Agency Zero on Instagram (opens in a new tab)"
      className={`btn ${className}`}
    >
      <InstagramIcon />
      <span>Instagram</span>
    </a>
  );
}
