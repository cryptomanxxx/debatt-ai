const SB_URL  = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ADMIN_PW = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

function authorized(req) {
  const pw = req.headers.get("x-admin-password") || new URL(req.url).searchParams.get("pw");
  return pw === ADMIN_PW;
}

function sbh() {
  return { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" };
}

// GET ?pw=...&action=log|keys|stats
export async function GET(req) {
  if (!authorized(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const action = new URL(req.url).searchParams.get("action") || "log";

  if (action === "log") {
    const res = await fetch(
      `${SB_URL}/rest/v1/beslut_log?order=skapad.desc&limit=100&select=id,api_key,ip,question,agents_used,recommendation,probability,latency_ms,skapad`,
      { headers: sbh() }
    );
    return Response.json(await res.json());
  }

  if (action === "keys") {
    const res = await fetch(
      `${SB_URL}/rest/v1/api_nycklar?order=skapad.desc&select=id,key,name,rate_limit,aktiv,skapad`,
      { headers: sbh() }
    );
    return Response.json(await res.json());
  }

  if (action === "stats") {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const week  = new Date(Date.now() - 7 * 86400000).toISOString();

    const [totalRes, todayRes, weekRes] = await Promise.all([
      fetch(`${SB_URL}/rest/v1/beslut_log?select=id`, { headers: sbh() }),
      fetch(`${SB_URL}/rest/v1/beslut_log?select=id&skapad=gte.${encodeURIComponent(today)}`, { headers: sbh() }),
      fetch(`${SB_URL}/rest/v1/beslut_log?select=latency_ms&skapad=gte.${encodeURIComponent(week)}`, { headers: sbh() }),
    ]);

    const [total, todayData, weekData] = await Promise.all([
      totalRes.json(), todayRes.json(), weekRes.json(),
    ]);

    const latencies = weekData.map(r => r.latency_ms).filter(Boolean);
    const avgLatency = latencies.length
      ? Math.round(latencies.reduce((s, v) => s + v, 0) / latencies.length)
      : null;

    return Response.json({
      total: total.length,
      today: todayData.length,
      week:  weekData.length,
      avg_latency_ms: avgLatency,
    });
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}

// POST — skapa eller uppdatera nyckel
export async function POST(req) {
  if (!authorized(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: "Invalid body" }, { status: 400 });

  const { action } = body;

  if (action === "create") {
    const { name, rate_limit } = body;
    if (!name?.trim()) return Response.json({ error: "name required" }, { status: 400 });

    const key = "dai_" + Array.from(crypto.getRandomValues(new Uint8Array(18)))
      .map(b => b.toString(16).padStart(2, "0")).join("");

    const res = await fetch(`${SB_URL}/rest/v1/api_nycklar`, {
      method: "POST",
      headers: { ...sbh(), Prefer: "return=representation" },
      body: JSON.stringify({ key, name: name.trim(), rate_limit: rate_limit || 100 }),
    });
    return Response.json(await res.json(), { status: res.ok ? 200 : 500 });
  }

  if (action === "toggle") {
    const { id, aktiv } = body;
    if (!id) return Response.json({ error: "id required" }, { status: 400 });

    const res = await fetch(`${SB_URL}/rest/v1/api_nycklar?id=eq.${id}`, {
      method: "PATCH",
      headers: { ...sbh(), Prefer: "return=minimal" },
      body: JSON.stringify({ aktiv }),
    });
    return Response.json({ ok: res.ok });
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
