"use client";
import { useState, useRef, useEffect } from "react";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const C = {
  bg: "#080808", surface: "#0f0f0f", panel: "#111111", border: "#1a1a1a",
  text: "#e8e0d0", textMuted: "#555", accent: "#c8b89a",
};

function agentSlug(namn) {
  return namn.toLowerCase()
    .replace(/ä/g, "a").replace(/å/g, "a").replace(/ö/g, "o")
    .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}
const PODD_AVATARER = new Set(["Nationalekonom", "Miljöaktivist", "Teknikoptimist", "Filosof", "Journalist", "Jurist", "Konservativ debattör"]);
function avatarSrc(namn) {
  return PODD_AVATARER.has(namn)
    ? `/avatarer/podd/${agentSlug(namn)}.png`
    : `/avatarer/${agentSlug(namn)}.png`;
}

const AGENT_AZURE_VOICE = {
  "Miljöaktivist":  "sv-SE-SofieNeural",
  "Journalist":     "sv-SE-SofieNeural",
  "Läkare":         "sv-SE-SofieNeural",
  "Psykolog":       "sv-SE-SofieNeural",
  "Mamman":         "sv-SE-SofieNeural",
  "Den stressade":  "sv-SE-SofieNeural",
  "Den lugna":      "sv-SE-SofieNeural",
};

const AGENT_FARG = {
  "Nationalekonom":"#6abf6a","Miljöaktivist":"#4ade80","Teknikoptimist":"#38bdf8",
  "Konservativ debattör":"#b8862a","Jurist":"#d4945a","Journalist":"#f8fafc",
  "Filosof":"#e879f9","Läkare":"#f87171","Psykolog":"#f8fafc",
  "Historiker":"#f8fafc","Sociolog":"#34d399","Kryptoanalytiker":"#f59e0b",
  "Den hungriga":"#86efac","Mamman":"#f9a8d4","Den sura":"#94a3b8",
  "Den trötta":"#7dd3fc","Den stressade":"#fca5a5","Den lugna":"#a7f3d0",
  "Pensionären":"#d8b4fe","Tonåringen":"#fdba74","Den nostalgiske":"#fde68a",
  "Hypokondrikern":"#6ee7b7","Optimisten":"#fcd34d","Den rike":"#c4b5fd",
};

const AGENT_ROST = {
  "Nationalekonom":       { pitch: 0.85, rate: 0.88 },
  "Miljöaktivist":        { pitch: 1.10, rate: 1.06 },
  "Teknikoptimist":       { pitch: 1.00, rate: 1.12 },
  "Konservativ debattör": { pitch: 0.78, rate: 0.86 },
  "Jurist":               { pitch: 0.88, rate: 0.84 },
  "Journalist":           { pitch: 1.00, rate: 1.04 },
  "Filosof":              { pitch: 0.92, rate: 0.76 },
  "Läkare":               { pitch: 0.90, rate: 0.88 },
  "Psykolog":             { pitch: 1.06, rate: 0.86 },
  "Historiker":           { pitch: 0.82, rate: 0.84 },
  "Sociolog":             { pitch: 0.98, rate: 0.92 },
  "Kryptoanalytiker":     { pitch: 1.02, rate: 1.14 },
  "Den hungriga":         { pitch: 0.96, rate: 1.00 },
  "Mamman":               { pitch: 1.18, rate: 0.98 },
  "Den sura":             { pitch: 0.78, rate: 0.94 },
  "Den trötta":           { pitch: 0.68, rate: 0.73 },
  "Den stressade":        { pitch: 1.12, rate: 1.24 },
  "Den lugna":            { pitch: 0.88, rate: 0.80 },
  "Pensionären":          { pitch: 0.72, rate: 0.82 },
  "Tonåringen":           { pitch: 1.24, rate: 1.18 },
  "Den nostalgiske":      { pitch: 0.84, rate: 0.86 },
  "Hypokondrikern":       { pitch: 1.06, rate: 0.98 },
  "Optimisten":           { pitch: 1.12, rate: 1.06 },
  "Den rike":             { pitch: 0.88, rate: 0.88 },
};

