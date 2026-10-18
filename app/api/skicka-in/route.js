import { checkRateLimit } from "../../lib/kanalRateLimit";
import { getDynamicChain, callWithFallback } from "../../lib/aiRouter";
import {
  valideraInlamning, byggBedomningsMeddelanden, tolkaBedomning,
  publiceringsToken, KATEGORI_FOR_TYP,
} from "../../lib/inlamning.mjs";
import { sparaInlamning, serviceKey } from "../../lib/inlamningDb";

// Tar emot en människas artikel, låter AI-redaktören bedöma den och sparar
// inlämningen med service role. Ersätter /api/analyze + klientens direkta
// INSERT i `inlamningar`: prompten byggs här, inte i webbläsaren, och
// poängen som sparas är de AI-redaktören faktiskt gav.

function extraheraGiltigJson(text) {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

export async function POST(request) {
  const rl = checkRateLimit(request, "analyze", 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return Response.json({ error: "För många förfrågningar. Försök igen senare." }, { status: 429 });
  }

  const key = serviceKey();
  if (!key) return Response.json({ error: "Inlämning är tillfälligt otillgänglig." }, { status: 503 });

  let body;
  try { body = await request.json(); } catch { return Response.json({ error: "Ogiltig JSON" }, { status: 400 }); }

  const { fel, data } = valideraInlamning(body);
  if (fel) return Response.json({ error: fel }, { status: 400 });

  if (!body.turnstileToken) return Response.json({ error: "CAPTCHA saknas" }, { status: 400 });
  const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: process.env.TURNSTILE_SECRET_KEY, response: body.turnstileToken }),
  });
  const verifyData = await verifyRes.json().catch(() => ({}));
  if (!verifyData.success) return Response.json({ error: "CAPTCHA-verifiering misslyckades" }, { status: 403 });

  let bedomning;
  try {
    const chain = await getDynamicChain("agent_submit");
    const svar = await callWithFallback(chain, byggBedomningsMeddelanden(data), {
      maxTokens: 600,
      temperature: 0.3,
      source: "analyze",
      validate: (text) => extraheraGiltigJson(text) !== null,
    });
    const raw = extraheraGiltigJson(svar.text);
    if (!raw) throw new Error("Kunde inte tolka AI-svar som JSON");
    bedomning = tolkaBedomning(raw);
  } catch (err) {
    return Response.json({ error: "AI-utvärdering misslyckades", detalj: err.message }, { status: 502 });
  }

  let id;
  try {
    id = await sparaInlamning(key, {
      rubrik: data.rubrik,
      forfattare: data.forfattare,
      artikel: data.artikel,
      kategori: KATEGORI_FOR_TYP[data.typ],
      motivering: bedomning.motivering,
      beslut: bedomning.beslut,
      arg: bedomning.arg, ori: bedomning.ori, rel: bedomning.rel, tro: bedomning.tro,
      taggar: bedomning.taggar,
      status: "inkorg",
      kalla: "manniska",
      bild_url: data.bild_url,
      bild_fotograf: data.bild_fotograf,
      youtube_video_id: data.youtube_video_id,
      filmrecension: data.typ === "filmrecension",
    });
  } catch (err) {
    return Response.json({ error: "Inlämningen kunde inte sparas", detalj: err.message }, { status: 502 });
  }

  return Response.json({
    resultat: bedomning,
    inlamning_id: id,
    token: publiceringsToken(id, bedomning.rubrik, key),
  });
}
