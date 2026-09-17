import type { IconName } from "@/lib/nav";
import type { JSX } from "react";

/**
 * Minimal monochrome line icons (stroke = currentColor, no fills).
 * Drawn on a 24px grid; grayscale only — MASTER_SPEC §3.
 */
const paths: Record<string, JSX.Element> = {
  dashboard: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
    </>
  ),
  clients: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.9-3.4 3.7-5.5 7-5.5s6.1 2.1 7 5.5" />
    </>
  ),
  projects: (
    <path d="M3.5 6.5c0-1.1.9-2 2-2h4l2 2.5h7c1.1 0 2 .9 2 2v8.5c0 1.1-.9 2-2 2h-13c-1.1 0-2-.9-2-2z" />
  ),
  tasks: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8.5 12.5l2.4 2.4 4.6-5.2" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 9.5h16M8 3v3.5M16 3v3.5" />
    </>
  ),
  quotes: (
    <>
      <path d="M14 3.5H7C6.2 3.5 5.5 4.2 5.5 5v14c0 .8.7 1.5 1.5 1.5h10c.8 0 1.5-.7 1.5-1.5V8z" />
      <path d="M14 3.5V8h4.5" />
      <path d="M9 13h6M9 16.5h6" />
    </>
  ),
  contracts: (
    <>
      <path d="M14 3.5H7C6.2 3.5 5.5 4.2 5.5 5v14c0 .8.7 1.5 1.5 1.5h10c.8 0 1.5-.7 1.5-1.5V8z" />
      <path d="M14 3.5V8h4.5" />
      <path d="M9 14.5l2 2 4-4.5" />
    </>
  ),
  invoices: (
    <>
      <path d="M6 3.5h12V20l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4L6 20z" />
      <path d="M9.5 8.5h5M9.5 12h5" />
    </>
  ),
  social: (
    <>
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="17" cy="5.5" r="2.5" />
      <circle cx="17" cy="18.5" r="2.5" />
      <path d="M8.3 10.9l6.4-4M8.3 13.1l6.4 4" />
    </>
  ),
  marketing: (
    <>
      <path d="M4 20.5h16" />
      <rect x="5.5" y="10" width="3.2" height="7" rx="0.5" />
      <rect x="10.4" y="6" width="3.2" height="11" rx="0.5" />
      <rect x="15.3" y="13" width="3.2" height="4" rx="0.5" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7.5h8.5M17.5 7.5H20" />
      <circle cx="15" cy="7.5" r="2" />
      <path d="M4 16.5h2.5M11.5 16.5H20" />
      <circle cx="9" cy="16.5" r="2" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
};

export function Icon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {paths[name]}
    </svg>
  );
}
