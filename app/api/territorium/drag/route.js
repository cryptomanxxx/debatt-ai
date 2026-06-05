const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const H = {
  apikey:        SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  "Content-Type": "application/json",
  Prefer:        "return=minimal",
};

async function sbGet(table, qs) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?${qs}`, { headers: H });
  return r.ok ? r.json() : [];
}

function isAdjacent(col1, row1, col2, row2) {
  const dc = col2 - col1;
  const dr = row2 - row1;
  if (dr === 0) return Math.abs(dc) === 1;
  if (Math.abs(dr) === 1) {
    if (row1 % 2 === 0) return dc === 0 || dc === -1;
    else                return dc === 0 || dc === 1;
  }
  return false;
}

export async function POST(req) {
  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: "Ogiltig förfrågan" }, { status: 400 });

  const { event_id, hex_id, drag_typ, agare } = body;
  if (!event_id || !hex_id || !drag_typ || !agare)
    return Response.json({ error: "Saknar parametrar" }, { status: 400 });

  if (!["expandera", "attackera", "forsvara"].includes(drag_typ))
    return Response.json({ error: "Ogiltig dragtyp" }, { status: 400 });

  if (typeof agare !== "string" || agare.length < 2 || agare.length > 20)
    return Response.json({ error: "Smeknamnet måste vara 2–20 tecken" }, { status: 400 });

  const events = await sbGet("territorium_events", `id=eq.${event_id}&status=eq.aktiv`);
  if (!events.length) return Response.json({ error: "Inget aktivt event" }, { status: 400 });

  // Ett drag per timme per spelare
  const enTimmeSen = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const nyligaDrag = await sbGet(
    "territorium_drag",
    `event_id=eq.${event_id}&agare=eq.${encodeURIComponent(agare)}&skapad=gte.${enTimmeSen}`,
  );
  if (nyligaDrag.length > 0)
    return Response.json({ error: "Du har redan gjort ett drag den senaste timmen. Kom tillbaka snart!" }, { status: 429 });

  const [hexes, allAgare, allHexes] = await Promise.all([
    sbGet("territorium_hexagoner", `id=eq.${hex_id}&event_id=eq.${event_id}`),
    sbGet("territorium_agare",    `event_id=eq.${event_id}`),
    sbGet("territorium_hexagoner", `event_id=eq.${event_id}`),
  ]);

  if (!hexes.length) return Response.json({ error: "Hexagon hittades inte" }, { status: 404 });
  const mål = hexes[0];

  const agaByHex = Object.fromEntries(allAgare.map(a => [a.hex_id, a]));
  const mina     = allHexes.filter(h => agaByHex[h.id]?.agare === agare);
  const målAgare = agaByHex[hex_id];

  // Adjacency-krav gäller bara expandera och attackera, inte forsvara
  if (drag_typ !== "forsvara") {
    if (mina.length > 0) {
      const adj = mina.some(h => isAdjacent(h.hex_col, h.hex_row, mål.hex_col, mål.hex_row));
      if (!adj)
        return Response.json({ error: "Hexagonen angränsar inte till dina territorier" }, { status: 400 });
    } else if (drag_typ !== "expandera") {
      return Response.json({ error: "Du måste erövra ett territorium först" }, { status: 400 });
    }
  }

  async function logDrag(resultat) {
    await fetch(`${SB_URL}/rest/v1/territorium_drag`, {
      method: "POST", headers: H,
      body: JSON.stringify({ event_id, agare, agare_typ: "besokare", hex_id, drag_typ, resultat }),
    });
  }

  // --- EXPANDERA ---
  if (drag_typ === "expandera") {
    if (målAgare)
      return Response.json({ error: "Hexagonen är redan ockuperad — attackera istället" }, { status: 400 });
    await fetch(`${SB_URL}/rest/v1/territorium_agare`, {
      method: "POST", headers: H,
      body: JSON.stringify({ event_id, hex_id, agare, agare_typ: "besokare", forsvar: 1 }),
    });
    await logDrag("lyckades");
    return Response.json({ meddelande: `🏴 ${mål.namn} erövrat!` });
  }

  // --- FÖRSVARA ---
  if (drag_typ === "forsvara") {
    if (målAgare?.agare !== agare)
      return Response.json({ error: "Du äger inte detta territorium" }, { status: 400 });
    const nuv = målAgare.forsvar ?? 1;
    if (nuv >= 3)
      return Response.json({ error: "Maximalt försvar (🛡️🛡️🛡️) redan uppnått" }, { status: 400 });
    await fetch(`${SB_URL}/rest/v1/territorium_agare?event_id=eq.${event_id}&hex_id=eq.${hex_id}`, {
      method: "PATCH", headers: H,
      body: JSON.stringify({ forsvar: nuv + 1 }),
    });
    await logDrag("lyckades");
    return Response.json({ meddelande: `🛡️ ${mål.namn} befäst! (${nuv + 1}/3)` });
  }

  // --- ATTACKERA ---
  if (drag_typ === "attackera") {
    if (!målAgare)
      return Response.json({ error: "Hexagonen är ledig — erövra istället" }, { status: 400 });
    if (målAgare.agare === agare)
      return Response.json({ error: "Du kan inte attackera dig själv" }, { status: 400 });

    const adjCount = mina.filter(h =>
      isAdjacent(h.hex_col, h.hex_row, mål.hex_col, mål.hex_row)
    ).length;
    const forsvar   = målAgare.forsvar ?? 1;
    const lyckades  = adjCount > forsvar;

    if (lyckades) {
      await fetch(`${SB_URL}/rest/v1/territorium_agare?event_id=eq.${event_id}&hex_id=eq.${hex_id}`, {
        method: "PATCH", headers: H,
        body: JSON.stringify({ agare, agare_typ: "besokare", forsvar: 1 }),
      });
    }
    await logDrag(lyckades ? "lyckades" : "misslyckades");
    return Response.json({
      meddelande: lyckades
        ? `⚔️ Attacken lyckades! ${mål.namn} är nu ditt!`
        : `⚔️ Attacken misslyckades — ${målAgare.agare}s försvar höll (${forsvar}🛡️ mot dina ${adjCount} angränsande territorier).`,
    });
  }
}
