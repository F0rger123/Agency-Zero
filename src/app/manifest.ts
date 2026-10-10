import type { MetadataRoute } from "next";

/** Lets the CRM be installed as an app (home screen / desktop) and opens straight into it. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Agency Zero",
    short_name: "Agency Zero",
    description: "Agency Zero CRM",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#ffffff",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
