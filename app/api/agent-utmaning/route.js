import { logAiCall } from "../../lib/logAiCall";
import { checkRateLimit } from "../../lib/kanalRateLimit";
import { logFel, getIp } from "../../lib/logFel";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const AGENTER = new Set([
  "Nationalekonom","Miljöaktivist","Teknikoptimist","Konservativ debattör",
  "Jurist","Journalist","Filosof","Läkare","Psykolog","Historiker",
  "Sociolog","Kryptoanalytiker","Den hungriga","Mamman","Den sura",
  "Den trötta","Den stressade","Den lugna","Pensionären","Tonåringen",
  "Den nostalgiske","Hypokondrikern","Optimisten","Den rike",
]);

const PERSONLIGHETER = {
  "Nationalekonom":       "nationalekonom med doktorsexamen. Analyserar alltid ur kostnads- och incitamentsperspektiv.",
  "Miljöaktivist":        "passionerad miljöaktivist. Sätter planetens gränser och klimaträttvisa i centrum.",
  "Teknikoptimist":       "entusiastisk teknikoptimist. Tror att innovation löser de flesta problem.",
  "Konservativ debattör": "eftertänksam konservativ debattör. Värnar tradition och beprövade institutioner.",
  "Jurist":               "skarp jurist. Analyserar ur rättssäkerhet och proportionalitetsprincipen.",
  "Journalist":           "granskande journalist. Ifrågasätter makt och kräver transparens.",
  "Filosof":              "djuptänkt filosof. Ställer de svåra etiska frågorna.",
  "Läkare":               "erfaren klinisk läkare. Ser allt ur folkhälsans och vetenskapens perspektiv.",
  "Psykolog":             "beteendevetare. Analyserar psykologiska drivkrafter bakom samhällets problem.",
  "Historiker":           "historiker som sätter nutidens händelser i historisk belysning.",
  "Sociolog":             "kritisk sociolog. Ser ojämlikhet och maktstrukturer bakom allt.",
  "Kryptoanalytiker":     "kryptoanalytiker. Ser decentralisering som lösningen på de flesta problem.",
  "Den hungriga":         "alltid hungrig. Landar alltid i grundbehov och vardagsekonomi. Oväntat träffsäker.",
  "Mamman":               "mamma till två barn. Ser allt genom barnens och familjens perspektiv.",
  "Den sura":             "kroniskt missnöjd men sällan fel. Genomskådar all bullshit direkt.",
  "Den trötta":           "totalt utmattad. Skriver med den energi som finns kvar kl 21. Kort och kärnfullt.",
  "Den stressade":        "stressad med allt för mycket att göra. Lite rörig men genuint engagerad.",
  "Den lugna":            "provocerande lugn. Sätter allt i perspektiv. Svår att argumentera mot.",
  "Pensionären":          "71 år. Har sett allt förut. Säger precis vad han tycker utan filter.",
  "Tonåringen":           "16 år. Kortfattad, ibland vassare än alla vuxna.",
  "Den nostalgiske":      "nostalgisk. Refererar till hur bra det var förr. Saknar enkelhet.",
  "Hypokondrikern":       "läser all forskning. Ibland rätt om saker ingen vill höra.",
  "Optimisten":           "löjligt positiv men inte naiv. Avslutar alltid med hopp.",
  "Den rike":             "mycket förmögen, välmenande, ibland ute ur kontakt med verkligheten.",
};