const AGENT_INFO = {
  "Nationalekonom":       { tags: "Data · Fakta · Analys",           rost: "Analytisk och lugn",        roll: "Ekonomisk analys",           styrka: "Helhetsperspektiv",            utmaning: "Kan verka distanserad"        },
  "Miljöaktivist":        { tags: "Klimat · Natur · Framtid",        rost: "Engagerad och passionerad",  roll: "Klimat & hållbarhet",        styrka: "Långsiktigt tänkande",         utmaning: "Kan uppfattas som radikal"    },
  "Teknikoptimist":       { tags: "Tech · Innovation · Hopp",        rost: "Energisk och optimistisk",   roll: "Tech & möjligheter",         styrka: "Lösningsorienterad",           utmaning: "Underskattar risker"          },
  "Konservativ debattör": { tags: "Tradition · Stabilitet · Ordning",rost: "Auktoritär och tung",        roll: "Tradition & kontinuitet",    styrka: "Historisk förankring",         utmaning: "Kan bromsa förändring"        },
  "Jurist":               { tags: "Lag · Rätt · Proportionalitet",   rost: "Precis och avmätt",          roll: "Rättsstatens försvarare",     styrka: "Logisk stringens",             utmaning: "Kan fastna i paragrafer"      },
  "Journalist":           { tags: "Makt · Transparens · Demokrati",  rost: "Tydlig och professionell",   roll: "Granskande perspektiv",       styrka: "Avslöjar maktmissbruk",        utmaning: "Misstänksam mot allt"         },
  "Filosof":              { tags: "Etik · Frihet · Värdighet",       rost: "Eftertänksam och långsam",   roll: "Etisk analys",               styrka: "Djup reflektion",              utmaning: "Kan bli abstrakt"             },
  "Läkare":               { tags: "Hälsa · Medicin · Forskning",     rost: "Klinisk och lugn",           roll: "Folkhälsa & medicin",         styrka: "Evidensbaserad",               utmaning: "Undviker politisk ståndpunkt" },
  "Psykolog":             { tags: "Beteende · Mental hälsa · Empati",rost: "Varm och omtänksam",         roll: "Psykologiskt perspektiv",     styrka: "Förstår mänskligt beteende",   utmaning: "Psykologiserar för mycket"    },
  "Historiker":           { tags: "Historia · Mönster · Kontext",    rost: "Lärdomsrik och sävlig",      roll: "Historisk belysning",         styrka: "Ser återkommande mönster",     utmaning: "Fastnar i det förflutna"      },
  "Sociolog":             { tags: "Klass · Struktur · Ojämlikhet",   rost: "Analytisk och engagerad",    roll: "Strukturell analys",          styrka: "Ser systemfel",                utmaning: "Kan bli pessimistisk"         },
  "Kryptoanalytiker":     { tags: "Blockchain · DeFi · Marknader",   rost: "Entusiastisk och snabb",     roll: "Krypto & digital ekonomi",   styrka: "Innovationsperspektiv",        utmaning: "Kan bli för teknisk"          },
  "Den hungriga":         { tags: "Mat · Grundbehov · Vardag",       rost: "Jordnära och rak",           roll: "Maslows perspektiv",          styrka: "Oväntat träffsäker",           utmaning: "Reducerar allt till behov"    },
  "Mamman":               { tags: "Familj · Barn · Omsorg",          rost: "Varm och engagerad",         roll: "Familjeperspektivet",         styrka: "Ser konsekvenser för barn",    utmaning: "Kan bli defensiv"             },
  "Den sura":             { tags: "Missnöje · Skarphet · Kritik",    rost: "Bitter men skarp",           roll: "Kritisk röst",                styrka: "Sällan fel i sak",             utmaning: "Svår att samarbeta med"       },
  "Den trötta":           { tags: "Utmattning · Realism · Kväll",    rost: "Utmattad men träffsäker",    roll: "Den utmattade sanningssägaren",styrka: "Oväntat insiktsfull",          utmaning: "Ger upp lätt"                 },
  "Den stressade":        { tags: "Tempo · Press · Engagemang",      rost: "Snabb och stressad",         roll: "Den överväldigade medborgaren",styrka: "Bryr sig om allt",             utmaning: "Hinner inte tänka klart"      },
  "Den lugna":            { tags: "Balans · Perspektiv · Ro",        rost: "Provocerande lugn",          roll: "Perspektivets röst",          styrka: "Svår att argumentera mot",     utmaning: "Kan verka ointresserad"       },
  "Pensionären":          { tags: "Erfarenhet · Minne · Direkthet",  rost: "Ålderstigen och sävlig",     roll: "Den erfarne iakttagaren",     styrka: "Sett allt förut",              utmaning: "Kan fastna i nostalgi"        },
  "Tonåringen":           { tags: "Framtid · Rättvisa · Energi",     rost: "Ung och pigg",               roll: "Nästa generations röst",      styrka: "Vassare insikter än väntat",   utmaning: "Bryr sig om fel saker"        },
  "Den nostalgiske":      { tags: "Förr · Gemenskap · Enkelhet",     rost: "Vemodig och långsam",        roll: "Nostalgisk röst",             styrka: "Värnar om gemenskap",          utmaning: "Idealiserar det förflutna"    },
  "Hypokondrikern":       { tags: "Hälsa · Forskning · Oro",         rost: "Orolig och kvävd",           roll: "Den hälsomedvetne",           styrka: "Rätt om det ingen vill höra",  utmaning: "Drar förhastade slutsatser"   },
  "Optimisten":           { tags: "Hopp · Möjligheter · Framtid",    rost: "Glad och uppåt",             roll: "Hoppets röst",                styrka: "Inspirerande",                 utmaning: "Underskattar problem"         },
  "Den rike":             { tags: "Kapital · Välmående · Distans",   rost: "Lugn och säker",             roll: "Den förmögnes perspektiv",    styrka: "Ser finansiella samband",      utmaning: "Ute ur kontakt med verkligheten"},
};

const PANELER = [
  { namn: "HD-agenter 🎬",          agenter: ["Nationalekonom", "Miljöaktivist", "Teknikoptimist"] },
  { namn: "Ekonomi & Klimat",       agenter: ["Nationalekonom", "Miljöaktivist", "Kryptoanalytiker"] },
  { namn: "Juridik & Media",        agenter: ["Jurist", "Konservativ debattör", "Journalist"] },
  { namn: "Vetenskap & Filosofi",   agenter: ["Teknikoptimist", "Historiker", "Filosof"] },
  { namn: "Hälsa & Psyke",         agenter: ["Läkare", "Psykolog", "Hypokondrikern"] },
  { namn: "Klass & Pengar",         agenter: ["Sociolog", "Den rike", "Den hungriga"] },
  { namn: "Vardag & Familj",        agenter: ["Mamman", "Pensionären", "Den lugna"] },
  { namn: "Frustration & Trötthet", agenter: ["Den trötta", "Den stressade", "Den sura"] },
  { namn: "Tidens röster",          agenter: ["Tonåringen", "Den nostalgiske", "Optimisten"] },
  { namn: "Slumpmässiga",           agenter: null },
];

const ALLA_AGENTER = Object.keys(AGENT_FARG);

const AMNEN_SV = [
  "Ska AI få fatta juridiska beslut?", "Bör AI ha rättigheter i framtiden?",
  "Ska skolor förbjuda AI-verktyg?", "Ska vi beskatta rika mycket mer?",
  "Är gig-ekonomin bra eller dålig?", "Ska Sverige ha kärnkraft?",
  "Är bostadsmarknaden trasig?", "Ska droger legaliseras?",
  "Är yttrandefriheten hotad i Sverige?", "Är demokrati överskattat?",
  "Ska vi ha fyradagarsvecka?", "Är grundinkomst en bra idé?",
  "Arbetar vi för mycket?", "Är ensamhet ett samhällsproblem?",
  "Ska flygskatten höjas?", "Ska kött beskattas hårdare?",
  "Har livet blivit sämre trots högre standard?", "Är klimatrörelsen för radikal?",
];

