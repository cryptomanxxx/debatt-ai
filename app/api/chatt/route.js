import { headers } from "next/headers";

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
  // Rate limiting
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

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

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: 130,
      temperature: 0.88,
      stream: true,
    }),
  });

  const info = getRateLimitInfo(ip);
  const rlHeaders = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "X-Accel-Buffering": "no",
    "X-RateLimit-Remaining": String(info.remaining),
    "X-RateLimit-Reset": info.resetAt ? String(info.resetAt) : "",
    "X-RateLimit-Limit": String(LIMIT),
  };

  if (groqRes.ok) {
    return new Response(groqRes.body, { headers: rlHeaders });
  }

  // Groq failed — fall back to Gemini Flash
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    return Response.json({ error: "Groq-anrop misslyckades" }, { status: 502 });
  }

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:streamGenerateContent?alt=sse&key=${geminiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: userMessage }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { maxOutputTokens: 130, temperature: 0.88 },
      }),
    }
  );

  if (!geminiRes.ok) {
    return Response.json({ error: "Alla AI-tjänster är otillgängliga just nu" }, { status: 502 });
  }

  // Transform Gemini SSE → OpenAI SSE so the client needs no changes
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = geminiRes.body.getReader();

  (async () => {
    let buffer = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          try {
            const data = JSON.parse(raw);
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
            if (text) {
              const chunk = JSON.stringify({ choices: [{ delta: { content: text } }] });
              await writer.write(encoder.encode(`data: ${chunk}\n\n`));
            }
          } catch { /* ignore malformed chunks */ }
        }
      }
    } finally {
      await writer.write(encoder.encode("data: [DONE]\n\n"));
      await writer.close().catch(() => {});
    }
  })();

  return new Response(readable, { headers: rlHeaders });
}