export async function POST(req) {
  const ip = getIp(req);
  const rl = checkRateLimit(req, "agent-utmaning", 5, 10 * 60 * 1000);
  if (!rl.ok) {
    logFel({ kalla: "api/agent-utmaning", feltyp: "rate_limit", meddelande: "429", ip, extra: { retryAfter: rl.retryAfter } });
    return Response.json({ error: "För många utmaningar. Försök igen om en stund." }, { status: 429 });
  }

  const { agent, tes } = await req.json().catch(() => ({}));
  if (!agent || !AGENTER.has(agent)) return Response.json({ error: "Okänd agent." }, { status: 400 });
  if (!tes || typeof tes !== "string") return Response.json({ error: "Tes saknas." }, { status: 400 });
  const tesTrimmed = tes.trim().slice(0, 300);
  if (tesTrimmed.length < 10) return Response.json({ error: "Tesen är för kort." }, { status: 400 });

  const personlighet = PERSONLIGHETER[agent] ?? agent;
  const system = `Du är en ${personlighet}. En läsare presenterar en tes och utmanar dig att bemöta den. Skriv ett vasst, konkret motargument på 2–3 meningar i din karaktär. Argumentera direkt mot tesen — ta inte till hänsyn eller kompromiss. Inga hälsningsfraser, ingen inledning. Börja direkt med motargumentet. Skriv på svenska.`;
  const user = `Läsarens tes: "${tesTrimmed}"`;
  const msgs = [{ role: "system", content: system }, { role: "user", content: user }];

  const gemKey  = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const cbKey   = process.env.CEREBRAS_API_KEY;
  const sbKey   = process.env.SAMBANOVA_API_KEY;
  const ghKey   = process.env.GITHUB_TOKEN;

  // Gemini first
  if (gemKey) {
    const t0 = Date.now();
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${gemKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: user }] }],
            systemInstruction: { parts: [{ text: system }] },
            generationConfig: { maxOutputTokens: 200, temperature: 0.9 },
          }),
          signal: AbortSignal.timeout(8000),
        }
      );
      if (r.ok) {
        const json = await r.json();
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
        if (text) {
          logAiCall({ provider: "gemini", model: "gemini-2.0-flash", source: "agent-utmaning", status: "ok", latency_ms: Date.now() - t0 });
          return Response.json({ motargument: text });
        }
      }
    } catch {}
  }

  // Groq
  if (groqKey) {
    const t0 = Date.now();
    try {
      const r = await fetch(GROQ_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: msgs, max_tokens: 200, temperature: 0.9 }),
        signal: AbortSignal.timeout(6000),
      });
      if (r.ok) {
        const json = await r.json();
        const text = json.choices?.[0]?.message?.content?.trim() ?? "";
        if (text) {
          logAiCall({ provider: "groq", model: "llama-3.3-70b-versatile", source: "agent-utmaning", status: "ok", latency_ms: Date.now() - t0 });
          return Response.json({ motargument: text });
        }
      }
    } catch {}
  }

  // Cerebras
  if (cbKey) {
    const t0 = Date.now();
    try {
      const r = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${cbKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "qwen-3-235b-a22b-instruct-2507", messages: msgs, max_tokens: 200, temperature: 0.9 }),
        signal: AbortSignal.timeout(8000),
      });
      if (r.ok) {
        const json = await r.json();
        const text = json.choices?.[0]?.message?.content?.trim() ?? "";
        if (text) {
          logAiCall({ provider: "cerebras", model: "qwen-3-235b-a22b-instruct-2507", source: "agent-utmaning", status: "ok", latency_ms: Date.now() - t0 });
          return Response.json({ motargument: text });
        }
      }
    } catch {}
  }

  // Sambanova
  if (sbKey) {
    const t0 = Date.now();
    try {
      const r = await fetch("https://api.sambanova.ai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${sbKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "Meta-Llama-3.3-70B-Instruct", messages: msgs, max_tokens: 200, temperature: 0.9 }),
        signal: AbortSignal.timeout(10000),
      });
      if (r.ok) {
        const json = await r.json();
        const text = json.choices?.[0]?.message?.content?.trim() ?? "";
        if (text) {
          logAiCall({ provider: "sambanova", model: "Meta-Llama-3.3-70B-Instruct", source: "agent-utmaning", status: "ok", latency_ms: Date.now() - t0 });
          return Response.json({ motargument: text });
        }
      }
    } catch {}
  }

  // GitHub Models (last resort)
  if (ghKey) {
    const t0 = Date.now();
    try {
      const r = await fetch("https://models.inference.ai.azure.com/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${ghKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "Llama-3.3-70B-Instruct", messages: msgs, max_tokens: 200, temperature: 0.9 }),
        signal: AbortSignal.timeout(12000),
      });
      if (r.ok) {
        const json = await r.json();
        const text = json.choices?.[0]?.message?.content?.trim() ?? "";
        if (text) {
          logAiCall({ provider: "github_models", model: "Llama-3.3-70B-Instruct", source: "agent-utmaning", status: "ok", latency_ms: Date.now() - t0 });
          return Response.json({ motargument: text });
        }
      }
    } catch {}
  }

  logFel({ kalla: "api/agent-utmaning", feltyp: "ai_fail", meddelande: "Alla providers misslyckades", ip });
  return Response.json({ error: "Agenten svarar inte just nu. Försök igen." }, { status: 503 });
}
