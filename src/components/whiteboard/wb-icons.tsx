import type { ReactNode } from "react";

const paths: Record<string, ReactNode> = {
  select: <path d="M6 4l12 7.2-5.2 1.3-2.6 5.2L6 4z" />,
  pen: (
    <>
      <path d="M4 20l1-4.2L16.6 4.2a2 2 0 0 1 2.8 0l.4.4a2 2 0 0 1 0 2.8L8.2 19 4 20z" />
      <path d="M14.5 6.3l3.2 3.2" />
    </>
  ),
  eraser: (
    <>
      <path d="M8.5 19.5H20" />
      <path d="M5.2 14.3l7.9-7.9a2 2 0 0 1 2.8 0l2.7 2.7a2 2 0 0 1 0 2.8L11.5 19.5H8.6a2 2 0 0 1-1.4-.6l-2-2a2 2 0 0 1 0-2.6z" />
    </>
  ),
  shapes: (
    <>
      <rect x="3.5" y="11" width="9" height="9" rx="1.6" />
      <circle cx="15.5" cy="8.5" r="5" />
    </>
  ),
  text: <path d="M5 6.5V5h14v1.5M12 5v14M9 19h6" />,
  note: (
    <>
      <path d="M5 4.5h14a1 1 0 0 1 1 1V15l-5 5H5a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1z" />
      <path d="M20 15h-4a1 1 0 0 0-1 1v4" />
    </>
  ),
  undo: <path d="M9 7L4.5 11.5 9 16M5 11.5h9.5a5 5 0 0 1 0 10H11" transform="translate(0 -3)" />,
  redo: <path d="M15 7l4.5 4.5L15 16M19 11.5H9.5a5 5 0 0 0 0 10H13" transform="translate(0 -3)" />,
  more: (
    <>
      <circle cx="5.5" cy="12" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="18.5" cy="12" r="1.4" />
    </>
  ),
  share: (
    <>
      <path d="M12 15V3.5M8 7.5l4-4 4 4" />
      <path d="M5 12v6.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V12" />
    </>
  ),
  present: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M12 16v4M8 20h8M10.5 8.2l4 2.3-4 2.3z" />
    </>
  ),
  download: (
    <>
      <path d="M12 3.5V15M8 11l4 4 4-4" />
      <path d="M5 19.5h14" />
    </>
  ),
  back: <path d="M15 5l-7 7 7 7" />,
  fit: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  trash: <path d="M5 7h14M10 4h4M7 7l1 12.5h8L17 7M10 11v5M14 11v5" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  rect: <rect x="4" y="6" width="16" height="12" rx="2" />,
  ellipse: <ellipse cx="12" cy="12" rx="8.5" ry="6.5" />,
  line: <path d="M5 19L19 5" />,
  arrow: <path d="M5 19L19 5M10 5h9v9" />,
  link: (
    <>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3A4 4 0 0 0 13 5.3l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3 19c.7-3 3-4.8 6-4.8s5.3 1.8 6 4.8M16.5 5.6a3.2 3.2 0 0 1 0 5.8M18 14.4c1.6.6 2.7 2 3 4.6" />
    </>
  ),
  prev: <path d="M14.5 5l-7 7 7 7" />,
  next: <path d="M9.5 5l7 7-7 7" />,
};

export type WbIconName = keyof typeof paths;

export function WbIcon({ name, className = "size-6" }: { name: WbIconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {paths[name]}
    </svg>
  );
}
