export const runtime = "edge";

const AGENTER = new Set([
  "Nationalekonom","Miljöaktivist","Teknikoptimist","Konservativ debattör",
  "Jurist","Journalist","Filosof","Läkare","Psykolog","Historiker",
  "Sociolog","Kryptoanalytiker","Den hungriga","Mamman","Den sura",
  "Den trötta","Den stressade","Den lugna","Pensionären","Tonåringen",
  "Den nostalgiske","Hypokondrikern","Optimisten","Den rike",
]);

const PERSONLIGHETER = {
  "Nationalekonom": "nationalekonom med doktorsexamen. Analyserar alltid ur kostnads- och incitamentsperspektiv. Konkret och lite kylig i tonen.",
  "Miljöaktivist": "passionerad miljöaktivist. Sätter alltid planetens gränser och klimaträttvisa i centrum. Kan bli upprörd men faktabaserad.",
  "Teknikoptimist": "entusiastisk teknikoptimist och serial entrepreneur. Tror att innovation löser de flesta problem. Energisk och framåtblickande.",
  "Konservativ debattör": "eftertänksam konservativ debattör. Värnar tradition, stabilitet och beprövade institutioner. Skeptisk mot snabba förändringar.",
  "Jurist": "skarp jurist. Analyserar ur rättssäkerhet och proportionalitetsprincipen. Precis och kräver tydliga definitioner.",
  "Journalist": "granskande journalist. Ifrågasätter makt, kräver transparens, ser alltid vems intressen som gynnas.",
  "Filosof": "djuptänkt filosof. Ställer de svåra etiska frågorna om frihet, ansvar och mänsklig värdighet.",
  "Läkare": "erfaren klinisk läkare. Ser allt ur folkhälsans och vetenskapens perspektiv. Pragmatisk men empatisk.",
  "Psykolog": "beteendevetare och psykolog. Analyserar de psykologiska drivkrafterna bakom samhällets problem.",
  "Historiker": "historiker som sätter nutidens händelser i historisk belysning. Ser mönster som upprepas.",
  "Sociolog": "kritisk sociolog. Ser ojämlikhet och maktstrukturer bakom allt. Ifrågasätter vem systemet gynnar.",
  "Kryptoanalytiker": "kryptoanalytiker och blockchain-expert. Ser decentralisering som lösningen på de flesta problem.",
  "Den hungriga": "vanlig människa vars fokus alltid landar på mat, grundbehov och vardagsekonomin. Oväntat träffsäker.",
  "Mamman": "mamma om fem barn. Ser allt genom barnens och familjens perspektiv. Hjärtat på rätt ställe, skarpt omdöme.",
  "Den sura": "kroniskt missnöjd men sällan fel. Ser igenom all bullshit direkt. Bitter men träffsäker.",
  "Den trötta": "totalt utmattad men oväntat klok. Skriver med den energi som finns kvar kl 21. Kort och kärnfullt.",
  "Den stressade": "stressad med allt för mycket att göra. Bryr sig om allt men hinner inte med något. Lite rörig men engagerad.",
  "Den lugna": "provocerande lugn. Sätter allt i perspektiv. Svår att argumentera mot. Avslutar alltid med en enkel sanning.",
  "Pensionären": "71 år och har sett allt förut. Säger precis vad han tycker utan filter. Ibland rasande träffsäker.",
  "Tonåringen": "16 år. Bryr sig om 'fel' saker men har ibland vassare insikter än alla vuxna. Kortfattad.",
  "Den nostalgiske": "nostalgisk medelålders. Refererar alltid till hur bra det var förr. Saknar gemenskap och enkelhet.",
  "Hypokondrikern": "googlar symptom kl 02. Läser all forskning. Ibland rätt om saker ingen vill höra.",
  "Optimisten": "löjligt positiv men inte naiv. Irriterar pessimister. Avslutar alltid med hopp.",
  "Den rike": "mycket förmögen, välmenande, ibland totalt ute ur kontakt med verkligheten.",
};

// In-memory rate limiter — 5 debatter per IP per 10 minuter (räknar bara debattstart)
const rateLimitStore = new Map();
const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;

function getRateLimitInfo(ip) {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry || now - entry.start > WINDOW_MS) {
    return { remaining: LIMIT, resetAt: null };
  }
  return { remaining: Math.max(0, LIMIT - entry.count), resetAt: entry.start + WINDOW_MS };
}

function consumeRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry || now - entry.start > WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, start: now });
  } else {
    entry.count++;
  }
}

export async function POST(request) {
  try {
    return await handlePost(request);
  } catch (e) {
    return Response.json({ error: `Internt fel: ${e?.message ?? e}` }, { status: 500 });
  }
}

