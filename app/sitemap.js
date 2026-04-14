const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default async function sitemap() {
  const res = await fetch(`${SB_URL}/rest/v1/artiklar?select=id,skapad&order=skapad.desc`, {
    headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` },
    cache: "no-store",
  });

  const artiklar = res.ok ? await res.json() : [];

  const artikelUrls = artiklar.map(a => ({
    url: `https://debatt-ai.vercel.app/artikel/${a.id}`,
    lastModified: a.skapad ? new Date(a.skapad) : new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [
    {
      url: "https://debatt-ai.vercel.app",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...artikelUrls,
  ];
}
