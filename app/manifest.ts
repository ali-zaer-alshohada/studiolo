import type { MetadataRoute } from "next";

/**
 * PWA manifest. Next 16 serves this as `/manifest.webmanifest` automatically.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "studiolo · italian SRS",
    short_name: "studiolo",
    description: "Un'edizione critica del tuo italiano",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f1e8",
    theme_color: "#1a3050",
    orientation: "portrait",
    lang: "it",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
