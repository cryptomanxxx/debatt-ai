import { checkRateLimit } from "../../lib/kanalRateLimit";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const VALID_KEYS = new Set(["sinnesstamning", "konfliktniva", "svarssamarbete", "koalitionsbildning"]);

function sbHeaders() {
  return { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" };
}

export async function GET() {
  const res = await fetch(`${SB_URL}/rest/v1/platform_stamning?select=key,varde,antal_roster`, {
    headers: sbHeaders(),
    next: { revalidate: 60 },
  });
  if (!res.ok) return Response.json({ error: "DB-fel" }, { status: 502 });
  const rows = await res.json();
  const data = {};
  for (const r of rows) data[r.key] = { varde: Math.round(r.varde), antal_roster: r.antal_roster };
  return Response.json(data, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } });
}

export async function POST(req) {
  const rl = checkRateLimit(req, "platform-stamning", 5, 24 * 60 * 60 * 1000);
  if (!rl.ok) return Response.json({ error: "Du har redan röstat idag." }, { status: 429 });

  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: "Ogiltig förfrågan" }, { status: 400 });

  const updates = [];
  for (const key of VALID_KEYS) {
    const v = Number(body[key]);
    if (isNaN(v) || v < 0 || v > 100) return Response.json({ error: `Ogiltigt värde för ${key}` }, { status: 400 });
    updates.push({ key, v });
  }

  // Fetch current values to compute new average
  const cur = await fetch(`${SB_URL}/rest/v1/platform_stamning?select=key,varde,antal_roster,roster_summa`, {
    headers: sbHeaders(),
  }).then(r => r.json()).catch(() => []);

  const curMap = {};
  for (const r of cur) curMap[r.key] = r;

  for (const { key, v } of updates) {
    const c = curMap[key] || { varde: 50, antal_roster: 0, roster_summa: 0 };
    const nyAntal = c.antal_roster + 1;
    const nySumma = (c.roster_summa || c.varde * c.antal_roster) + v;
    const nyVarde = nySumma / nyAntal;
    await fetch(`${SB_URL}/rest/v1/platform_stamning?key=eq.${key}`, {
      method: "PATCH",
      headers: { ...sbHeaders(), Prefer: "return=minimal" },
      body: JSON.stringify({ varde: nyVarde, antal_roster: nyAntal, roster_summa: nySumma, uppdaterad: new Date().toISOString() }),
    });
  }

  return Response.json({ ok: true });
}
