import { checkRateLimit } from "../../../lib/kanalRateLimit";
import { passerarKrav, publiceringsTokenMatchar } from "../../../lib/inlamning.mjs";
import { hamtaInlamning, publiceraInlamning, serviceKey } from "../../../lib/inlamningDb";

// Publicerar den egna inlämningen. Kräver token från /api/skicka-in (bevisar
// att anroparen skickade in den) och att de SPARADE poängen når gränsen —
// klienten kan inte skicka med egna poäng, text eller fält.
export async function POST(request) {
  const rl = checkRateLimit(request, "skicka-in-publicera", 10, 60 * 60 * 1000);
  if (!rl.ok) return Response.json({ error: "För många förfrågningar." }, { status: 429 });

  const key = serviceKey();
  if (!key) return Response.json({ error: "Publicering är tillfälligt otillgänglig." }, { status: 503 });

  let body;
  try { body = await request.json(); } catch { return Response.json({ error: "Ogiltig JSON" }, { status: 400 }); }
  const id = Number(body?.inlamning_id);
  if (!Number.isInteger(id) || id <= 0) return Response.json({ error: "Ogiltigt id" }, { status: 400 });

  const rubrikForslag = typeof body.rubrik_forslag === "string" && body.rubrik_forslag ? body.rubrik_forslag : null;
  const anvandForslag = body.anvand_forslag === true && rubrikForslag;
  if (!publiceringsTokenMatchar(id, rubrikForslag, body.token, key)) {
    return Response.json({ error: "Ogiltig publiceringstoken" }, { status: 403 });
  }

  try {
    const inl = await hamtaInlamning(key, id);
    if (!inl || inl.kalla === "ai") return Response.json({ error: "Inlämningen finns inte" }, { status: 404 });
    if (inl.status !== "inkorg") return Response.json({ error: "Inlämningen är redan hanterad" }, { status: 409 });
    if (!passerarKrav(inl)) return Response.json({ error: "Poängen räcker inte för publicering" }, { status: 403 });

    const utfall = await publiceraInlamning(key, inl, {
      rubrik: anvandForslag ? rubrikForslag : null,
      franStatus: "inkorg",
    });
    if (utfall.konflikt) return Response.json({ error: "Inlämningen är redan hanterad" }, { status: 409 });
    return Response.json({ ok: true, artikel_id: utfall.artikelId });
  } catch (err) {
    return Response.json({ error: "Publicering misslyckades", detalj: err.message }, { status: 502 });
  }
}