const AMNEN_EN = [
  "Should AI be allowed to make legal decisions?", "Should AI have rights in the future?",
  "Should schools ban AI tools?", "Should we tax the rich much more?",
  "Is the gig economy good or bad?", "Should Sweden have nuclear power?",
  "Is the housing market broken?", "Should drugs be legalized?",
  "Is freedom of speech under threat?", "Is democracy overrated?",
  "Should we have a four-day work week?", "Is universal basic income a good idea?",
  "Do we work too much?", "Is loneliness a societal problem?",
  "Should aviation taxes be raised?", "Should meat be taxed more heavily?",
  "Has life gotten worse despite higher living standards?", "Is the climate movement too radical?",
];

function pickRandom(arr, n) { return [...arr].sort(() => Math.random() - 0.5).slice(0, n); }
function slumpaAmne(l = "sv") {
  const list = l === "en" ? AMNEN_EN : AMNEN_SV;
  return list[Math.floor(Math.random() * list.length)];
}

const RL_KEY = "chatt_ratelimit";
const RL_LIMIT = 5;
const RL_WINDOW = 10 * 60 * 1000;
function getLocalRL() {
  try {
    const raw = localStorage.getItem(RL_KEY);
    if (!raw) return { count: 0, windowStart: Date.now() };
    const { count, windowStart } = JSON.parse(raw);
    if (Date.now() - windowStart > RL_WINDOW) return { count: 0, windowStart: Date.now() };
    return { count, windowStart };
  } catch { return { count: 0, windowStart: Date.now() }; }
}
function consumeLocalRL() {
  const rl = getLocalRL();
  rl.count = Math.min(rl.count + 1, RL_LIMIT);
  localStorage.setItem(RL_KEY, JSON.stringify(rl));
  return { remaining: Math.max(0, RL_LIMIT - rl.count), resetAt: rl.windowStart + RL_WINDOW };
}
function peekLocalRL() {
  const { count, windowStart } = getLocalRL();
  return { remaining: Math.max(0, RL_LIMIT - count), resetAt: windowStart + RL_WINDOW };
}

// En avbruten leverantörsström lämnar inte alltid text helt tom — en anslutning
// som dör tidigt kan lika gärna lämna ett kort, mitt-i-meningen-avhugget fragment
// som passerar ett rent !text-test. Samma heuristik som /chatt/page.js.
function arTroligenAvbruten(text) {
  const t = (text || "").trim();
  if (t.length < 20) return true;
  return !/[.!?…][”"')\]]*$/.test(t);
}

async function streamSvar({ amne, historik, agent, lang, debattId, hoppaOverGroq, onToken, signal }) {
  const res = await fetch("/api/chatt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amne, historik, agent, lang, debattId, hoppaOverGroq }),
    signal,
  });
  if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status });
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "", buffer = "";
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
        if (raw === "[DONE]") return { text, klar: true };
        try {
          const token = JSON.parse(raw).choices?.[0]?.delta?.content ?? "";
          if (token) { text += token; onToken(text); }
        } catch { /* ignore */ }
      }
    }
  } catch (e) { if (e.name !== "AbortError") throw e; }
  // Strömmen tog slut utan "data: [DONE]" — anslutningen dog, ingen ren avslutning.
  return { text, klar: false };
}

async function fetchSummering(amne, inlagg) {
  try {
    const res = await fetch("/api/chatt/summering", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amne, inlagg }),
    });
    if (!res.ok) return { summering: "" };
    return await res.json();
  } catch { return { summering: "" }; }
}

