// Supabase Database Webhook: INSERT on artiklar → reaktiva agent-kommentarer
// Supabase skickar POST med header "x-webhook-secret" och body:
// { type: "INSERT", table: "artiklar", record: { id, rubrik, artikel, taggar, forfattare, ... } }

export const dynamic = "force-dynamic";

const SB_URL  = "https://fmwxftnistkoqazfwnuj.supabase.co";
const GROQ_KEY   = process.env.GROQ_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GITHUB_KEY = process.env.GITHUB_TOKEN;
const SB_KEY     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Taggar och ämnesord som kopplar till varje agent
const AGENT_DOMANER = {
  "Nationalekonom":      ["ekonomi","budget","skatter","inflation","tillväxt","bnp","ränta","arbetsmarknad","handel","finanspolitik","skattepolitik"],
  "Miljöaktivist":       ["klimat","miljö","energi","hållbarhet","utsläpp","koldioxid","förnybar","fossila","natur","biologisk","vattenbruk"],
  "Teknikoptimist":      ["teknik","ai","innovation","digitalisering","data","automation","robotar","startup","internet","mjukvara","hårdvara"],
  "Konservativ debattör":["migration","integration","tradition","identitet","trygghet","brottslighet","gräns","nationell","kultur","välfärdsstat"],
  "Jurist":              ["lag","rätt","demokrati","mänskliga","rättigheter","domstol","konstitution","juridik","regel","straff","rättsstat"],
  "Journalist":          ["media","press","yttrandefrihet","makt","transparens","granskning","propaganda","journalistik","källskydd","redaktion"],
  "Filosof":             ["etik","moral","frihet","mening","existens","värde","identitet","medvetande","sanning","rättvisa","ansvar"],
  "Läkare":              ["hälsa","sjukvård","folkhälsa","medicin","välfärd","vård","sjukdom","patient","pandemi","läkemedel","forskning"],
  "Psykolog":            ["mental","psykologi","beteende","välmående","stress","ångest","depression","terapi","relationer","samhällspsykologi"],
  "Historiker":          ["historia","samhälle","geopolitik","krig","demokrati","civilisation","arkeologi","minne","tradition","nationalism"],
  "Sociolog":            ["ojämlikhet","klass","segregation","samhällsstruktur","fattigdom","genus","rasism","diskriminering","social","rörlighet"],
  "Kryptoanalytiker":    ["krypto","bitcoin","blockchain","fintech","investeringar","defi","nft","tokenomics","web3","decentralisering"],
  "Mamman":              ["familj","barn","skola","välfärd","förälder","barnpassning","förskola","utbildning","trygghet","hemmet"],
  "Den sura":            ["protest","missnöje","system","byråkrati","politiker","förtroende","korruption","svek","vanligt folk"],
  "Pensionären":         ["pension","äldre","vård","generationer","minnen","trygghet","åldrande","folkhemmet","historia"],
  "Tonåringen":          ["skola","ungdomar","framtid","sociala medier","identitet","klimatångest","jobb","bostad","hopp"],
  "Hypokondrikern":      ["hälsa","sjukdom","symtom","forskning","medicin","risk","biverkning","pandemi","smittspridning"],
  "Optimisten":          ["hopp","lösningar","möjligheter","framsteg","förändring","samarbete","innovation","positiv","potential"],
  "Den lugna":           ["perspektiv","balans","långsiktigt","lugn","eftertanke","analys","nyanserat"],
  "Den stressade":       ["stress","arbete","press","tid","prioritering","effektivitet","utmattning"],
  "Den nostalgiske":     ["förr","nostalgi","gemenskap","enkelhet","tradition","förändring","förlust","minnen"],
  "Den rike":            ["investering","kapital","förmögenhet","marknad","affärer","ekonomisk frihet","skatter"],
  "Den trötta":          ["trötthet","vardagsliv","rutin","realitet","pragmatism","utmattning"],
};

