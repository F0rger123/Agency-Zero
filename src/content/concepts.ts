/**
 * Concept website designs shown in the Websites section. They are FICTIONAL
 * businesses designed to show range — clearly labelled "Concept" in the UI.
 * Re-render / edit the scenes in design/mockups (npm run mockups), or replace
 * with real client screenshots (set `concept: false`).
 */
export type WebConcept = {
  name: string;
  kind: string;
  src: string;
  alt: string;
  tags: string[];
  concept: boolean;
};

export const webConcepts: WebConcept[] = [
  { name: "Halden Architects", kind: "Studio portfolio", src: "/images/mockups/web-studio.jpg", alt: "Concept website for an architecture studio: large headline beside a louvred concrete facade photograph", tags: ["Editorial layout", "Case-study CMS"], concept: true },
  { name: "Northline Plumbing", kind: "Local service business", src: "/images/mockups/web-local.jpg", alt: "Concept website for a plumbing company with a bold headline, call-to-action buttons and trust points", tags: ["Lead-gen focused", "Local SEO"], concept: true },
  { name: "Ember & Oak", kind: "Restaurant & booking", src: "/images/mockups/web-restaurant.jpg", alt: "Concept website for a wood-fired restaurant with a reservation widget over a plated dish", tags: ["Bookings", "Menus"], concept: true },
  { name: "Kairo Strength", kind: "Gym & memberships", src: "/images/mockups/web-fitness.jpg", alt: "Concept website for a strength gym with oversized type, barbell imagery and a live class timetable", tags: ["Timetable", "Memberships"], concept: true },
  { name: "Atlas & Reed Advisory", kind: "Professional services", src: "/images/mockups/web-advisory.jpg", alt: "Concept website for a financial advisory firm with a marble texture and clear service areas", tags: ["Trust & clarity", "Consultation booking"], concept: true },
];
