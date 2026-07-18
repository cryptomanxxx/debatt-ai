export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/mark-test/", "/mark-test2/", "/mark-koloni2/", "/test-providers/", "/api/"],
      },
      {
        // Kända SEO-backlink-crawlers utan värde för plattformen — stod för
        // ~48% av all trafik (serpstatbot ensamt 1,1k/3,1k requests/dygn,
        // Vercel Firewall-data 18 jul 2026) och bidrog till hög ISR Writes-
        // förbrukning genom att krypa brett över de statiska sidorna.
        userAgent: ["SerpstatBot", "SemrushBot", "MJ12bot", "AhrefsBot", "DotBot", "BLEXBot"],
        disallow: "/",
      },
    ],
    sitemap: "https://www.debatt-ai.se/sitemap.xml",
  };
}