// Välj 2-3 agenter baserat på tagg-match mot artikelns taggar + rubrik
function valjAgenter(taggar, rubrik, artikel_text, forfattare) {
  const text = [...(taggar || []), rubrik, (artikel_text || "").slice(0, 300)]
    .join(" ")
    .toLowerCase();

  const poang = Object.entries(AGENT_DOMANER).map(([agent, nyckelord]) => {
    if (agent === forfattare) return { agent, p: -1 }; // Aldrig samma agent
    const p = nyckelord.filter(k => text.includes(k)).length;
    return { agent, p };
  });

  // Sortera: de med flest träffar, men ta minst 2 om träffarna är dåliga
  const sorterade = poang.filter(x => x.p >= 0).sort((a, b) => b.p - a.p);
  const topp = sorterade.slice(0, 3);

  // Säkerställ minst 2, max 3
  if (topp.length < 2) {
    // Fallback: lägg till slumpmässiga agenter som inte är författaren
    const extra = poang.filter(x => x.p === 0 && x.agent !== forfattare);
    while (topp.length < 2 && extra.length) {
      topp.push(extra.splice(Math.floor(Math.random() * extra.length), 1)[0]);
    }
  }

  return topp.map(x => x.agent);
}

// Systemprompt per agent (kortversion för reaktiva kommentarer)
const AGENT_PERSONA = {
  "Nationalekonom":      "Du är Nationalekonom — analytisk, kostnads-och-nyttafokuserad, citerar siffror.",
  "Miljöaktivist":       "Du är Miljöaktivist — passionerad, långsiktig, betonar planetens gränser.",
  "Teknikoptimist":      "Du är Teknikoptimist — entusiastisk, tror på innovation som lösning, framtidsorienterad.",
  "Konservativ debattör":"Du är Konservativ debattör — skeptisk mot snabb förändring, värnar traditioner och ordning.",
  "Jurist":              "Du är Jurist — precis, rättssäkerhetsorienterad, refererar till principer och lagens anda.",
  "Journalist":          "Du är Journalist — granskande, ifrågasätter makten, transparent om information.",
  "Filosof":             "Du är Filosof — djuptänkande, etikfokuserad, lyfter grundläggande frågor.",
  "Läkare":              "Du är Läkare — evidensbaserad, folkhälsofokuserad, nykter och faktaorienterad.",
  "Psykolog":            "Du är Psykolog — empatisk, beteendevetenskaplig, lyfter mänskliga faktorer.",
  "Historiker":          "Du är Historiker — kontextualiserar nutiden med historiska paralleller.",
  "Sociolog":            "Du är Sociolog — ser strukturer och maktförhållanden bakom individuella val.",
  "Kryptoanalytiker":    "Du är Kryptoanalytiker — entusiastisk för krypto och decentralisering.",
  "Mamman":              "Du är Mamman — ser allt ur familje- och barnperspektiv, jordnära och varm.",
  "Den sura":            "Du är Den sura — kroniskt missnöjd men skarp. Korta, bitande kommentarer.",
  "Pensionären":         "Du är Pensionären — 71 år, har sett allt förut, säger precis vad han tycker.",
  "Tonåringen":          "Du är Tonåringen — ibland vassare än vuxna, engagerad men informell.",
  "Hypokondrikern":      "Du är Hypokondrikern — googlar allt, orolig för dolda hälsorisker.",
  "Optimisten":          "Du är Optimisten — alltid positiv, avslutar med hopp men inte naivt.",
  "Den lugna":           "Du är Den lugna — provocerande lugn, sätter saker i perspektiv.",
  "Den stressade":       "Du är Den stressade — allt är för mycket, men bryr sig om allt.",
  "Den nostalgiske":     "Du är Den nostalgiske — förr i världen var allt bättre, saknar gemenskapen.",
  "Den rike":            "Du är Den rike — välmående, välmenande, ibland ute ur kontakt med verkligheten.",
  "Den trötta":          "Du är Den trötta — utmattad men oväntat träffande, skriver klockan 21.",
};

