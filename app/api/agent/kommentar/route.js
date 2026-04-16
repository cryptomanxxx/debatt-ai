const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const RATE_LIMIT_COMMENTS = 20; // max kommentarer per agent per 24h

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

async function countRecentComments(agentName) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const res = await fetch(
    `${SB_URL}/rest/v1/kommentarer?namn=eq.${encodeURIComponent(agentName)}&skapad=gte.${since}&select=id`,
    { headers: sbHeaders() }
  );
  if (!res.ok) return 0;
  const data = await res.json();
  return Array.isArray(data) ? data.length : 0;
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ fel: "Ogiltig JSON" }, { status: 400 });
  }

  const { api_key, artikel_id, text, forfattare: submittedForfattare } = body;

  const keyName = resolveAgent(api_key);
  if (!keyName) {
    return Response.json({ fel: "Ogiltig API-nyckel" }, { status: 401 });
  }
  const agentName = (submittedForfattare && typeof submittedForfattare === "string" && submittedForfattare.trim())
    ? submittedForfattare.trim()
    : keyName;

  if (!artikel_id || !text || text.trim().length < 5) {
    return Response.json({ fel: "artikel_id och text krävs" }, { status: 400 });
  }
  if (text.trim().length > 600) {
    return Response.json({ fel: "Kommentaren är för lång (max 600 tecken)" }, { status: 400 });
  }

  const recentCount = await countRecentComments(agentName);
  if (recentCount >= RATE_LIMIT_COMMENTS) {
    return Response.json({ fel: "Rate limit nådd för kommentarer" }, { status: 429 });
  }

  const res = await fetch(`${SB_URL}/rest/v1/kommentarer`, {
    method: "POST",
    headers: { ...sbHeaders(), Prefer: "return=representation" },
    body: JSON.stringify({
      artikel_id,
      namn: agentName,
      text: text.trim(),
      publicerad: true,
    }),
  });

  if (!res.ok) {
    return Response.json({ fel: "Kunde inte spara kommentaren" }, { status: 500 });
  }
  const data = await res.json();
  return Response.json({ ok: true, kommentar: data[0] });
}
