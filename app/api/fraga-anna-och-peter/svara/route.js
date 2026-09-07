/**
 * POST /api/fraga-anna-och-peter/svara — frågeläget på /fraga-anna-och-peter.
 * Sidan var ursprungligen tänkt som en frågesida men blev bara en
 * uppläsningssida (fri text lästes ordagrant, ingen LLM inblandad). Klientens
 * arFraga()-heuristik (se page.js) avgör om den inklistrade texten är en
 * fråga — är den det anropas den här routen för att generera ett kort svar
 * i karaktär, som sedan läses upp istället för den råa frågan.
 *
 * Samma mönster som /api/studio/route.js: central LLM-router
 * (callWithFallback + getDynamicChain), aldrig en hårdkodad providerklient.
 * Skillnaden är att svaret är ren text, inte strukturerad JSON.
 */

import { callWithFallback, getDynamicChain } from "../../../lib/aiRouter.js";
import { checkRateLimit } from "../../../lib/kanalRateLimit";

// Persona-beskrivningarna för Anna/Peter/Johan är medvetet samma korta
// karaktärisering som redan används i /api/studio/route.js SYSTEM, så de
// aldrig kan glida isär mellan sidorna. Oraklet har ingen motsvarighet i
// studio.js (deltar inte i tre-ankars-studiosamtalet, se CLAUDE.md ✅93) —
// beskrivningen här matchar istället hans etablerade "pedagogisk
// professor"-persona från /universitet (✅87).
const PERSONAS = {
  Anna: "Du är Anna, nyhetsankare på Debatt-AI — neutral, tydlig och saklig. Du svarar kort och rakt på sak, utan att ta politisk ställning.",
  Nationalekonom: "Du är Peter, nationalekonom på Debatt-AI — du analyserar frågor genom kostnadsanalys, incitament och marknadslogik, i karaktär.",
  Teknikoptimist: "Du är Johan, teknikoptimist på Debatt-AI — du ser möjligheter och innovation, och resonerar kring hur teknik och förändring driver eller påverkar det som frågas om, i karaktär.",
  Oraklet: "Du är Professor Oraklet på Debatt-AI — en klok, pedagogisk professor som förklarar komplicerade saker enkelt och begripligt, med bred allmänbildning.",
};

const SYSTEM_SUFFIX = `

En besökare på debatt-ai.se har ställt dig en fråga i fritext. Svara koncist och i karaktär —
2–5 meningar, lämpligt för att läsas upp högt. Skriv på svenska, löpande prosa, inga listor eller
rubriker.

Hitta ALDRIG på specifika fakta, siffror, namn eller aktuella händelser du inte är säker på —
frågan saknar en given källa att grunda ett svar i. Resonera allmänt eller säg uttryckligen att du
är osäker istället för att gissa.`;

const MAX_FRAGA = 1500; // matchar TEXT_MAX i page.js
const MAX_SVAR = 900;

export async function POST(req) {
  const rl = checkRateLimit(req, "fraga-svara", 20, 10 * 60 * 1000);
  if (!rl.ok) {
    return Response.json(
      { error: "För många förfrågningar — försök igen om en stund." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Ogiltig JSON" }, { status: 400 }); }

  const agent = body?.agent;
  const persona = PERSONAS[agent];
  if (!persona) return Response.json({ error: "Okänd agent." }, { status: 400 });

  const fraga = (body?.fraga || "").trim().slice(0, MAX_FRAGA);
  if (!fraga) return Response.json({ error: "Fältet 'fraga' saknas." }, { status: 400 });

  try {
    const chain = await getDynamicChain("chatt");
    const { text } = await callWithFallback(chain,
      [
        { role: "system", content: persona + SYSTEM_SUFFIX },
        { role: "user", content: fraga },
      ],
      { maxTokens: 400, temperature: 0.7, source: "fraga-svara", validate: (t) => (t || "").trim().length >= 10 }
    );

    const svar = text.trim().slice(0, MAX_SVAR);
    return Response.json({ svar });
  } catch {
    return Response.json({ error: "Alla AI-leverantörer misslyckades — försök igen om en stund." }, { status: 502 });
  }
}
