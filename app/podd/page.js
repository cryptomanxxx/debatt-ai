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
function avatarSrc(namn)       { return `/avatarer/podd/${agentSlug(namn)}.png`; }
function avatarFallback(namn)  { return `/avatarer/${agentSlug(namn)}.png`; }
function talkingVideoSrc(namn) { return `/avatarer/podd/${agentSlug(namn)}-talking.mp4`; }

const AGENT_AZURE_VOICE = {
  "Psykolog":       "sv-SE-SofieNeural",
  "Sociolog":       "sv-SE-SofieNeural",
  "Mamman":         "sv-SE-SofieNeural",
  "Den stressade":  "sv-SE-SofieNeural",
  "Den lugna":      "sv-SE-SofieNeural",
  "Hypokondrikern": "sv-SE-SofieNeural",
  "Optimisten":     "sv-SE-SofieNeural",
  "Miljöaktivist":  "sv-SE-SofieNeural",
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
const AMNEN = [
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

function pickRandom(arr, n) { return [...arr].sort(() => Math.random() - 0.5).slice(0, n); }
function slumpaAmne() { return AMNEN[Math.floor(Math.random() * AMNEN.length)]; }

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

async function streamSvar({ amne, historik, agent, onToken, signal }) {
  const res = await fetch("/api/chatt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amne, historik, agent }),
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
        if (raw === "[DONE]") return text;
        try {
          const token = JSON.parse(raw).choices?.[0]?.delta?.content ?? "";
          if (token) { text += token; onToken(text); }
        } catch { /* ignore */ }
      }
    }
  } catch (e) { if (e.name !== "AbortError") throw e; }
  return text;
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

function AgentDisplay({ namn, speaking, tänkande, amplitude }) {
  const farg = AGENT_FARG[namn] || C.accent;
  const isTänkande = tänkande === namn;
  const glow = speaking ? 18 + amplitude * 40 : 0;
  const videoRef = useRef(null);
  const hasLoop = ["Nationalekonom","Miljöaktivist","Teknikoptimist"].includes(namn);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (speaking) { v.currentTime = 0; v.play().catch(() => {}); }
    else v.pause();
  }, [speaking]);

  return (
    <div style={{ position: "relative", width: "100%", paddingTop: "75%", background: "#000", flexShrink: 0 }}>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>

        {/* HD-stillbild — visas när agenten inte talar */}
        <img src={avatarSrc(namn)} alt={namn}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block",
            opacity: (speaking && hasLoop) ? 0 : 1, transition: "opacity 0.3s ease",
          }}
          onError={e => { if (!e.target.dataset.fb) { e.target.dataset.fb = "1"; e.target.src = avatarFallback(namn); } }} />

        {/* Loop-video — visas och loopas när agenten talar */}
        {hasLoop && (
          <video ref={videoRef} src={talkingVideoSrc(namn)} muted loop playsInline
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
              opacity: speaking ? 1 : 0, transition: "opacity 0.3s ease",
              filter: speaking ? `drop-shadow(0 0 ${glow}px ${farg}55)` : "none",
            }} />
        )}

        {/* Tänker-overlay */}
        {isTänkande && !speaking && (
          <div style={{ position: "absolute", inset: 0, background: "#00000060", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              {[0,1,2].map(j => <div key={j} style={{ width: "12px", height: "12px", borderRadius: "50%", background: farg, animation: `dot 1.2s ease-in-out ${j*0.2}s infinite` }} />)}
            </div>
          </div>
        )}

        {/* Nedre gradient + info */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "48px 20px 18px", background: "linear-gradient(transparent, rgba(0,0,0,0.88))" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              {speaking && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#f87171", display: "inline-block" }} />
                  <span style={{ fontSize: "11px", color: "#f87171", fontFamily: "monospace", letterSpacing: "0.1em" }}>TALAR</span>
                </div>
              )}
              <p style={{ fontSize: "22px", fontWeight: 700, color: C.text, margin: 0, fontFamily: "Times New Roman, serif", textShadow: "0 2px 8px #000" }}>{namn}</p>
            </div>
            {speaking && <Waveform amplitude={amplitude} farg={farg} />}
          </div>
        </div>

        {/* Glödram när agenten talar */}
        {speaking && (
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", boxShadow: `inset 0 0 ${glow * 1.5}px ${farg}33`, border: `2px solid ${farg}55`, transition: "box-shadow 0.08s ease" }} />
        )}
      </div>
    </div>
  );
}

