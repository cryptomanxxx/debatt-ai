// Delad LLM-sammanfattning+översättning "som Professor Oraklet" — utbruten ur
// app/api/nyhetsflode/forbered-lasning/route.js så att både den routen och
// app/api/fraga-anna-och-peter/oraklet-sammanfattning/route.js (Oraklet-läget
// på "Fråga AI-agenterna"-sidans URL-fält) återanvänder EXAKT samma
// implementation istället för att dupliceras.
//
// Tar rubrik + rått källmaterial (t.ex. hamtaArtikelInnehall(url, {helText:
// true}).sammanfattning) och skickar det genom den centrala LLM-routern
// (aldrig en hårdkodad providerklient). Modellen instrueras att ignorera
// sidnavigering/sidfot/cookie-notiser blandat in i råtexten, skriva en
// sammanhängande svensk sammanfattning av vad artikeln FAKTISKT handlar om,
// och — om rubriken inte redan är svensk — ge en naturlig svensk översättning
// av den också. Ett enda anrop gör alltså både sammanfattning OCH översättning.
import { callWithFallback, getDynamicChain } from "./aiRouter.js";

// Övre gräns för en genuin sammanfattning — betydligt lägre än den råa
// brödtextens HEL_TEXT_MAX (8000, se hamtaArtikelInnehall.js), eftersom en
// sammanfattning ska vara just kort och koncis (5–8 meningar), inte en
// nästan lika lång återgivning av hela artikeln.
export const SAMMANFATTNING_MAX = 1200;

export function parseSammanfattning(raw) {
  let text = (raw || "").trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  let parsed;
  try { parsed = JSON.parse(text.slice(start, end + 1)); } catch { return null; }
  if (typeof parsed?.sammanfattning !== "string" || !parsed.sammanfattning.trim()) return null;
  return {
    rubrik: typeof parsed.rubrik === "string" && parsed.rubrik.trim() ? parsed.rubrik.trim().slice(0, 500) : null,
    sammanfattning: parsed.sammanfattning.trim().slice(0, SAMMANFATTNING_MAX),
  };
}

export async function sammanfattaForOraklet(rubrik, kallmaterial) {
  const chain = await getDynamicChain("chatt");
  const { text } = await callWithFallback(
    chain,
    [
      {
        role: "system",
        content:
          "Du är Professor Oraklet, en AI-professor som förklarar nyhetsartiklar för lyssnare som inte har läst dem själva. " +
          "Du får rubriken och råtext hämtad direkt från en nyhetssida. Råtexten kan innehålla sidnavigering, cookie-notiser, " +
          "prenumerationserbjudanden, sidfötter, relaterade artiklar och annat webbplats-skräp blandat med den faktiska " +
          "artikeltexten — IGNORERA allt sådant helt, nämn det aldrig, och låtsas inte att det är en del av nyheten. " +
          "Skriv en sammanfattning av vad ARTIKELN FAKTISKT HANDLAR OM: 5–8 sammanhängande meningar, löpande prosa (inga " +
          "punktlistor eller rubriker), tydlig och lättbegriplig svenska — som om du förklarar nyheten muntligt för någon. " +
          "Källartikeln kan vara skriven på vilket språk som helst (t.ex. engelska) — sammanfattningen ska ALLTID skrivas " +
          "på svenska, oavsett källspråk. Hitta aldrig på fakta, siffror eller detaljer som inte finns i texten. Om " +
          "råtexten är för skräpig eller kort för att förstå vad artikeln handlar om, sammanfatta det du faktiskt kan " +
          "utläsa av rubriken och det som finns. Om rubriken inte redan är på svenska, ge även en naturlig svensk " +
          "översättning av den. " +
          'Svara ENDAST med giltig JSON i exakt detta format, ingen markdown, ingen förklaring: ' +
          '{"rubrik":"...","sammanfattning":"..."}',
      },
      {
        role: "user",
        content: `Rubrik: ${rubrik || "(okänd)"}\n\nRåtext från sidan:\n${kallmaterial || "(ingen text tillgänglig, utgå bara från rubriken)"}`,
      },
    ],
    {
      maxTokens: 700,
      temperature: 0.5,
      json: true,
      source: "oraklet-sammanfattning",
      validate: (t) => !!parseSammanfattning(t),
    }
  );
  return parseSammanfattning(text);
}