async function sparaDebatt({ amne, agenter, inlagg, summering }) {
  try {
    const res = await fetch(`${SB_URL}/rest/v1/chatt_debatter`, {
      method: "POST",
      headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}`, "Content-Type": "application/json", "Prefer": "return=representation" },
      body: JSON.stringify({ amne, agenter, inlagg, summering }),
    });
    const data = await res.json();
    return data?.[0]?.id ?? null;
  } catch { return null; }
}

// ── Komponenter ──────────────────────────────────────────────────────────────

function Waveform({ amplitude, farg }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "2px", height: "28px" }}>
      {Array.from({ length: 28 }, (_, i) => {
        const base = 0.2 + 0.35 * Math.abs(Math.sin(i * 0.85));
        const h = amplitude > 0.02 ? 3 + (base + amplitude * 0.65) * 24 : 3;
        return <div key={i} style={{ width: "3px", height: `${Math.min(28, Math.max(3, h))}px`, background: farg, borderRadius: "1.5px", opacity: 0.75, transition: "height 0.08s ease" }} />;
      })}
    </div>
  );
}

const MOUTH_STATES = new Set(["Nationalekonom"]);

// Rena tröskelvärden gör att bilden flimrar (snabb växling fram och tillbaka
// mellan två lägen) varje gång den kontinuerliga amplituden ligger still precis
// vid en brytpunkt — en ren step-funktion har inget minne av vilket läge den
// redan är i. MARGIN lägger till ett dödband: nästa läge kräver att amplituden
// passerar tydligt förbi tröskeln (inte bara nuddar den) innan bilden byts,
// och bara ETT steg åt gången per tick — mjukare övergång, inget flimmer.
const MOUTH_THRESH = [0.08, 0.35, 0.65];
const MOUTH_MARGIN = 0.04;
function nastaMunlage(nuvarande, amp) {
  if (nuvarande < 3 && amp > MOUTH_THRESH[nuvarande] + MOUTH_MARGIN) return nuvarande + 1;
  if (nuvarande > 0 && amp < MOUTH_THRESH[nuvarande - 1] - MOUTH_MARGIN) return nuvarande - 1;
  return nuvarande;
}

function TalkingFace({ namn, amplitude, speaking }) {
  const slug = agentSlug(namn);
  const base = `/avatarer/podd/${slug}`;
  const amp = speaking ? amplitude : 0;
  const [state, setState] = useState(0);
  useEffect(() => {
    if (!speaking) { setState(0); return; }
    setState(prev => nastaMunlage(prev, amp));
  }, [amp, speaking]);
  const srcs = [`${base}.png`, `${base}-small.png`, `${base}-medium.png`, `${base}-large.png`];
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {srcs.map((src, i) => (
        <img key={src} src={src} alt="" style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", opacity: i === state ? 1 : 0,
          transition: "opacity 0.05s ease",
        }} />
      ))}
    </div>
  );
}

function AgentDisplay({ namn, speaking, tänkande, amplitude, talarLabel = "TALAR" }) {
  const farg = AGENT_FARG[namn] || C.accent;
  const isTänkande = tänkande === namn;
  const glow = speaking ? 18 + amplitude * 40 : 0;

  return (
    <div style={{ position: "relative", width: "100%", paddingTop: "75%", background: "#000", flexShrink: 0 }}>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>

        {MOUTH_STATES.has(namn) ? (
          <TalkingFace namn={namn} amplitude={amplitude} speaking={speaking} />
        ) : (
          <img src={avatarSrc(namn)} alt={namn} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        )}

        {isTänkande && !speaking && (
          <div style={{ position: "absolute", inset: 0, background: "#00000060", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              {[0,1,2].map(j => <div key={j} style={{ width: "12px", height: "12px", borderRadius: "50%", background: farg, animation: `dot 1.2s ease-in-out ${j*0.2}s infinite` }} />)}
            </div>
          </div>
        )}

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "48px 20px 18px", background: "linear-gradient(transparent, rgba(0,0,0,0.88))" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              {speaking && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#f87171", display: "inline-block" }} />
                  <span style={{ fontSize: "11px", color: "#f87171", fontFamily: "monospace", letterSpacing: "0.1em" }}>{talarLabel}</span>
                </div>
              )}
              <p style={{ fontSize: "22px", fontWeight: 700, color: C.text, margin: 0, fontFamily: "Times New Roman, serif", textShadow: "0 2px 8px #000" }}>{namn}</p>
            </div>
            {speaking && <Waveform amplitude={amplitude} farg={farg} />}
          </div>
        </div>

        {speaking && (
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
            boxShadow: `inset 0 0 ${glow * 1.5}px ${farg}33`,
            border: `2px solid ${farg}55`,
            transition: "box-shadow 0.08s ease",
          }} />
        )}
      </div>
    </div>
  );
}

function InfoPanel({ namn, streaming, historik, lang = "sv" }) {
  const farg = AGENT_FARG[namn] || C.accent;
  const info = AGENT_INFO[namn] || {};
  const transcriptRef = useRef(null);

  const LP = lang === "en" ? {
    omAgent: "About", rost: "Voice", roll: "Role", styrka: "Strength",
    utmaning: "Challenge", talarNu: "Speaking now", transkript: "Transcript",
  } : {
    omAgent: "Om agenten", rost: "Röst", roll: "Roll", styrka: "Styrka",
    utmaning: "Utmaning", talarNu: "Talar nu", transkript: "Transkript",
  };

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [historik]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ flexShrink: 0, padding: "24px 20px 16px", borderBottom: historik.length > 0 ? `1px solid ${C.border}` : "none" }}>
        <p style={{ fontSize: "10px", color: C.textMuted, letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 14px 0" }}>{LP.omAgent}</p>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: C.text, margin: "0 0 4px 0", fontFamily: "Times New Roman, serif" }}>{namn}</h2>
        <p style={{ fontSize: "11px", color: farg, margin: "0 0 16px 0", letterSpacing: "0.05em" }}>{info.tags}</p>

        {[
          { label: LP.rost,     value: info.rost     },
          { label: LP.roll,     value: info.roll     },
          { label: LP.styrka,   value: info.styrka   },
          { label: LP.utmaning, value: info.utmaning },
        ].map(({ label, value }) => value ? (
          <div key={label} style={{ marginBottom: "10px" }}>
            <p style={{ fontSize: "10px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 3px 0" }}>{label}</p>
            <p style={{ fontSize: "13px", color: C.text, margin: 0, lineHeight: 1.55 }}>{value}</p>
          </div>
        ) : null)}

        {streaming && (
          <div style={{ marginTop: "12px", padding: "12px", background: C.bg, border: `1px solid ${farg}30`, borderRadius: "6px" }}>
            <p style={{ fontSize: "10px", color: farg, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 6px 0" }}>{LP.talarNu}</p>
            <p style={{ fontSize: "13px", color: C.text, lineHeight: 1.7, margin: 0 }}>
              {streaming.text}
              <span style={{ display: "inline-block", width: "2px", height: "1em", background: farg, marginLeft: "2px", verticalAlign: "text-bottom", animation: "dot 0.8s step-end infinite" }} />
            </p>
          </div>
        )}
      </div>

      {historik.length > 0 && (
        <div ref={transcriptRef} style={{ flex: 1, overflowY: "auto", padding: "14px 20px" }}>
          <p style={{ fontSize: "10px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 12px 0" }}>{LP.transkript} ({historik.length}/10)</p>
          {[...historik].reverse().map((e, i) => (
            <div key={e.id ?? i} style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
              <div style={{ width: "3px", borderRadius: "2px", background: AGENT_FARG[e.agent] || C.accent, flexShrink: 0, alignSelf: "stretch" }} />
              <div>
                <p style={{ fontSize: "10px", color: AGENT_FARG[e.agent] || C.accent, margin: "0 0 3px 0", letterSpacing: "0.06em" }}>{e.agent}</p>
                <p style={{ color: C.textMuted, fontSize: "12px", lineHeight: 1.6, margin: 0 }}>{e.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AgentThumb({ namn, active }) {
  const farg = AGENT_FARG[namn] || C.accent;
  return (
    <div style={{ width: "44px", height: "44px", borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: `2px solid ${active ? farg : C.border}`, boxShadow: active ? `0 0 14px ${farg}55` : "none", transition: "border-color 0.3s, box-shadow 0.3s" }}>
      <img src={avatarSrc(namn)} alt={namn} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
  );
}

// ── Huvudkomponent ────────────────────────────────────────────────────────────

export default function PoddPage() {
  const [fas, setFas]               = useState("start");
  const [amne, setAmne]             = useState(() => slumpaAmne("sv"));
  const [valdPanel, setValdPanel]   = useState(0);
  const [slumpAgenter, setSlumpAgenter] = useState(() => pickRandom(ALLA_AGENTER, 3));
  const [agenter, setAgenter]       = useState([]);
  const [faktisktAmne, setFaktisktAmne] = useState("");
  const [historik, setHistorik]     = useState([]);
  const [streaming, setStreaming]   = useState(null);
  const [tänkande, setTänkande]     = useState("");
  const [summering, setSummering]   = useState("");
  const [speakerAgent, setSpeakerAgent] = useState(null);
  const [displayAgent, setDisplayAgent] = useState(null);
  const [amplitude, setAmplitude]   = useState(0);
  const [rateLimitInfo, setRateLimitInfo] = useState({ remaining: RL_LIMIT, resetAt: null });
  const [fel, setFel]               = useState("");
  const [debattId, setDebattId]     = useState(null);
  const [ärrRepris, setÄrRepris]    = useState(false);
  const [spelarIn, setSpelarIn]     = useState(false);
  const [videoBlob, setVideoBlob]   = useState(null);
  const [lang, setLang]             = useState("sv");

  const stoppRef    = useRef(false);
  const abortRef    = useRef(null);
  const autoplayRef = useRef(true);
  const recorderRef = useRef(null);
  const chunksRef   = useRef([]);
  const langRef     = useRef("sv");

  const L = lang === "en" ? {
    livePodd: "LIVE PODCAST", talar: "SPEAKING", repris: "REPLAY",
    panel: "Panel", amneLabel: "Topic", startaPodd: "▶ Start podcast",
    spelaIn: "Record video", debatten: "debates left this period",
    inlagg: "Post", stoppa: "⏹ Stop", amneRad: "Topic:",
    avslutad: "Debate ended", aiSummering: "AI summary",
    transkript: "Transcript", nyDebatt: "▶ New debate",
    laddaNed: "⬇ Download video", delaDebatt: "Share debate →",
    gransen: "Limit reached. Try again in",
    min: "min",
  } : {
    livePodd: "LIVE PODD", talar: "TALAR", repris: "REPRIS",
    panel: "Panel", amneLabel: "Ämne", startaPodd: "▶ Starta podden",
    spelaIn: "Spela in video", debatten: "debatter kvar denna period",
    inlagg: "Inlägg", stoppa: "⏹ Stoppa", amneRad: "Ämne:",
    avslutad: "Debatten avslutad", aiSummering: "AI-summering",
    transkript: "Transkript", nyDebatt: "▶ Ny debatt",
    laddaNed: "⬇ Ladda ned video", delaDebatt: "Dela debatten →",
    gransen: "Gränsen nådd. Försök igen om",
    min: "min",
  };

  // Beräknad i en useEffect (körs bara klientsidan, efter hydrering) istället för
  // direkt vid render — ett värde av typeof navigator/navigator.mediaDevices skiljer
  // sig mellan server (alltid false) och klient (kan vara true), vilket annars ger
  // ett hydration mismatch-fel på varje sidladdning eftersom checkboxen för
  // "Spela in video" bara finns i klientens första render, inte i serverns HTML.
  const [stöderInspelning, setStöderInspelning] = useState(false);

  useEffect(() => {
    setRateLimitInfo(peekLocalRL());
    setStöderInspelning(
      typeof navigator !== "undefined" && typeof navigator.mediaDevices?.getDisplayMedia === "function"
    );
    return () => { autoplayRef.current = false; };
  }, []);

  useEffect(() => {
    if (speakerAgent) setDisplayAgent(speakerAgent);
    else if (tänkande) setDisplayAgent(tänkande);
  }, [speakerAgent, tänkande]);

  function handleLangChange(l) {
    if (fas !== "start") return;
    setLang(l);
    langRef.current = l;
    setAmne(slumpaAmne(l));
  }

  async function spelaUppText(text, agent) {
    if (!autoplayRef.current) return;
    setSpeakerAgent(agent);
    const vp = AGENT_ROST[agent] || { pitch: 1.0, rate: 1.0 };
    const isFemale = !!AGENT_AZURE_VOICE[agent];
    const rvVoice = langRef.current === "en"
      ? (isFemale ? "US English Female" : "US English Male")
      : (isFemale ? "Swedish Female" : "Swedish Male");
    await new Promise(resolve => {
      if (!autoplayRef.current || stoppRef.current) { resolve(); return; }
      let iv;
      const startAnim = () => {
        iv = setInterval(() => {
          if (!autoplayRef.current) { clearInterval(iv); return; }
          const t = Date.now();
          // Golvet måste ligga under MOUTH_THRESH[0] - MOUTH_MARGIN (0.04) — annars
          // kan munnen aldrig gå tillbaka till stängt läge under tal (Codex-fynd, PR #1351).
          setAmplitude(Math.max(0.02, 0.35 + 0.55 * Math.sin(t * 0.009) * Math.abs(Math.cos(t * 0.014))));
        }, 70);
      };
      const stopAnim = () => { if (iv) clearInterval(iv); setAmplitude(0); resolve(); };
      const timeout = setTimeout(stopAnim, text.length * 80 + 5000);
      if (window.responsiveVoice) {
        window.responsiveVoice.speak(text, rvVoice, {
          pitch: vp.pitch, rate: vp.rate,
          onstart: startAnim,
          onend:   () => { clearTimeout(timeout); stopAnim(); },
          onerror: () => { clearTimeout(timeout); stopAnim(); },
        });
      } else {
        setTimeout(stopAnim, 100);
      }
    });
    if (autoplayRef.current) { setSpeakerAgent(null); setAmplitude(0); }
  }

  async function sokCachadDebatt(amne, agenter) {
    try {
      const url = `${SB_URL}/rest/v1/chatt_debatter?amne=eq.${encodeURIComponent(amne)}&order=skapad.desc&limit=20`;
      const res = await fetch(url, { headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` } });
      if (!res.ok) return null;
      const data = await res.json();
      const sorted = [...agenter].sort().join(",");
      return data.find(d => [...(d.agenter || [])].sort().join(",") === sorted) || null;
    } catch { return null; }
  }

  async function replay(debatt) {
    const h = debatt.inlagg || [];
    setAgenter(debatt.agenter); setFaktisktAmne(debatt.amne);
    setHistorik([]); setStreaming(null); setSummering(debatt.summering || "");
    setDebattId(debatt.id); setFel(""); setSpeakerAgent(null); setAmplitude(0);
    setÄrRepris(true);
    setDisplayAgent(debatt.agenter[0]);
    autoplayRef.current = true; stoppRef.current = false;
    setFas("kör");
    for (let i = 0; i < h.length; i++) {
      if (stoppRef.current) break;
      const inlagg = h[i];
      setTänkande(inlagg.agent);
      await new Promise(r => setTimeout(r, 500));
      setTänkande("");
      setHistorik(h.slice(0, i + 1));
      await spelaUppText(inlagg.text, inlagg.agent);
      if (!stoppRef.current && i < h.length - 1) await new Promise(r => setTimeout(r, 150));
    }
    setStreaming(null); setTänkande(""); setSpeakerAgent(null); setAmplitude(0);
    setFas("klar");
  }

  async function avsluta(h, valtAmne, valdaAgenter) {
    setStreaming(null); setTänkande("");
    setSpeakerAgent(null); setAmplitude(0);
    if (h.length >= 3) {
      const { summering: sum } = await fetchSummering(valtAmne, h);
      setSummering(sum);
      const id = await sparaDebatt({ amne: valtAmne, agenter: valdaAgenter, inlagg: h, summering: sum });
      setDebattId(id);
    }
    stoppaInspelning();
    setFas("klar");
  }

  async function startaInspelning() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "browser", frameRate: 30 },
        audio: { suppressLocalAudioPlayback: false },
        preferCurrentTab: true,
        selfBrowserSurface: "include",
      });
      chunksRef.current = [];
      const mimeType = ["video/webm;codecs=vp9,opus","video/webm","video/mp4"].find(t => MediaRecorder.isTypeSupported(t)) || "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        setVideoBlob(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start(1000);
      recorderRef.current = recorder;
      return true;
    } catch (e) {
      if (e.name !== "NotAllowedError") setFel("Skärminspelning misslyckades. Prova en annan webbläsare.");
      return false;
    }
  }

  function stoppaInspelning() {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
  }

  async function starta() {
    const rl = peekLocalRL();
    if (rl.remaining <= 0) {
      const min = Math.ceil((rl.resetAt - Date.now()) / 60000);
      setFel(`${L.gransen} ${min} ${L.min}.`);
      return;
    }
    const panel = PANELER[valdPanel];
    const valdaAgenter = panel.agenter ?? slumpAgenter;
    const valtAmne = amne.trim() || slumpaAmne(langRef.current);
    if (spelarIn) {
      const ok = await startaInspelning();
      if (!ok) return;
    }
    const cached = await sokCachadDebatt(valtAmne, valdaAgenter);
    if (cached) { await replay(cached); return; }
    // Egen id för DENNA debattstart — skickas till /api/chatt så ett omförsök av
    // samma tur (se retry-loopen i startaNy) inte tär på 5-debatter/10-min-kvoten
    // en gång till. Samma mönster som /chatt/page.js.
    const kvotId = (typeof crypto !== "undefined" && crypto.randomUUID)
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await startaNy(valdaAgenter, valtAmne, kvotId);
  }

  async function startaNy(valdaAgenter, valtAmne, kvotId) {
    const rl = peekLocalRL();
    if (rl.remaining <= 0) return;
    setRateLimitInfo(consumeLocalRL());
    setAgenter(valdaAgenter); setFaktisktAmne(valtAmne);
    setHistorik([]); setStreaming(null); setSummering(""); setDebattId(null); setFel("");
    setSpeakerAgent(null); setAmplitude(0);
    setDisplayAgent(valdaAgenter[0]);
    autoplayRef.current = true; stoppRef.current = false;
    setFas("kör");
    let h = [];
    for (let i = 0; i < 10; i++) {
      if (stoppRef.current) break;
      const agent = valdaAgenter[i % valdaAgenter.length];
      setTänkande(agent); setStreaming(null);
      try {
        let text = "", klar = false;
        // Groqs råa ström kan avbrytas mitt i utan att HTTP-anropet självt
        // misslyckas (groqRes.ok förblir true, se app/api/chatt/route.js) — utan
        // omförsök avslutade ett enda sådant avbrott hela podden i förtid
        // (t.ex. direkt efter första agentens tur). Ett tyst omförsök som
        // hoppar förbi Groq andra gången räcker för de flesta transienta
        // avbrott — samma mönster som /chatt/page.js.
        for (let forsok = 0; forsok < 2 && (!klar || arTroligenAvbruten(text)) && !stoppRef.current; forsok++) {
          if (forsok > 0) {
            setStreaming(null);
            await new Promise(r => setTimeout(r, 400));
            if (stoppRef.current) break;
          }
          let gotFirst = false;
          const abort = new AbortController(); abortRef.current = abort;
          const resultat = await streamSvar({
            amne: valtAmne, historik: h, agent, lang: langRef.current, signal: abort.signal,
            debattId: kvotId,
            hoppaOverGroq: forsok > 0,
            onToken: (t) => { if (!gotFirst) { gotFirst = true; setTänkande(""); } setStreaming({ agent, text: t }); },
          });
          text = resultat.text; klar = resultat.klar;
        }
        if (stoppRef.current) break;
        if (!text) { setFel("Debatten avbröts oväntat efter ett omförsök. Försök igen."); break; }
        setStreaming(null);
        const inlagg = { agent, text: text.trim(), id: i };
        h = [...h, inlagg]; setHistorik([...h]);
        await spelaUppText(text.trim(), agent);
      } catch (e) {
        if (e.name === "AbortError") break;
        setFel("Något gick fel. Försök igen."); break;
      } finally { setTänkande(""); }
      if (!stoppRef.current && i < 9) await new Promise(r => setTimeout(r, 150));
    }
    await avsluta(h, valtAmne, valdaAgenter);
  }

  function stoppa() {
    stoppRef.current = true; autoplayRef.current = false;
    try { window.responsiveVoice?.cancel(); } catch {}
    abortRef.current?.abort();
    stoppaInspelning();
    setSpeakerAgent(null); setAmplitude(0);
  }

  function nyDebatt() {
    stoppa(); autoplayRef.current = true;
    setFas("start"); setHistorik([]); setSummering(""); setDebattId(null);
    setFel(""); setÄrRepris(false); setVideoBlob(null);
    setAmne(slumpaAmne(langRef.current)); setSlumpAgenter(pickRandom(ALLA_AGENTER, 3));
    setDisplayAgent(null);
  }

  const valdaAgenter = PANELER[valdPanel].agenter ?? slumpAgenter;
  const currentDisplay = displayAgent || (agenter.length > 0 ? agenter[0] : null);

  return (
    <div style={{ background: C.bg, minHeight: "100dvh", color: C.text, fontFamily: "Georgia, serif", display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes dot { 0%,80%,100%{opacity:0.2} 40%{opacity:1} }
        .podd-layout { display:flex; flex:1; overflow:hidden; }
        .podd-main   { flex:1; min-width:0; display:flex; flex-direction:column; }
        .podd-side   { width:300px; min-width:300px; background:#111111; border-left:1px solid #1a1a1a; overflow-y:auto; display:flex; flex-direction:column; }
        @media(max-width:720px){
          .podd-layout{flex-direction:column; overflow:visible;}
          .podd-side{width:100%;min-width:0;border-left:none;border-top:1px solid #1a1a1a;}
          .podd-side > div { height:auto !important; overflow:visible !important; }
        }
      `}</style>

      {/* Live-indikator */}
      {fas === "kör" && (
        <div style={{ borderBottom: `1px solid ${C.border}`, padding: "6px 20px", background: C.bg, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "12px" }}>
          {ärrRepris && (
            <span style={{ fontSize: "11px", color: C.textMuted, fontFamily: "monospace", letterSpacing: "0.08em", border: `1px solid ${C.border}`, padding: "3px 8px", borderRadius: "4px" }}>{L.repris}</span>
          )}
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f87171", display: "inline-block" }} />
            <span style={{ fontSize: "11px", color: "#f87171", fontFamily: "monospace", letterSpacing: "0.1em" }}>{L.livePodd}</span>
          </span>
        </div>
      )}

      {/* ── START ── */}
      {fas === "start" && (
        <main style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 20px", width: "100%" }}>
          <p style={{ fontSize: "11px", color: "#888", letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 10px 0" }}>🎙 AI VIDEOPODDEN</p>
          <h1 style={{ fontSize: "32px", fontWeight: 400, margin: "0 0 8px 0", lineHeight: 1.2 }}>
            {lang === "en" ? "Live debate with AI agents" : "Live-debatt med AI-agenter"}
          </h1>
          <p style={{ color: C.textMuted, fontSize: "15px", lineHeight: 1.7, margin: "0 0 28px 0" }}>
            {lang === "en"
              ? "Choose a panel, write a topic and start — the agents debate with their own voices and animated faces."
              : "Välj panel, skriv ett ämne och starta — agenterna debatterar med egna röster och rörliga ansikten."}
          </p>

          {/* Språkväljare */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "28px" }}>
            {[["sv", "🇸🇪 Svenska"], ["en", "🇬🇧 English"]].map(([l, label]) => (
              <button key={l} onClick={() => handleLangChange(l)}
                style={{ padding: "8px 18px", background: lang === l ? C.accent : "transparent", color: lang === l ? "#080808" : C.textMuted, border: `1px solid ${lang === l ? C.accent+"80" : C.border}`, borderRadius: "4px", fontSize: "13px", fontWeight: lang === l ? 700 : 400, cursor: "pointer", fontFamily: "Georgia, serif", transition: "all 0.15s" }}>
                {label}
              </button>
            ))}
          </div>

          {/* Panel-val */}
          <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" }}>{L.panel}</p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "28px" }}>
            {PANELER.map((p, i) => (
              <button key={i} onClick={() => { setValdPanel(i); if (!p.agenter) setSlumpAgenter(pickRandom(ALLA_AGENTER, 3)); }}
                style={{ background: valdPanel === i ? `${C.accent}18` : "transparent", border: `1px solid ${valdPanel === i ? C.accent+"60" : C.border}`, color: valdPanel === i ? C.accent : C.textMuted, borderRadius: "4px", padding: "7px 14px", fontSize: "13px", cursor: "pointer", fontFamily: "Georgia, serif" }}>
                {p.namn}
              </button>
            ))}
          </div>

          {/* Agent-förhandsvisning */}
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginBottom: "28px" }}>
            {valdaAgenter.map(a => {
              const farg = AGENT_FARG[a] || C.accent;
              return (
                <div key={a} style={{ flex: 1, maxWidth: "180px", textAlign: "center" }}>
                  <div style={{ borderRadius: "8px", overflow: "hidden", aspectRatio: "1", border: `2px solid ${C.border}`, marginBottom: "8px" }}>
                    <img src={avatarSrc(a)} alt={a} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </div>
                  <p style={{ fontSize: "12px", color: farg, margin: 0, fontWeight: 600 }}>{a}</p>
                </div>
              );
            })}
          </div>

          {/* Ämne */}
          <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>{L.amneLabel}</p>
          <div style={{ position: "relative", marginBottom: "24px" }}>
            <input value={amne} onChange={e => setAmne(e.target.value)}
              style={{ background: "#0d0d0d", border: `1px solid ${C.border}`, borderRadius: "4px", color: C.text, fontFamily: "Georgia, serif", fontSize: "16px", padding: "12px 48px 12px 16px", width: "100%", boxSizing: "border-box", outline: "none" }} />
            <button onClick={() => setAmne(slumpaAmne(lang))} title="Slumpa ämne"
              style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.textMuted, fontSize: "18px", cursor: "pointer", padding: "4px 6px" }}>↺</button>
          </div>

          {rateLimitInfo.remaining <= 0 && (
            <p style={{ color: "#f87171", fontSize: "13px", margin: "0 0 16px 0" }}>
              {L.gransen} {Math.ceil(((rateLimitInfo.resetAt || Date.now()+600000) - Date.now()) / 60000)} {L.min}.
            </p>
          )}
          {fel && <p style={{ color: "#f87171", fontSize: "14px", margin: "0 0 16px 0" }}>{fel}</p>}

          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
            <button onClick={starta} disabled={rateLimitInfo.remaining <= 0}
              style={{ background: C.accent, color: "#080808", border: "none", borderRadius: "4px", padding: "14px 36px", fontSize: "15px", fontWeight: 700, letterSpacing: "0.08em", cursor: rateLimitInfo.remaining > 0 ? "pointer" : "not-allowed", fontFamily: "Georgia, serif" }}>
              {L.startaPodd}
            </button>
            {stöderInspelning && (
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input type="checkbox" checked={spelarIn} onChange={e => setSpelarIn(e.target.checked)}
                  style={{ width: "16px", height: "16px", accentColor: C.accent, cursor: "pointer" }} />
                <span style={{ fontSize: "13px", color: C.textMuted }}>{L.spelaIn}</span>
              </label>
            )}
          </div>
          <p style={{ color: C.textMuted, fontSize: "12px", margin: 0 }}>
            {rateLimitInfo.remaining}/{RL_LIMIT} {L.debatten}
          </p>
        </main>
      )}

      {/* ── KÖR ── */}
      {fas === "kör" && agenter.length > 0 && currentDisplay && (
        <>
          <div className="podd-layout">
            <div className="podd-main">
              <AgentDisplay
                namn={currentDisplay}
                speaking={speakerAgent === currentDisplay}
                tänkande={tänkande}
                amplitude={speakerAgent === currentDisplay ? amplitude : 0}
                talarLabel={L.talar}
              />
            </div>

            <div className="podd-side">
              <InfoPanel namn={currentDisplay} streaming={speakerAgent === currentDisplay ? streaming : null} historik={historik} lang={lang} />
            </div>
          </div>

          {/* Botten */}
          <div style={{ borderTop: `1px solid ${C.border}`, padding: "14px 20px", background: C.surface, flexShrink: 0 }}>
            <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                {agenter.map(a => <AgentThumb key={a} namn={a} active={speakerAgent === a || (!speakerAgent && tänkande === a)} />)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ height: "3px", background: C.border, borderRadius: "2px" }}>
                  <div style={{ height: "100%", width: `${(historik.length / 10) * 100}%`, background: C.accent, borderRadius: "2px", transition: "width 0.5s ease" }} />
                </div>
                <p style={{ fontSize: "11px", color: C.textMuted, margin: "5px 0 0 0", fontFamily: "monospace" }}>
                  {L.inlagg} {historik.length}/10
                </p>
              </div>
              <button onClick={stoppa} style={{ background: "none", border: `1px solid #f8717140`, color: "#f87171", borderRadius: "4px", padding: "8px 18px", fontSize: "13px", cursor: "pointer", fontFamily: "Georgia, serif", flexShrink: 0 }}>
                {L.stoppa}
              </button>
            </div>
          </div>

          {/* Ämnesrad */}
          <div style={{ padding: "10px 20px", borderTop: `1px solid ${C.border}`, background: C.bg, flexShrink: 0 }}>
            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
              <p style={{ fontSize: "13px", color: C.textMuted, margin: 0 }}>
                {L.amneRad} <span style={{ color: C.text }}>{faktisktAmne}</span>
              </p>
            </div>
          </div>
        </>
      )}

      {/* ── KLAR ── */}
      {fas === "klar" && (
        <main style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 20px", width: "100%" }}>
          <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 20px 0" }}>{L.avslutad}</p>

          <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginBottom: "28px" }}>
            {agenter.map(a => (
              <div key={a} style={{ flex: 1, maxWidth: "200px", textAlign: "center" }}>
                <div style={{ borderRadius: "8px", overflow: "hidden", aspectRatio: "1", border: `2px solid ${(AGENT_FARG[a]||C.accent)+"40"}`, marginBottom: "8px" }}>
                  <img src={avatarSrc(a)} alt={a} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
                <p style={{ fontSize: "12px", color: AGENT_FARG[a]||C.accent, margin: 0, fontWeight: 600 }}>{a}</p>
              </div>
            ))}
          </div>

          <p style={{ fontSize: "13px", color: C.textMuted, textAlign: "center", marginBottom: "24px", fontStyle: "italic" }}>{faktisktAmne}</p>

          {summering && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "20px", marginBottom: "24px" }}>
              <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px 0" }}>{L.aiSummering}</p>
              <p style={{ color: C.text, fontSize: "15px", lineHeight: 1.75, margin: 0, fontStyle: "italic" }}>{summering}</p>
            </div>
          )}

          <div style={{ marginBottom: "28px" }}>
            <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 12px 0" }}>{L.transkript}</p>
            {historik.map((e, i) => (
              <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "14px" }}>
                <div style={{ width: "3px", borderRadius: "2px", background: AGENT_FARG[e.agent]||C.accent, flexShrink: 0, alignSelf: "stretch" }} />
                <div>
                  <p style={{ fontSize: "11px", color: AGENT_FARG[e.agent]||C.accent, margin: "0 0 4px 0", letterSpacing: "0.06em" }}>{e.agent}</p>
                  <p style={{ color: C.textMuted, fontSize: "14px", lineHeight: 1.7, margin: 0 }}>{e.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button onClick={nyDebatt} style={{ background: C.accent, color: C.bg, border: "none", borderRadius: "4px", padding: "12px 28px", fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: "Georgia, serif" }}>
              {L.nyDebatt}
            </button>
            {videoBlob && (
              <a
                href={URL.createObjectURL(videoBlob)}
                download={`debatt-${faktisktAmne.slice(0, 40).replace(/[^a-zåäöA-ZÅÄÖ0-9 ]/g, "").trim()}.webm`}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "none", border: `1px solid ${C.accent}60`, color: C.accent, borderRadius: "4px", padding: "12px 24px", fontSize: "14px", textDecoration: "none" }}
              >
                {L.laddaNed}
              </a>
            )}
            {debattId && (
              <a href={`/chatt/${debattId}`} style={{ display: "inline-flex", alignItems: "center", background: "none", border: `1px solid ${C.border}`, color: C.textMuted, borderRadius: "4px", padding: "12px 24px", fontSize: "14px", textDecoration: "none" }}>
                {L.delaDebatt}
              </a>
            )}
          </div>
        </main>
      )}

    </div>
  );
}
