export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/mark-test/", "/mark-test2/", "/mark-koloni2/", "/test-providers/", "/api/"],
    },
    sitemap: "https://www.debatt-ai.se/sitemap.xml",
  };
}