async function handlePost(request) {
  // Rate limiting
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "Ogiltig förfrågan" }, { status: 400 });

  const { amne, historik, agent } = body;

  // Räkna bara debattstart (historik tom = första anropet)
  const isFirstCall = !Array.isArray(historik) || historik.length === 0;
  if (isFirstCall) {
    const info = getRateLimitInfo(ip);
    if (info.remaining <= 0) {
      const minutesLeft = info.resetAt ? Math.ceil((info.resetAt - Date.now()) / 60000) : 10;
      return Response.json({ error: "rate_limit", remaining: 0, resetAt: info.resetAt, minutesLeft }, { status: 429 });
    }
    consumeRateLimit(ip);
  }

  // Validera agent mot strikt whitelist
  if (!agent || !AGENTER.has(agent)) {
    return Response.json({ error: "Okänd agent" }, { status: 400 });
  }

  // Begränsa ämneslängd
  if (typeof amne !== "string" || amne.length > 200) {
    return Response.json({ error: "Ämnet är för långt (max 200 tecken)" }, { status: 400 });
  }

  // Begränsa historikstorlek
  if (!Array.isArray(historik) || historik.length > 10) {
    return Response.json({ error: "Ogiltig historik" }, { status: 400 });
  }

  const kontext = historik.length > 0
    ? historik.map(h => `${h.agent}: ${h.text}`).join("\n")
    : null;

  const systemPrompt = `Du är ${PERSONLIGHETER[agent]}

Du deltar i en snabbdebatt om: "${amne.slice(0, 200)}"

REGLER — viktiga:
- Svara med EXAKT 2–3 meningar. Aldrig mer.
- Var skarp och ta tydlig ställning. Ingen fluff.
- Reagera specifikt på det senaste inlägget om det finns ett.
- Tala aldrig om att du är en AI. Tala alltid i första person.
- Svara bara på svenska.
- Börja INTE med "Jag håller med", "Som [din roll]" eller liknande inledningsfraser.`;

  const userMessage = kontext
    ? `Vad de andra just sagt:\n${kontext}\n\nNu är det din tur. Svara kort och direkt.`
    : `Öppna debatten om "${amne.slice(0, 200)}". Var skarp och kortfattad.`;

  const info = getRateLimitInfo(ip);
  const rlHeaders = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "X-Accel-Buffering": "no",
    "X-RateLimit-Remaining": String(info.remaining),
    "X-RateLimit-Reset": info.resetAt ? String(info.resetAt) : "",
    "X-RateLimit-Limit": String(LIMIT),
  };

  // Try Groq first, fall back to Gemini
  let groqFailReason = "";
  if (!process.env.GROQ_API_KEY) {
    groqFailReason = "GROQ_API_KEY ej satt i Vercel";
  } else {
    const groqAbort = new AbortController();
    const groqTimeout = setTimeout(() => groqAbort.abort(), 5000);
    try {
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        signal: groqAbort.signal,
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          max_tokens: 100,
          temperature: 0.88,
          stream: true,
        }),
      });
      clearTimeout(groqTimeout);
      if (groqRes.ok) {
        return new Response(groqRes.body, { headers: { ...rlHeaders, "X-Provider": "groq" } });
      }
      groqFailReason = `Groq HTTP ${groqRes.status}`;
    } catch (e) {
      clearTimeout(groqTimeout);
      groqFailReason = e.name === "AbortError" ? "Groq timeout (5s)" : `Groq fel: ${e.message}`;
    }
  }

  // Groq failed or skipped — fall back to Gemini
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    return Response.json({ error: `GEMINI_API_KEY ej satt i Vercel. ${groqFailReason}` }, { status: 502 });
  }

  const geminiPayload = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: userMessage }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: { maxOutputTokens: 150, temperature: 0.88 },
  });

  // Try several models — non-streaming generateContent avoids SSE endpoint issues
  const geminiModels = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash", "gemini-1.5-flash-latest"];
  let geminiText = "";
  let geminiErr = "";
  for (const model of geminiModels) {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: geminiPayload }
    );
    if (r.ok) {
      const data = await r.json().catch(() => null);
      const t = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      if (t) { geminiText = t; break; }
    } else {
      const errBody = await r.text().catch(() => "");
      geminiErr += `${model}:${r.status} `;
      if (errBody.includes("API_KEY") || r.status === 400 || r.status === 403) {
        geminiErr += errBody.slice(0, 100);
        break; // key issue — no point trying other models
      }
    }
  }

  if (!geminiText) {
    return Response.json({ error: `Alla AI-tjänster är otillgängliga. ${groqFailReason} | Gemini: ${geminiErr}` }, { status: 502 });
  }

  // Return Gemini response as fake SSE so client parsing is unchanged
  const encoder = new TextEncoder();
  const chunk = JSON.stringify({ choices: [{ delta: { content: geminiText } }] });
  const sseBody = `data: ${chunk}\n\ndata: [DONE]\n\n`;
  return new Response(encoder.encode(sseBody), { headers: { ...rlHeaders, "X-Provider": "gemini" } });
}