function InfoPanel({ namn, streaming, historik }) {
  const farg = AGENT_FARG[namn] || C.accent;
  const info = AGENT_INFO[namn] || {};
  const transcriptRef = useRef(null);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [historik]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Fixed top: agent info + live text */}
      <div style={{ flexShrink: 0, padding: "24px 20px 16px", borderBottom: historik.length > 0 ? `1px solid ${C.border}` : "none" }}>
        <p style={{ fontSize: "10px", color: C.textMuted, letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 14px 0" }}>Om agenten</p>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: C.text, margin: "0 0 4px 0", fontFamily: "Times New Roman, serif" }}>{namn}</h2>
        <p style={{ fontSize: "11px", color: farg, margin: "0 0 16px 0", letterSpacing: "0.05em" }}>{info.tags}</p>

        {[
          { label: "Röst",     value: info.rost     },
          { label: "Roll",     value: info.roll     },
          { label: "Styrka",   value: info.styrka   },
          { label: "Utmaning", value: info.utmaning },
        ].map(({ label, value }) => value ? (
          <div key={label} style={{ marginBottom: "10px" }}>
            <p style={{ fontSize: "10px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 3px 0" }}>{label}</p>
            <p style={{ fontSize: "13px", color: C.text, margin: 0, lineHeight: 1.55 }}>{value}</p>
          </div>
        ) : null)}

        {/* Streaming text */}
        {streaming && (
          <div style={{ marginTop: "12px", padding: "12px", background: C.bg, border: `1px solid ${farg}30`, borderRadius: "6px" }}>
            <p style={{ fontSize: "10px", color: farg, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 6px 0" }}>Talar nu</p>
            <p style={{ fontSize: "13px", color: C.text, lineHeight: 1.7, margin: 0 }}>
              {streaming.text}
              <span style={{ display: "inline-block", width: "2px", height: "1em", background: farg, marginLeft: "2px", verticalAlign: "text-bottom", animation: "dot 0.8s step-end infinite" }} />
            </p>
          </div>
        )}
      </div>

      {/* Scrollable transcript — newest first, scrolls independently */}
      {historik.length > 0 && (
        <div ref={transcriptRef} style={{ flex: 1, overflowY: "auto", padding: "14px 20px" }}>
          <p style={{ fontSize: "10px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 12px 0" }}>Transkript ({historik.length}/10)</p>
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
      <img src={avatarSrc(namn)} alt={namn} style={{ width: "100%", height: "100%", objectFit: "cover" }}
        onError={e => { if (!e.target.dataset.fb) { e.target.dataset.fb = "1"; e.target.src = avatarFallback(namn); } }} />
    </div>
  );
}

// ── Huvudkomponent ────────────────────────────────────────────────────────────

export default function PoddPage() {
  const [fas, setFas]               = useState("start");
  const [amne, setAmne]             = useState(() => slumpaAmne());
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

  const stoppRef    = useRef(false);
  const abortRef    = useRef(null);
  const autoplayRef = useRef(true);
  const svVoiceRef  = useRef(null);
  const audioCtxRef = useRef(null);
  const audioSrcRef = useRef(null);

  useEffect(() => {
    setRateLimitInfo(peekLocalRL());
    function laddaRoster() {
      const voices = speechSynthesis.getVoices();
      const sv = voices.find(v => v.lang.startsWith("sv")) || voices[0] || null;
      svVoiceRef.current = sv;
    }
    laddaRoster();
    speechSynthesis.onvoiceschanged = laddaRoster;
    return () => { autoplayRef.current = false; speechSynthesis.cancel(); };
  }, []);

  useEffect(() => {
    if (speakerAgent) setDisplayAgent(speakerAgent);
    else if (tänkande) setDisplayAgent(tänkande);
  }, [speakerAgent, tänkande]);

  async function spelaUppText(text, agent) {
    if (!autoplayRef.current) return;
    setSpeakerAgent(agent);
    const vp = AGENT_ROST[agent] || { pitch: 1.0, rate: 1.0 };
    const harSvRost = Boolean(typeof speechSynthesis !== "undefined" && svVoiceRef.current?.lang?.startsWith("sv"));

    if (harSvRost) {
      const meningar = text.replace(/\n+/g, " ").match(/[^.!?]+[.!?]*/g) || [text];
      for (const mening of meningar) {
        if (!autoplayRef.current || stoppRef.current) break;
        await new Promise((resolve) => {
          const utt = new SpeechSynthesisUtterance(mening.trim());
          utt.lang = "sv-SE"; utt.voice = svVoiceRef.current; utt.pitch = vp.pitch; utt.rate = vp.rate; utt.volume = 1;
          let boundaryFired = false;
          let fallbackTimer = null;
          utt.onboundary = (e) => {
            if (e.name !== "word") return;
            boundaryFired = true;
            setAmplitude(0.45 + Math.random() * 0.55);
            setTimeout(() => setAmplitude(0.08 + Math.random() * 0.12), 110 + Math.random() * 80);
          };
          fallbackTimer = setTimeout(() => {
            if (!boundaryFired) {
              const iv = setInterval(() => {
                if (!autoplayRef.current) { clearInterval(iv); return; }
                const t = Date.now();
                setAmplitude(Math.max(0.05, 0.35 + 0.55 * Math.sin(t * 0.009) * Math.abs(Math.cos(t * 0.014))));
              }, 70);
              utt._fallbackIv = iv;
            }
          }, 300);
          utt.onend = () => { clearTimeout(fallbackTimer); if (utt._fallbackIv) clearInterval(utt._fallbackIv); setAmplitude(0); resolve(); };
          utt.onerror = () => { clearTimeout(fallbackTimer); if (utt._fallbackIv) clearInterval(utt._fallbackIv); setAmplitude(0); resolve(); };
          speechSynthesis.speak(utt);
        });
      }
    } else {
      const azureVoice = AGENT_AZURE_VOICE[agent] || "sv-SE-MattiasNeural";
      const meningar = text.replace(/\n+/g, " ").match(/[^.!?]+[.!?]*/g) || [text];
      for (const mening of meningar) {
        if (!autoplayRef.current || stoppRef.current) break;
        const trimmed = mening.trim();
        if (!trimmed) continue;
        try {
          const resp = await fetch(`/api/azure-tts?text=${encodeURIComponent(trimmed.slice(0, 500))}&voice=${azureVoice}`);
          if (!resp.ok) throw new Error("azure-tts");
          const buf = await resp.arrayBuffer();
          if (stoppRef.current || !autoplayRef.current) break;
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          audioCtxRef.current = ctx;
          const audioBuf = await ctx.decodeAudioData(buf);
          const analyser = ctx.createAnalyser(); analyser.fftSize = 256;
          const src = ctx.createBufferSource(); audioSrcRef.current = src;
          src.buffer = audioBuf; src.connect(analyser); analyser.connect(ctx.destination);
          const data = new Uint8Array(analyser.frequencyBinCount); let rafId;
          const tick = () => {
            if (!autoplayRef.current) { cancelAnimationFrame(rafId); setAmplitude(0); return; }
            analyser.getByteTimeDomainData(data);
            let sum = 0; for (let i = 0; i < data.length; i++) { const v = (data[i]-128)/128; sum += v*v; }
            setAmplitude(Math.min(1, Math.sqrt(sum/data.length)*8)); rafId = requestAnimationFrame(tick);
          };
          await new Promise(resolve => {
            const cleanup = () => { cancelAnimationFrame(rafId); try { ctx.close(); } catch {} setAmplitude(0); resolve(); };
            src.onended = cleanup; src.start(0); tick();
            setTimeout(cleanup, audioBuf.duration * 1000 + 1500);
          });
        } catch {
          const ms = Math.max(800, trimmed.length * 55);
          await new Promise(resolve => {
            const iv = setInterval(() => {
              if (!autoplayRef.current) { clearInterval(iv); resolve(); return; }
              const t = Date.now();
              setAmplitude(Math.max(0.05, 0.35 + 0.55 * Math.sin(t*0.009) * Math.abs(Math.cos(t*0.014))));
            }, 70);
            setTimeout(() => { clearInterval(iv); setAmplitude(0); resolve(); }, ms);
          });
        }
      }
    }
    if (autoplayRef.current) { setSpeakerAgent(null); setAmplitude(0); }
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
    setFas("klar");
  }

  async function starta() {
    const rl = peekLocalRL();
    if (rl.remaining <= 0) {
      const min = Math.ceil((rl.resetAt - Date.now()) / 60000);
      setFel(`Gränsen nådd (${RL_LIMIT} debatter/10 min). Försök igen om ${min} min.`);
      return;
    }
    const panel = PANELER[valdPanel];
    const valdaAgenter = panel.agenter ?? slumpAgenter;
    const valtAmne = amne.trim() || slumpaAmne();
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
      const abort = new AbortController(); abortRef.current = abort;
      try {
        let gotFirst = false;
        const text = await streamSvar({
          amne: valtAmne, historik: h, agent, signal: abort.signal,
          onToken: (t) => { if (!gotFirst) { gotFirst = true; setTänkande(""); } setStreaming({ agent, text: t }); },
        });
        if (stoppRef.current) break;
        if (!text) { setFel("Debatten avbröts oväntat."); break; }
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
    speechSynthesis.cancel();
    try { audioSrcRef.current?.stop(); } catch {}
    try { audioCtxRef.current?.close(); } catch {}
    abortRef.current?.abort();
    setSpeakerAgent(null); setAmplitude(0);
  }

  function nyDebatt() {
    stoppa(); autoplayRef.current = true;
    setFas("start"); setHistorik([]); setSummering(""); setDebattId(null);
    setFel(""); setAmne(slumpaAmne()); setSlumpAgenter(pickRandom(ALLA_AGENTER, 3));
    setDisplayAgent(null);
  }

  const valdaAgenter = PANELER[valdPanel].agenter ?? slumpAgenter;
  const currentDisplay = displayAgent || (agenter.length > 0 ? agenter[0] : null);

  return (
    <div style={{ background: C.bg, height: fas === "kör" ? "100dvh" : "auto", minHeight: fas === "kör" ? "unset" : "100vh", overflow: fas === "kör" ? "hidden" : "visible", color: C.text, fontFamily: "Georgia, serif", display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes dot { 0%,80%,100%{opacity:0.2} 40%{opacity:1} }
        .podd-layout { display:flex; flex:1; overflow:hidden; }
        .podd-main   { flex:1; min-width:0; display:flex; flex-direction:column; }
        .podd-side   { width:300px; min-width:300px; background:#111111; border-left:1px solid #1a1a1a; overflow-y:auto; display:flex; flex-direction:column; }
        @media(max-width:720px){
          .podd-layout{flex-direction:column;}
          .podd-side{width:100%;min-width:0;border-left:none;border-top:1px solid #1a1a1a;max-height:380px;}
        }
      `}</style>

      {/* Header */}
      <header style={{ borderBottom: `1px solid ${C.border}`, padding: "0 20px", background: `${C.bg}f0`, backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", maxWidth: "1200px", margin: "0 auto", flexWrap: "wrap" }}>
          <a href="/" style={{ fontFamily: "Times New Roman, serif", fontSize: "20px", fontWeight: 700, color: "#e879f9", padding: "10px 16px 10px 0", textDecoration: "none" }}>DEBATT-AI</a>
          <a href="/" className="neon-nav">Hem</a>
          <a href="/arkiv" className="neon-nav">Arkiv</a>
          <a href="/chatt" className="neon-nav">Direktdebatt</a>
          <a href="/podd" className="neon-nav" style={{ color: C.accent }}>Videopodden</a>
          {fas === "kör" && (
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f87171", display: "inline-block" }} />
              <span style={{ fontSize: "11px", color: "#f87171", fontFamily: "monospace", letterSpacing: "0.1em" }}>LIVE PODD</span>
            </div>
          )}
        </div>
      </header>

      {/* ── START ── */}
      {fas === "start" && (
        <main style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 20px", width: "100%" }}>
          <p style={{ fontSize: "11px", color: "#888", letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 10px 0" }}>🎙 AI VIDEOPODDEN</p>
          <h1 style={{ fontSize: "32px", fontWeight: 400, margin: "0 0 8px 0", lineHeight: 1.2 }}>Live-debatt med AI-agenter</h1>
          <p style={{ color: C.textMuted, fontSize: "15px", lineHeight: 1.7, margin: "0 0 36px 0" }}>Välj panel, skriv ett ämne och starta — agenterna debatterar med egna röster och rörliga ansikten.</p>

          {/* Panel-val */}
          <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" }}>Panel</p>
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
                    <img src={avatarSrc(a)} alt={a} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      onError={e => { if (!e.target.dataset.fb) { e.target.dataset.fb = "1"; e.target.src = avatarFallback(a); } }} />
                  </div>
                  <p style={{ fontSize: "12px", color: farg, margin: 0, fontWeight: 600 }}>{a}</p>
                </div>
              );
            })}
          </div>

          {/* Ämne */}
          <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>Ämne</p>
          <div style={{ position: "relative", marginBottom: "24px" }}>
            <input value={amne} onChange={e => setAmne(e.target.value)}
              style={{ background: "#0d0d0d", border: `1px solid ${C.border}`, borderRadius: "4px", color: C.text, fontFamily: "Georgia, serif", fontSize: "16px", padding: "12px 48px 12px 16px", width: "100%", boxSizing: "border-box", outline: "none" }} />
            <button onClick={() => setAmne(slumpaAmne())} title="Slumpa ämne"
              style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.textMuted, fontSize: "18px", cursor: "pointer", padding: "4px 6px" }}>↺</button>
          </div>

          {rateLimitInfo.remaining <= 0 && (
            <p style={{ color: "#f87171", fontSize: "13px", margin: "0 0 16px 0" }}>
              Gränsen nådd. Försök igen om {Math.ceil(((rateLimitInfo.resetAt || Date.now()+600000) - Date.now()) / 60000)} min.
            </p>
          )}
          {fel && <p style={{ color: "#f87171", fontSize: "14px", margin: "0 0 16px 0" }}>{fel}</p>}

          <button onClick={starta} disabled={rateLimitInfo.remaining <= 0}
            style={{ background: C.accent, color: "#080808", border: "none", borderRadius: "4px", padding: "14px 36px", fontSize: "15px", fontWeight: 700, letterSpacing: "0.08em", cursor: rateLimitInfo.remaining > 0 ? "pointer" : "not-allowed", fontFamily: "Georgia, serif" }}>
            ▶ Starta podden
          </button>
          <p style={{ color: C.textMuted, fontSize: "12px", marginTop: "10px" }}>
            {rateLimitInfo.remaining}/{RL_LIMIT} debatter kvar denna period
          </p>
        </main>
      )}

      {/* ── KÖR ── */}
      {fas === "kör" && agenter.length > 0 && currentDisplay && (
        <>
          <div className="podd-layout">
            {/* Vänster: stor agent-display */}
            <div className="podd-main">
              <AgentDisplay
                namn={currentDisplay}
                speaking={speakerAgent === currentDisplay}
                tänkande={tänkande}
                amplitude={speakerAgent === currentDisplay ? amplitude : 0}
              />
            </div>

            {/* Höger: info-panel */}
            <div className="podd-side">
              <InfoPanel namn={currentDisplay} streaming={speakerAgent === currentDisplay ? streaming : null} historik={historik} />
            </div>
          </div>

          {/* Botten: agent-strip + progress + stopp */}
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
                  Inlägg {historik.length}/10
                </p>
              </div>
              <button onClick={stoppa} style={{ background: "none", border: `1px solid #f8717140`, color: "#f87171", borderRadius: "4px", padding: "8px 18px", fontSize: "13px", cursor: "pointer", fontFamily: "Georgia, serif", flexShrink: 0 }}>
                ⏹ Stoppa
              </button>
            </div>
          </div>

          {/* Ämnesrad */}
          <div style={{ padding: "10px 20px", borderTop: `1px solid ${C.border}`, background: C.bg, flexShrink: 0 }}>
            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
              <p style={{ fontSize: "13px", color: C.textMuted, margin: 0 }}>
                Ämne: <span style={{ color: C.text }}>{faktisktAmne}</span>
              </p>
            </div>
          </div>
        </>
      )}

      {/* ── KLAR ── */}
      {fas === "klar" && (
        <main style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 20px", width: "100%" }}>
          <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 20px 0" }}>Debatten avslutad</p>

          {/* Agent-bilder */}
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginBottom: "28px" }}>
            {agenter.map(a => (
              <div key={a} style={{ flex: 1, maxWidth: "200px", textAlign: "center" }}>
                <div style={{ borderRadius: "8px", overflow: "hidden", aspectRatio: "1", border: `2px solid ${(AGENT_FARG[a]||C.accent)+"40"}`, marginBottom: "8px" }}>
                  <img src={avatarSrc(a)} alt={a} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    onError={e => { if (!e.target.dataset.fb) { e.target.dataset.fb = "1"; e.target.src = avatarFallback(a); } }} />
                </div>
                <p style={{ fontSize: "12px", color: AGENT_FARG[a]||C.accent, margin: 0, fontWeight: 600 }}>{a}</p>
              </div>
            ))}
          </div>

          <p style={{ fontSize: "13px", color: C.textMuted, textAlign: "center", marginBottom: "24px", fontStyle: "italic" }}>{faktisktAmne}</p>

          {summering && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "20px", marginBottom: "24px" }}>
              <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px 0" }}>AI-summering</p>
              <p style={{ color: C.text, fontSize: "15px", lineHeight: 1.75, margin: 0, fontStyle: "italic" }}>{summering}</p>
            </div>
          )}

          <div style={{ marginBottom: "28px" }}>
            <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 12px 0" }}>Transkript</p>
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
              ▶ Ny debatt
            </button>
            {debattId && (
              <a href={`/chatt/${debattId}`} style={{ display: "inline-flex", alignItems: "center", background: "none", border: `1px solid ${C.border}`, color: C.textMuted, borderRadius: "4px", padding: "12px 24px", fontSize: "14px", textDecoration: "none" }}>
                Dela debatten →
              </a>
            )}
          </div>
        </main>
      )}
    </div>
  );
}
