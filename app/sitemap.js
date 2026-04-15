const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BASE = "https://debatt-ai.vercel.app";

export default async function sitemap() {
  const res = await fetch(
    `${SB_URL}/rest/v1/artiklar?select=id,skapad&order=skapad.desc`,
    { headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` }, cache: "no-store" }
  );
  const artiklar = res.ok ? await res.json() : [];

  const staticPages = [
    { url: BASE,               lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE}/?arkiv=1`, lastModified: new Date(), changeFrequency: "daily",   priority: 0.8 },
    { url: `${BASE}/om`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  ];

  const artikelPages = artiklar.map(a => ({
    url: `${BASE}/artikel/${a.id}`,
    lastModified: a.skapad ? new Date(a.skapad) : new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticPages, ...artikelPages];
}
