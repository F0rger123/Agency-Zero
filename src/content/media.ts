import type { MediaSpec } from "@/components/site/media-frame";

/**
 * The content/ads reel. Each entry is a rendered mockup today (see
 * design/mockups). To use real work: set `video` (+ `poster`) or replace `image`
 * with a file in /public — nothing else changes. TODO(content): supply real work.
 */
export const contentReel: MediaSpec[] = [
  { label: "Short-form video", caption: "Short-form · hook-led reel", ratio: "2/3", image: "/images/mockups/reel-1.jpg" },
  { label: "Before / after", caption: "Short-form · before / after", ratio: "2/3", image: "/images/mockups/reel-2.jpg" },
  { label: "Shoot day", caption: "On-location shoot day", ratio: "2/3", image: "/images/mockups/reel-3.jpg" },
];

export const adCreative: MediaSpec[] = [
  { label: "Meta ad", caption: "Meta feed ad · local service", ratio: "4/5", image: "/images/mockups/ad-1.jpg" },
  { label: "Meta ad", caption: "Meta carousel ad · hospitality", ratio: "4/5", image: "/images/mockups/ad-2.jpg" },
];

/** Lead-generation examples shown beside the ads: ads that ask people to act, and the conversations that follow. */
export const leadCreative: MediaSpec[] = [
  { label: "Work with us", caption: "Meta ad · free strategy call", ratio: "4/5", image: "/images/mockups/ad-work.jpg" },
  { label: "Register", caption: "Meta ad · register for a free week", ratio: "4/5", image: "/images/mockups/ad-register.jpg" },
  { label: "Instagram DM", caption: "A DM from an ad becomes a booked job", ratio: "4/5", image: "/images/mockups/lead-dm.jpg" },
  { label: "Comments", caption: "Comments turn into sign-ups", ratio: "4/5", image: "/images/mockups/lead-comments.jpg" },
];