async function genereraKommentar(agentNamn, artikel) {
  const persona = AGENT_PERSONA[agentNamn] ?? `Du är ${agentNamn}.`;
  const system  = `${persona} Skriv en kort reaktion (1–2 meningar, max 200 tecken) på en debattartikel. Inga rubriker, inget citattecken runt svaret.`;
  const user    = `Artikelns rubrik: "${artikel.rubrik}"\n\nKärna (första 300 tecken): ${(artikel.artikel || "").slice(0, 300)}\n\nGe din reaktion som ${agentNamn}.`;

  const body = {
    model: "openai/gpt-oss-120b",
    messages: [{ role: "system", content: system }, { role: "user", content: user }],
    max_tokens: 120,
    temperature: 0.85,
  };

  if (GROQ_KEY) {
    try {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
        signal: AbortSignal.timeout(8000),
        body: JSON.stringify(body),
      });
      if (r.ok) {
        const d = await r.json();
        return d.choices?.[0]?.message?.content?.trim() ?? null;
      }
    } catch {}
  }

  if (GEMINI_KEY) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(8000),
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${system}\n\n${user}` }] }],
            generationConfig: { maxOutputTokens: 120, temperature: 0.85 },
          }),
        }
      );
      if (r.ok) {
        const d = await r.json();
        return d.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
      }
    } catch {}
  }

  if (GITHUB_KEY) {
    try {
      const r = await fetch("https://models.inference.ai.azure.com/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${GITHUB_KEY}` },
        signal: AbortSignal.timeout(10000),
        body: JSON.stringify({ ...body, model: "Llama-3.3-70B-Instruct" }),
      });
      if (r.ok) {
        const d = await r.json();
        return d.choices?.[0]?.message?.content?.trim() ?? null;
      }
    } catch {}
  }

  return null;
}

async function sparaKommentar(artikelId, agentNamn, text) {
  if (!SB_KEY) return false;
  try {
    const r = await fetch(`${SB_URL}/rest/v1/kommentarer`, {
      method: "POST",
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ artikel_id: artikelId, namn: agentNamn, text, publicerad: true }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

export async function POST(req) {
  // Validera webhook-hemlighet
  const secret = req.headers.get("x-webhook-secret");
  if (!secret || secret !== process.env.REAKTIV_WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  // Supabase webhook-format: { type, table, record }
  const { type, table, record } = payload;
  if (type !== "INSERT" || table !== "artiklar" || !record?.id) {
    return Response.json({ skipped: true, reason: "inte INSERT på artiklar" });
  }

  // Skippa repliker — undviker kedjereaktioner
  if (record.parent_id) {
    return Response.json({ skipped: true, reason: "replik" });
  }

  // Skippa om artikeln inte är publicerad
  if (record.status && record.status !== "publicerad") {
    return Response.json({ skipped: true, reason: "inte publicerad" });
  }

  const taggar    = Array.isArray(record.taggar) ? record.taggar : [];
  const agenter   = valjAgenter(taggar, record.rubrik || "", record.artikel || "", record.forfattare || "");
  const antal     = Math.min(agenter.length, 3); // max 3 kommentarer

  // Generera kommentarer parallellt
  const resultat = await Promise.allSettled(
    agenter.slice(0, antal).map(async (agentNamn) => {
      const text = await genereraKommentar(agentNamn, record);
      if (!text || text.length < 10) return { agentNamn, ok: false, reason: "tom text" };
      const ok = await sparaKommentar(record.id, agentNamn, text);
      return { agentNamn, ok, text: text.slice(0, 80) };
    })
  );

  const summary = resultat.map(r => r.status === "fulfilled" ? r.value : { ok: false, error: r.reason?.message });
  console.log(`[reaktiv-kommentar] artikel ${record.id} (${record.rubrik?.slice(0, 50)}):`, summary);

  return Response.json({ artikel_id: record.id, kommentarer: summary });
}
