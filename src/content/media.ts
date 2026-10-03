import type { MediaSpec } from "@/components/site/media-frame";

/**
 * Replace `video` / `image` / `poster` with real files (put them in /public)
 * and the placeholders disappear. TODO(content): supply real work.
 */
export const contentReel: MediaSpec[] = [
  { label: "Short-form video", caption: "Short-form", ratio: "9/16" },
  { label: "Ad creative", caption: "Meta ad creative", ratio: "9/16" },
  { label: "Shoot highlight", caption: "On-location shoots", ratio: "9/16" },
];
