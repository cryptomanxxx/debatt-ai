const SB_URL   = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ADMIN_PW = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

function authorized(req) {
  const pw = req.headers.get("x-admin-password") || new URL(req.url).searchParams.get("pw");
  return pw === ADMIN_PW;
}

function sbh() {
  return { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" };
}

async function sbFetch(path) {
  try {
    const res = await fetch(`${SB_URL}/rest/v1/${path}`, { headers: sbh() });
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

export async function GET(req) {
  if (!authorized(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const action = new URL(req.url).searchParams.get("action") || "stats";
  const today  = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
  const week   = new Date(Date.now() - 7 * 86400000).toISOString();

  if (action === "stats") {
    const [beslutAll, beslutToday, beslutWeek,
           pisAll,    pisToday,    pisWeek,
           fragaAll,  fragaToday,  fragaWeek,
           debattAll, debattToday, debattWeek] = await Promise.all([
      sbFetch("beslut_log?select=id"),
      sbFetch(`beslut_log?select=id&skapad=gte.${encodeURIComponent(today)}`),
      sbFetch(`beslut_log?select=id,latency_ms&skapad=gte.${encodeURIComponent(week)}`),
      sbFetch("lagforslag?select=id&kalla=eq.api"),
      sbFetch(`lagforslag?select=id&kalla=eq.api&skapad=gte.${encodeURIComponent(today)}`),
      sbFetch(`lagforslag?select=id&kalla=eq.api&skapad=gte.${encodeURIComponent(week)}`),
      sbFetch("agent_fragor?select=id&fragare=eq.api"),
      sbFetch(`agent_fragor?select=id&fragare=eq.api&skapad=gte.${encodeURIComponent(today)}`),
      sbFetch(`agent_fragor?select=id&fragare=eq.api&skapad=gte.${encodeURIComponent(week)}`),
      sbFetch("debatt_log?select=id"),
      sbFetch(`debatt_log?select=id&skapad=gte.${encodeURIComponent(today)}`),
      sbFetch(`debatt_log?select=id&skapad=gte.${encodeURIComponent(week)}`),
    ]);

    const latencies = beslutWeek.map(r => r.latency_ms).filter(Boolean);
    const avgMs = latencies.length
      ? Math.round(latencies.reduce((s, v) => s + v, 0) / latencies.length)
      : null;

    return Response.json({
      beslut:  { total: beslutAll.length,  today: beslutToday.length,  week: beslutWeek.length, avg_latency_ms: avgMs },
      pis:     { total: pisAll.length,     today: pisToday.length,     week: pisWeek.length },
      fraga:   { total: fragaAll.length,   today: fragaToday.length,   week: fragaWeek.length },
      debatt:  { total: debattAll.length,  today: debattToday.length,  week: debattWeek.length },
    });
  }

  if (action === "log") {
    const [beslutLog, pisLog, fragaLog, debattLog] = await Promise.all([
      sbFetch("beslut_log?select=id,api_key,question,recommendation,probability,latency_ms,skapad&order=skapad.desc&limit=50"),
      sbFetch("lagforslag?select=id,titel,skapad&kalla=eq.api&order=skapad.desc&limit=50"),
      sbFetch("agent_fragor?select=id,agent,fraga,skapad&fragare=eq.api&order=skapad.desc&limit=50"),
      sbFetch("debatt_log?select=id,ip,amne,agenter,antal_inlagg,latency_ms,skapad&order=skapad.desc&limit=50"),
    ]);

    const entries = [
      ...beslutLog.map(r => ({
        id: `b-${r.id}`, api: "Decision API", skapad: r.skapad,
        key: r.api_key ? "nyckel" : "fri",
        content: r.question?.slice(0, 100) ?? "—",
        meta: r.recommendation ? `${r.recommendation} · ${Math.round((r.probability ?? 0) * 100)}% · ${r.latency_ms}ms` : "—",
      })),
      ...pisLog.map(r => ({
        id: `p-${r.id}`, api: "PIS API", skapad: r.skapad,
        key: "nyckel",
        content: r.titel?.slice(0, 100) ?? "—",
        meta: "policy simulation",
      })),
      ...fragaLog.map(r => ({
        id: `f-${r.id}`, api: "Agent Q&A API", skapad: r.skapad,
        key: "nyckel",
        content: `${r.agent}: ${r.fraga?.slice(0, 80) ?? ""}`,
        meta: "agent question",
      })),
      ...debattLog.map(r => ({
        id: `d-${r.id}`, api: "Debatt API", skapad: r.skapad,
        key: "fri",
        content: r.amne?.slice(0, 100) ?? "—",
        meta: `${r.agenter?.join(", ") ?? "—"} · ${r.antal_inlagg} inlägg · ${r.latency_ms}ms`,
      })),
    ];

    entries.sort((a, b) => new Date(b.skapad) - new Date(a.skapad));
    return Response.json(entries.slice(0, 100));
  }

  if (action === "keys") {
    const [keys, beslutLog, fragaLog] = await Promise.all([
      sbFetch("api_nycklar?select=id,key,name,rate_limit,aktiv,skapad&order=skapad.desc"),
      sbFetch("beslut_log?select=api_key"),
      sbFetch("agent_fragor?select=fragare&fragare=eq.api"),
    ]);

    // Count beslut_log calls per key
    const beslutCount = {};
    for (const r of beslutLog) {
      if (r.api_key) beslutCount[r.api_key] = (beslutCount[r.api_key] || 0) + 1;
    }

    return Response.json(keys.map(k => ({
      ...k,
      beslut_anrop: beslutCount[k.key] || 0,
      fraga_anrop:  fragaLog.length, // approximate — no per-key tracking for fraga
    })));
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}

export async function POST(req) {
  if (!authorized(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: "Invalid body" }, { status: 400 });

  if (body.action === "create") {
    const { name, rate_limit } = body;
    if (!name?.trim()) return Response.json({ error: "name required" }, { status: 400 });
    const key = "dai_" + Array.from(crypto.getRandomValues(new Uint8Array(18)))
      .map(b => b.toString(16).padStart(2, "0")).join("");
    const res = await fetch(`${SB_URL}/rest/v1/api_nycklar`, {
      method: "POST",
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({ key, name: name.trim(), rate_limit: rate_limit || 100 }),
    });
    return Response.json(await res.json(), { status: res.ok ? 200 : 500 });
  }

  if (body.action === "toggle") {
    const { id, aktiv } = body;
    if (!id) return Response.json({ error: "id required" }, { status: 400 });
    const res = await fetch(`${SB_URL}/rest/v1/api_nycklar?id=eq.${id}`, {
      method: "PATCH",
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ aktiv }),
    });
    return Response.json({ ok: res.ok });
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
