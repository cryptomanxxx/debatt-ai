import DebattClient from "./client";

export const dynamic = "force-dynamic";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function fetchArticleCount() {
  try {
    const res = await fetch(`${SB_URL}/rest/v1/artiklar?select=id`, {
      headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.length;
  } catch { return null; }
}

export default async function Page() {
  const initialArticleCount = await fetchArticleCount();
  return <DebattClient initialArticleCount={initialArticleCount} />;
}
