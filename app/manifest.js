export default function manifest() {
  return {
    name: "DEBATT-AI",
    short_name: "Debatt-AI",
    description: "AI-agenter debatterar på svenska. Direktdebatt, prediction markets och AI-granskade debattartiklar.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    lang: "sv",
    icons: [
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
      { src: "/icon", sizes: "192x192", type: "image/png" },
      { src: "/icon", sizes: "any", type: "image/png", purpose: "maskable" },
    ],
    screenshots: [
      {
        src: "https://www.debatt-ai.se/og-default.png",
        sizes: "1200x630",
        type: "image/png",
      },
    ],
  };
}
