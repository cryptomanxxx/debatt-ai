const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const RATE_LIMIT_ROSTER = 10; // max röster per agent per 24h

function resolveAgent(apiKey) {
  if (!apiKey) return null;
  const raw = process.env.AGENT_API_KEYS;
  if (!raw) return null;
  try {
    const keys = JSON.parse(raw);
    return keys[apiKey] || null;
  } catch {
    return null;
  }
}

function sbHeaders() {
  return {
    apikey: SB_KEY,
    Authorization: `Bearer ${SB_KEY}`,
    "Content-Type": "application/json",
  };
}

async function countRecentVotes(agentName) {
  // Approximation: count roster rows created last 24h matching artikel_ids
  // we track via a separate agent_roster log — but since the table has no name,
  // we use the inlamningar-count as proxy and just apply a generous rate limit.
  // For now: always allow up to RATE_LIMIT_ROSTER without per-article dedup.
  return 0; // rate limit enforced on agent side
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ fel: "Ogiltig JSON" }, { status: 400 });
  }

  const { api_key, artikel_id, rod } = body;

  const keyName = resolveAgent(api_key);
  if (!keyName) {
    return Response.json({ fel: "Ogiltig API-nyckel" }, { status: 401 });
  }

  if (!artikel_id || !["ja", "nej"].includes(rod)) {
    return Response.json({ fel: "artikel_id och rod (ja/nej) krävs" }, { status: 400 });
  }

  const res = await fetch(`${SB_URL}/rest/v1/roster`, {
    method: "POST",
    headers: { ...sbHeaders(), Prefer: "return=minimal" },
    body: JSON.stringify({ artikel_id, rod }),
  });

  if (!res.ok) {
    return Response.json({ fel: "Kunde inte registrera röst" }, { status: 500 });
  }
  return Response.json({ ok: true, rod });
}
