const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
// Service role bypasses RLS — håller nyckel server-side borta från klienten
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const AGENT_MÅL = {
  "Pensionären": 5, "Mamman": 7, "Den lugna": 8, "Den trötta": 6,
  "Optimisten": 12, "Den nostalgiske": 13, "Hypokondrikern": 14, "Den sura": 15,
  "Den stressade": 16, "Journalist": 22, "Läkare": 24, "Psykolog": 25,
  "Sociolog": 26, "Historiker": 28, "Miljöaktivist": 32, "Filosof": 35,
  "Nationalekonom": 38, "Jurist": 40, "Konservativ debattör": 42,
  "Den rike": 45, "Teknikoptimist": 50, "Den hungriga": 52,
  "Kryptoanalytiker": 60, "Tonåringen": 70,
};

export async function POST(req) {
  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: "Ogiltig förfrågan" }, { status: 400 });

  const { spelnamn, agent_namn, poang, vann } = body;

  if (!spelnamn || typeof spelnamn !== "string") {
    return Response.json({ error: "Ogiltigt spelnamn" }, { status: 400 });
  }
  const namn = spelnamn.trim();
  if (namn.length < 2 || namn.length > 20) {
    return Response.json({ error: "Spelnamnet måste vara 2–20 tecken" }, { status: 400 });
  }
  if (!(agent_namn in AGENT_MÅL)) {
    return Response.json({ error: "Okänd agent" }, { status: 400 });
  }
  if (typeof poang !== "number" || !Number.isInteger(poang) || poang < 0 || poang > 200) {
    return Response.json({ error: "Ogiltig poäng" }, { status: 400 });
  }

  // Validera vinst-anspråket: spelet stannar exakt på target, aldrig högre
  const target = AGENT_MÅL[agent_namn];
  const claimedVann = Boolean(vann);
  if (claimedVann && poang !== target) {
    return Response.json({ error: "Ogiltig vinst — poängen stämmer inte med agentens mål" }, { status: 400 });
  }

  const r = await fetch(`${SB_URL}/rest/v1/snake_poang`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ spelnamn: namn, agent_namn, poang, vann: claimedVann }),
  });

  if (!r.ok) {
    return Response.json({ error: "Kunde inte spara poäng" }, { status: 500 });
  }
  return Response.json({ ok: true });
}
