import type { ServiceSlug } from "@/lib/site-config";

/**
 * One 1px-stroke monochrome glyph per service: the "visual identity" for each
 * entry in the services wheel. Pure SVG, currentColor, no animation cost.
 */
export function ServiceGlyph({ slug, className = "" }: { slug: ServiceSlug; className?: string }) {
  const common = {
    viewBox: "0 0 120 120",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1,
    className,
    "aria-hidden": true,
  } as const;

  switch (slug) {
    case "software":
      return (
        <svg {...common}>
          <rect x="10" y="18" width="100" height="84" />
          <path d="M10 36h100" />
          <path d="M30 56l-12 10 12 10M90 56l12 10-12 10M66 52l-12 28" />
          <circle cx="20" cy="27" r="2" />
          <circle cx="30" cy="27" r="2" />
        </svg>
      );
    case "websites":
      return (
        <svg {...common}>
          <rect x="10" y="16" width="100" height="88" />
          <path d="M10 34h100M44 34v70" />
          <rect x="54" y="46" width="46" height="22" />
          <path d="M54 80h46M54 90h30M20 46h16M20 56h16M20 66h16" />
        </svg>
      );
    case "seo":
      return (
        <svg {...common}>
          <circle cx="52" cy="52" r="30" />
          <path d="M74 74l30 30" />
          <path d="M36 62V50M46 62V40M56 62V46M66 62V34" />
        </svg>
      );
    case "meta-ads":
      return (
        <svg {...common}>
          <circle cx="60" cy="60" r="46" />
          <circle cx="60" cy="60" r="30" />
          <circle cx="60" cy="60" r="14" />
          <path d="M60 4v24M60 92v24M4 60h24M92 60h24" />
        </svg>
      );
    case "social":
      return (
        <svg {...common}>
          <rect x="14" y="14" width="38" height="38" />
          <rect x="68" y="14" width="38" height="38" />
          <rect x="14" y="68" width="38" height="38" />
          <rect x="68" y="68" width="38" height="38" />
          <path d="M22 44l10-12 8 8 6-6M76 22h22M76 32h14" />
        </svg>
      );
    case "content":
      return (
        <svg {...common}>
          <rect x="30" y="8" width="60" height="104" />
          <path d="M52 48l22 12-22 12z" />
          <path d="M40 94h40M40 100h24" />
        </svg>
      );
  }
}
