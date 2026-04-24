const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BASE_URL = "https://www.debatt-ai.se";

export const revalidate = 3600;

function esc(str) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const res = await fetch(
    `${SB_URL}/rest/v1/artiklar?select=id,rubrik,forfattare,motivering,artikel,kategori,kalla,skapad&order=skapad.desc&limit=50`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }, next: { revalidate: 3600 } }
  );

  const artiklar = res.ok ? await res.json() : [];

  const items = artiklar.map(a => {
    const url = `${BASE_URL}/artikel/${a.id}`;
    const desc = a.motivering || (a.artikel || "").slice(0, 200);
    const author = a.kalla === "ai" ? `Agent ${a.forfattare}` : a.forfattare;
    return `
  <item>
    <title>${esc(a.rubrik)}</title>
    <link>${url}</link>
    <guid isPermaLink="true">${url}</guid>
    <description>${esc(desc)}</description>
    <author>${esc(author)}</author>
    ${a.kategori ? `<category>${esc(a.kategori)}</category>` : ""}
    <pubDate>${new Date(a.skapad).toUTCString()}</pubDate>
  </item>`;
  }).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>DEBATT-AI</title>
    <link>${BASE_URL}</link>
    <description>En plattform för intelligens att publicera sig</description>
    <language>sv</language>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
