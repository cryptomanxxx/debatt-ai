import { checkRateLimit } from "../../lib/kanalRateLimit";
import { logFel, getIp } from "../../lib/logFel";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Besökare väljer en nyhet från /nyhetskallor som de vill att agenterna ska
// debattera/skriva om. Skriver in i SAMMA amnesforslag-tabell som Direktdebattens
// "Tipsa agenterna om detta ämne →" (kalla skiljer dem åt för spårbarhet) — så att
// agent.py:s redan existerande hamta_amnesforslag()/markera_forslag_behandlat()-
// upphämtning fungerar oförändrat, ingen ny Python-kod behövs. agent.py använder
// amne som fri ämnestext (samma väg som "eget ämne"), inte som en citerad
// nyhetskälla med nyhetskalla-attribution — men summering (från /nyhetsanalyser:
// agentens egen AI-analys av nyheten, inte den råa RSS-rubriken) injiceras sedan
// PR #1362 i skriv_artikel()s extra_kontext (Codex-fynd: innan dess sparades den
// bara för spårbarhet men lästes aldrig, vilket gjorde tvåstegsflödet till
// /nyhetsanalyser funktionellt likvärdigt med att bara föreslå den råa rubriken).
export async function POST(req) {
  const ip = getIp(req);
  const rl = checkRateLimit(req, "nyhetsval", 15, 60 * 60 * 1000);
  if (!rl.ok) {
    logFel({ kalla: "nyhetsval", feltyp: "rate_limit", meddelande: "429 rate limit", ip, extra: { retryAfter: rl.retryAfter } });
    return Response.json({ fel: "För många förslag. Försök igen om en stund." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  }

  let body;
  try { body = await req.json(); }
  catch { return Response.json({ fel: "Ogiltig JSON" }, { status: 400 }); }

  const rubrik = (body.rubrik || "").trim();
  const kalla = (body.kalla || "").trim();
  const url = (body.url || "").trim();
  const beskrivning = (body.beskrivning || "").trim();
  if (!rubrik || rubrik.length < 2) {
    return Response.json({ fel: "Ogiltig nyhet." }, { status: 400 });
  }
  if (url && !/^https:\/\//.test(url)) {
    return Response.json({ fel: "Ogiltig URL." }, { status: 400 });
  }

  const amne = kalla ? `${rubrik} (nyhetskälla: ${kalla})` : rubrik;
  const summeringDelar = [beskrivning, url].filter(Boolean);

  const res = await fetch(`${SB_URL}/rest/v1/amnesforslag`, {
    method: "POST",
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      amne: amne.slice(0, 300),
      summering: summeringDelar.join("\n").slice(0, 1000) || null,
      kalla: "nyhetsval",
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    logFel({ kalla: "nyhetsval", feltyp: "supabase_fail", meddelande: `HTTP ${res.status}`, ip, extra: { errText: errText.slice(0, 300) } });
    return Response.json({ fel: "Kunde inte spara förslaget.", detalj: errText }, { status: 500 });
  }
  return Response.json({ ok: true });
}
