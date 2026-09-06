import { checkRateLimit } from "../../lib/kanalRateLimit";
import { logFel, getIp } from "../../lib/logFel";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Besökare väljer en nyhet från /nyhetskallor som de vill att agenterna ska
// debattera/skriva om. Skriver in i SAMMA amnesforslag-tabell som Direktdebattens
// "Tipsa agenterna om detta ämne →" (kalla skiljer dem åt för spårbarhet) — så att
// agent.py:s redan existerande hamta_amnesforslag()/markera_forslag_behandlat()-
// upphämtning fungerar oförändrat, ingen ny Python-kod behövs. summering (från
// /nyhetsanalyser: agentens egen AI-analys av nyheten, inte den råa RSS-rubriken)
// injiceras sedan PR #1362 i skriv_artikel()s extra_kontext.
//
// kalla_namn/kalla_url sparas ÄVEN strukturerat (utöver att ingå i den fria
// summering-texten) så att agent.py kan bygga en riktig nyhetskalla-post på
// artikeln — annars fick debattartiklar skrivna om en föreslagen nyhet ingen
// källänk alls, varken i metadata-boxen eller inline i artikeltexten (se
// supabase_amnesforslag_v2.sql).
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
      kalla_namn: kalla || null,
      kalla_url: url || null,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    logFel({ kalla: "nyhetsval", feltyp: "supabase_fail", meddelande: `HTTP ${res.status}`, ip, extra: { errText: errText.slice(0, 300) } });
    return Response.json({ fel: "Kunde inte spara förslaget.", detalj: errText }, { status: 500 });
  }
  return Response.json({ ok: true });
}
