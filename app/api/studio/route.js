/**
 * POST /api/studio — genererar ett kort Anna+Peter-studiosamtal om en enskild
 * nyhet, utlöst från /nyhetsanalyser (flyttades dit från /nyhetskallor, se
 * ai-bus/context.md). Ren textdialog via den centrala LLM-routern
 * (callWithFallback + getDynamicChain) — ljuduppspelningen sker helt
 * klientsidan i StudioOverlay.js via responsiveVoice, precis som den
 * befintliga uppläsningsfunktionen (AgentOverlay.js).
 */

import { callWithFallback, getDynamicChain } from "../../lib/aiRouter.js";
import { checkRateLimit } from "../../lib/kanalRateLimit";

const SYSTEM = `Du producerar ett kort studiosamtal för Debatt-AI om en nyhet.

Anna är nyhetsankare — neutral, tydlig, ställer korta följdfrågor.
Peter är nationalekonom — analyserar ekonomiska konsekvenser, incitament, risker och samhällseffekter i karaktär.

Utgå ENDAST från den nyhet som anges i användarmeddelandet. Hitta INTE på fakta, siffror eller detaljer
som inte finns i materialet — om nyheten saknar tillräckligt underlag för ekonomisk analys ska Peter säga
det rakt ut och resonera försiktigt istället för att gissa.

Regler:
- 4–6 repliker totalt, växelvis mellan Anna och Peter. Anna börjar.
- Varje replik: 1–3 meningar, naturligt talspråk. Inga listor, rubriker eller emojis.
- Anna presenterar nyheten kort och ställer minst en fråga till Peter.
- Peter tillför analys och perspektiv — inte bara en omformulering av nyheten.
- Undvik klyschor och generiska avslutningar ("framtiden får utvisa" och liknande).
- Skriv på svenska.

Svara ENDAST med giltig JSON i exakt detta format — inga andra fält, ingen markdown, ingen förklaring:
{"turns":[{"speaker":"anna","text":"..."},{"speaker":"peter","text":"..."}]}`;

const MAX_TURNS = 6;
const MAX_TURN_LEN = 400;

function parseTurns(raw) {
  let text = (raw || "").trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  let parsed;
  try {
    parsed = JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!Array.isArray(parsed?.turns)) return null;

  const turns = parsed.turns
    .filter(t => t && (t.speaker === "anna" || t.speaker === "peter") && typeof t.text === "string" && t.text.trim().length >= 5)
    .slice(0, MAX_TURNS)
    .map(t => ({ speaker: t.speaker, text: t.text.trim().slice(0, MAX_TURN_LEN) }));

  return turns.length >= 2 ? turns : null;
}

export async function POST(req) {
  const rl = checkRateLimit(req, "studio", 15, 10 * 60 * 1000);
  if (!rl.ok) {
    return Response.json(
      { error: "För många förfrågningar — försök igen om en stund." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Ogiltig JSON" }, { status: 400 }); }

  const rubrik = (body?.rubrik || "").trim().slice(0, 300);
  const beskrivning = (body?.beskrivning || "").trim().slice(0, 800);
  if (!rubrik) return Response.json({ error: "Fältet 'rubrik' saknas." }, { status: 400 });

  const userPrompt = `NYHET:\nRubrik: ${rubrik}\nBeskrivning: ${beskrivning || "(ingen beskrivning tillgänglig)"}`;

  try {
    const chain = await getDynamicChain("chatt");
    const { text } = await callWithFallback(chain,
      [
        { role: "system", content: SYSTEM },
        { role: "user", content: userPrompt },
      ],
      // validate: en provider som svarar med giltig JSON men för få repliker
      // (eller trasig JSON) ska räknas som misslyckad så callWithFallback
      // går vidare till nästa provider i kedjan, istället för att låsa fast
      // vid ett obrukbart svar från den första som råkar svara 200.
      { maxTokens: 700, temperature: 0.75, json: true, source: "studio", validate: (t) => !!parseTurns(t) }
    );

    const turns = parseTurns(text);
    if (!turns) return Response.json({ error: "Kunde inte tolka studiosamtalet — försök igen." }, { status: 502 });

    return Response.json({ turns });
  } catch {
    return Response.json({ error: "Alla AI-leverantörer misslyckades — försök igen om en stund." }, { status: 502 });
  }
}
