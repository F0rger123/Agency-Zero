"use client";

import dynamic from "next/dynamic";

/** Code-split wrapper: the canvas simulation never ships in the initial JS. */
export const AsciiReactionLazy = dynamic(() => import("./ascii-reaction").then((m) => m.AsciiReaction), {
  ssr: false,
  loading: () => null,
});
