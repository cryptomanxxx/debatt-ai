"use client";
import { useState, useRef, useEffect } from "react";
import ChattShareButtons from "./[id]/ChattShareButtons";
import NavHistorikLink from "../NavHistorikLink";
import AgentAvatar from "../agent/[namn]/AgentAvatar";
import { agentVisuell } from "../agentData";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#1e1e1e",
  text: "#e8e0d0", textMuted: "#555", accent: "#c8b89a", accentDim: "#8a7a6a",
};

const PANELER = [
  { namn: "Ekonomi & Klimat",    agenter: ["Nationalekonom", "Miljöaktivist", "Kryptoanalytiker"] },
  { namn: "Juridik & Media",     agenter: ["Jurist", "Konservativ debattör", "Journalist"] },
  { namn: "Vetenskap & Filosofi",agenter: ["Teknikoptimist", "Historiker", "Filosof"] },
  { namn: "Hälsa & Psyke",      agenter: ["Läkare", "Psykolog", "Hypokondrikern"] },
  { namn: "Klass & Pengar",      agenter: ["Sociolog", "Den rike", "Den hungriga"] },
  { namn: "Vardag & Familj",     agenter: ["Mamman", "Pensionären", "Den lugna"] },
  { namn: "Frustration & Trötthet", agenter: ["Den trötta", "Den stressade", "Den sura"] },
  { namn: "Tidens röster",       agenter: ["Tonåringen", "Den nostalgiske", "Optimisten"] },
  { namn: "Slumpmässiga agenter", agenter: null },
];

const ALLA_AGENTER = [
  "Nationalekonom","Miljöaktivist","Teknikoptimist","Konservativ debattör",
  "Jurist","Journalist","Filosof","Läkare","Psykolog","Historiker",
  "Sociolog","Kryptoanalytiker","Den hungriga","Mamman","Den sura",
  "Den trötta","Den stressade","Den lugna","Pensionären","Tonåringen",
  "Den nostalgiske","Hypokondrikern","Optimisten","Den rike",
];


const AGENT_FARG = {
  "Nationalekonom":"#6abf6a","Miljöaktivist":"#4ade80","Teknikoptimist":"#38bdf8",
  "Konservativ debattör":"#b8862a","Jurist":"#d4945a","Journalist":"#fbbf24",
  "Filosof":"#e879f9","Läkare":"#f87171","Psykolog":"#fbbf24",
  "Historiker":"#fbbf24","Sociolog":"#34d399","Kryptoanalytiker":"#f59e0b",
  "Den hungriga":"#86efac","Mamman":"#f9a8d4","Den sura":"#94a3b8",
  "Den trötta":"#7dd3fc","Den stressade":"#fca5a5","Den lugna":"#a7f3d0",
  "Pensionären":"#d8b4fe","Tonåringen":"#fdba74","Den nostalgiske":"#fde68a",
  "Hypokondrikern":"#6ee7b7","Optimisten":"#fcd34d","Den rike":"#c4b5fd",
};

// Konfidenspoäng — bas + spridning per agent (speglar personlighet)
const KONFIDENSPROFILE = {
  "Nationalekonom":       { base: 78, spread: 8 },
  "Miljöaktivist":        { base: 85, spread: 10 },
  "Teknikoptimist":       { base: 84, spread: 8 },
  "Konservativ debattör": { base: 76, spread: 7 },
  "Jurist":               { base: 83, spread: 5 },
  "Journalist":           { base: 72, spread: 14 },
  "Filosof":              { base: 52, spread: 22 },  // tvivlar alltid lite
  "Läkare":               { base: 80, spread: 6 },
  "Psykolog":             { base: 70, spread: 16 },
  "Historiker":           { base: 74, spread: 10 },
  "Sociolog":             { base: 77, spread: 10 },
  "Kryptoanalytiker":     { base: 89, spread: 8 },   // övertygad troende
  "Den hungriga":         { base: 93, spread: 4 },   // grundbehov = inga tvivel
  "Mamman":               { base: 86, spread: 7 },
  "Den sura":             { base: 90, spread: 6 },   // alltid säker på saken
  "Den trötta":           { base: 40, spread: 20 },  // orkar knappt bry sig
  "Den stressade":        { base: 63, spread: 22 },  // varierar vilt
  "Den lugna":            { base: 57, spread: 12 },  // lugnt ifrågasättande
  "Pensionären":          { base: 91, spread: 5 },   // "har sett allt förut"
  "Tonåringen":           { base: 60, spread: 24 },  // ibland skarp, ibland lost
  "Den nostalgiske":      { base: 82, spread: 8 },
  "Hypokondrikern":       { base: 70, spread: 20 },  // googlar och oroar sig
  "Optimisten":           { base: 83, spread: 9 },
  "Den rike":             { base: 86, spread: 7 },
};

function genereraKonfidensPoang(agent) {
  const p = KONFIDENSPROFILE[agent] ?? { base: 70, spread: 15 };
  const raw = p.base + (Math.random() * p.spread * 2) - p.spread;
  return Math.round(Math.min(99, Math.max(28, raw)));
}

// ── Ämnen per kategori ────────────────────────────────────────────────────────
const KATEGORIER = [
  { id: "ai-tech",  label: "AI & Tech",  emoji: "🧠" },
  { id: "ekonomi",  label: "Ekonomi",    emoji: "💰" },
  { id: "politik",  label: "Politik",    emoji: "⚖️" },
  { id: "vardag",   label: "Vardag",     emoji: "❤️" },
];

const AMNEN = {
  "ai-tech": [
    "Ska AI få fatta juridiska beslut?",
    "Bör AI ha rättigheter i framtiden?",
    "Ska skolor förbjuda AI-verktyg helt?",
    "Ska algoritmer bestämma vad vi ser online?",
    "Kan robotar ersätta terapeuter?",
    "Är dataintegritet viktigare än bekvämlighet?",
    "Ska ansiktsigenkänning tillåtas i det offentliga?",
    "Kan AI ersätta läkare?",
    "Är Bitcoin framtidens valuta?",
  ],
  "ekonomi": [
    "Ska vi beskatta rika mycket mer?",
    "Är gig-ekonomin bra eller dålig?",
    "Ska staten rädda företag i kris?",
    "Ska arvsskatt återinföras?",
    "Är bostadsmarknaden trasig?",
    "Ska staten äga fler bolag?",
    "Är inflation ett klassproblem?",
    "Ska vi ha fyradagarsvecka?",
    "Är grundinkomst en bra idé?",
    "Ska rika få köpa bättre vård?",
  ],
  "politik": [
    "Ska Sverige ha kärnkraft?",
    "Ska droger legaliseras?",
    "Är yttrandefriheten hotad i Sverige?",
    "Ska Sverige införa tiggeriförbud?",
    "Bör bidrag villkoras hårdare?",
    "Är demokrati överskattat?",
    "Ska man få säga vad som helst online?",
    "Ska rösträttsåldern sänkas till 16?",
    "Ska nationalstaten avskaffas?",
    "Är Sverige för litet för att påverka klimatet?",
    "Är klimatrörelsen för radikal?",
    "Är sociala medier bra för demokratin?",
    "Ska flygskatten höjas?",
    "Ska kött beskattas hårdare?",
  ],
  "vardag": [
    "Ska barn ha egna mobiltelefoner?",
    "Är dagens föräldrar för överbeskyddande?",
    "Har livet blivit sämre trots högre standard?",
    "Är det fel att skaffa barn idag?",
    "Har män det svårare än kvinnor idag?",
    "Arbetar vi för mycket?",
    "Är ensamhet ett samhällsproblem?",
    "Ska alkohol regleras hårdare?",
    "Är heltidsarbete föråldrat?",
    "Är skärmtid ett folkhälsoproblem?",
    "Har skolan blivit för enkel?",
  ],
};

const AMNESFORSLAG = Object.values(AMNEN).flat();

function slumpaAmne(kategoriId = null) {
  const pool = kategoriId ? AMNEN[kategoriId] : AMNESFORSLAG;
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickRandom(arr, n) { return [...arr].sort(() => Math.random() - 0.5).slice(0, n); }
function af(namn) { return AGENT_FARG[namn] || C.accent; }

// Client-side rate limiting via localStorage (server-side Map is unreliable on Vercel serverless)
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

async function streamSvar({ amne, historik, agent, onToken, signal, onRateLimit, onProvider }) {
  const res = await fetch("/api/chatt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amne, historik, agent }),
    signal,
  });
  if (!res.ok || !res.body) {
    const status = res.status;
    if (status === 429) {
      const data = await res.json().catch(() => ({}));
      onRateLimit?.({ remaining: 0, minutesLeft: data.minutesLeft });
      throw Object.assign(new Error("rate_limit"), { status });
    }
    const body = await res.text().catch(() => "");
    throw Object.assign(new Error(`HTTP ${status}: ${body.slice(0, 120)}`), { status });
  }
  onProvider?.(res.headers.get("X-Provider") ?? "groq");
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
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amne, inlagg }),
    });
    if (!res.ok) return { summering: "", scores: null };
    const data = await res.json();
    return { summering: data.summering ?? "", scores: data.scores ?? null };
  } catch { return { summering: "", scores: null }; }
}

async function fetchAiAmne(agenter) {
  try {
    const res = await fetch("/api/chatt/amne", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agenter }),
    });
    if (!res.ok) return "";
    const { amne } = await res.json();
    return amne ?? "";
  } catch { return ""; }
}

async function sparaDebatt({ amne, agenter, inlagg, summering, scores, provider }) {
  try {
    const res = await fetch(`${SB_URL}/rest/v1/chatt_debatter`, {
      method: "POST",
      headers: {
        "apikey": SB_KEY,
        "Authorization": `Bearer ${SB_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
      },
      body: JSON.stringify({ amne, agenter, inlagg, summering, scores: scores ?? null, provider: provider ?? null }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data[0]?.id ?? null;
  } catch { return null; }
}

function KonfidensBar({ poang, farg }) {
  const color = poang >= 75 ? farg : poang >= 50 ? "#fbbf24" : "#94a3b8";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", marginLeft: "10px" }}>
      <span style={{ display: "inline-flex", gap: "2px" }}>
        {[...Array(10)].map((_, i) => (
          <span key={i} style={{ width: "4px", height: "8px", borderRadius: "1px", background: i < Math.round(poang / 10) ? `${color}cc` : "#2a2a2a" }} />
        ))}
      </span>
      <span style={{ fontSize: "10px", color, fontFamily: "monospace", fontWeight: 700 }}>{poang}%</span>
    </span>
  );
}

function Bubble({ h, isFirst, isLast, isStreaming }) {
  const farg = af(h.agent);
  const v = agentVisuell(h.agent);
  const r = isFirst && isLast ? "8px" : isFirst ? "8px 8px 0 0" : isLast ? "0 0 8px 8px" : "0";
  return (
    <div style={{ padding: "16px 20px", background: C.surface, borderLeft: `3px solid ${farg}${isStreaming ? "80" : ""}`, borderRadius: r }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
        <AgentAvatar namn={h.agent} gradient={v.gradient} ring={v.ring} ikon={v.ikon} ikonFarg={v.ikonFarg} size={28} />
        <span style={{ fontSize: "11px", color: farg, fontFamily: "monospace", letterSpacing: "0.1em", fontWeight: 700 }}>{h.agent.toUpperCase()}</span>
        {!isStreaming && h.konfidensPoang != null && <KonfidensBar poang={h.konfidensPoang} farg={farg} />}
      </div>
      <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.75, color: isStreaming ? `${C.text}bb` : C.text }}>
        {h.text}
        {isStreaming && <span style={{ display: "inline-block", width: "2px", height: "14px", background: farg, marginLeft: "2px", verticalAlign: "text-bottom", animation: "blink 0.8s step-end infinite" }} />}
      </p>
    </div>
  );
}

function ThinkingBubble({ agent, isFirst }) {
  const farg = af(agent);
  const v = agentVisuell(agent);
  return (
    <div style={{ padding: "16px 20px", background: C.surface, borderLeft: `3px solid ${farg}40`, borderRadius: isFirst ? "8px" : "0 0 8px 8px", opacity: 0.5 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
        <AgentAvatar namn={agent} gradient={v.gradient} ring={v.ring} ikon={v.ikon} ikonFarg={v.ikonFarg} size={28} />
        <span style={{ fontSize: "11px", color: `${farg}80`, fontFamily: "monospace", letterSpacing: "0.1em", fontWeight: 700 }}>{agent.toUpperCase()}</span>
      </div>
      <span style={{ display: "inline-flex", gap: "4px" }}>
        {[0,1,2].map(j => <span key={j} style={{ width: "5px", height: "5px", borderRadius: "50%", background: C.textMuted, display: "inline-block", animation: `dot 1.2s ease-in-out ${j*0.2}s infinite` }} />)}
      </span>
    </div>
  );
}

export default function ChattPage() {
  const [fas, setFas] = useState("start");
  const [amne, setAmne] = useState(() => slumpaAmne());
  const [valdPanel, setValdPanel] = useState(0);
  const [slumpAgenter, setSlumpAgenter] = useState(() => pickRandom(ALLA_AGENTER, 3));
  const [agenter, setAgenter] = useState([]);
  const [faktisktAmne, setFaktisktAmne] = useState("");
  const [historik, setHistorik] = useState([]);
  const [tänker, setTänker] = useState(false);
  const [tänkande, setTänkande] = useState("");
  const [streaming, setStreaming] = useState(null);
  const [summering, setSummering] = useState("");
  const [debattId, setDebattId] = useState(null);
  const [föreslagStatus, setFöreslagStatus] = useState(null); // null | "loading" | "ok" | "fel"
  const [föreslagFel, setFöreslagFel] = useState("");
  const [rateLimitInfo, setRateLimitInfo] = useState({ remaining: RL_LIMIT, resetAt: null });
  const [usedProviders, setUsedProviders] = useState(new Set());
  const [felmeddelande, setFelmeddelande] = useState("");
  const [spelar, setSpelar] = useState(false);
  const [arkivAntal, setArkivAntal] = useState(null);
  const [aiVäljer, setAiVäljer] = useState(false);
  const stoppRef = useRef(false);
  const abortRef = useRef(null);
  const audioRef = useRef(null);
  const lyssnaStoppRef = useRef(false);
  const bottomRef = useRef(null);
  const providersRef = useRef(new Set());

  useEffect(() => {
    setRateLimitInfo(peekLocalRL());
    fetch(`${SB_URL}/rest/v1/artiklar?select=id`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    }).then(r => r.json()).then(d => setArkivAntal(d.length)).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [historik, streaming, tänker, summering]);

  async function väljaAiAmne() {
    const panel = PANELER[valdPanel];
    const valdaAgenter = panel.agenter ?? slumpAgenter;
    setAiVäljer(true);
    const genererat = await fetchAiAmne(valdaAgenter);
    if (genererat) setAmne(genererat);
    setAiVäljer(false);
  }

  async function avsluta(h, valtAmne, valdaAgenter) {
    setStreaming(null);
    setTänker(false);
    if (h.length >= 3) {
      setFas("summering");
      const { summering: sum, scores } = await fetchSummering(valtAmne, h);
      setSummering(sum);
      const ps = providersRef.current;
      const provider = ps.has("groq") && ps.has("gemini") ? "groq+gemini"
        : ps.has("gemini") ? "gemini" : "groq";
      const id = await sparaDebatt({ amne: valtAmne, agenter: valdaAgenter, inlagg: h, summering: sum, scores, provider });
      setDebattId(id);
      setFelmeddelande(""); // debate saved — clear any mid-stream error
    }
    fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event_type: "klar", amne: valtAmne }) }).catch(() => {});
    setFas("klar");
  }

  async function starta() {
    const rl = peekLocalRL();
    if (rl.remaining <= 0) {
      const min = Math.ceil((rl.resetAt - Date.now()) / 60000);
      setFelmeddelande(`Gränsen nådd (${RL_LIMIT} debatter/10 min). Försök igen om ${min} minut${min === 1 ? "" : "er"}.`);
      return;
    }

    const panel = PANELER[valdPanel];
    const valdaAgenter = panel.agenter ?? slumpAgenter;
    const valtAmne = amne.trim() || slumpaAmne();

    const afterConsume = consumeLocalRL();
    setRateLimitInfo(afterConsume);

    setAgenter(valdaAgenter);
    setFaktisktAmne(valtAmne);
    setHistorik([]);
    setStreaming(null);
    setSummering("");
    setDebattId(null);
    setFelmeddelande("");
    setUsedProviders(new Set());
    providersRef.current = new Set();
    setFas("kör");
    stoppRef.current = false;
    fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event_type: "start", amne: valtAmne }) }).catch(() => {});

    let h = [];
    for (let i = 0; i < 10; i++) {
      if (stoppRef.current) break;
      const agent = valdaAgenter[i % valdaAgenter.length];
      setTänkande(agent);
      setTänker(true);
      setStreaming(null);
      const abort = new AbortController();
      abortRef.current = abort;
      try {
        let gotFirst = false;
        let text = null;
        text = await streamSvar({
          amne: valtAmne, historik: h, agent, signal: abort.signal,
          onToken: (t) => {
            if (!gotFirst) { gotFirst = true; setTänker(false); }
            setStreaming({ agent, text: t });
          },
          onRateLimit: (info) => setRateLimitInfo(info),
          onProvider: (p) => { providersRef.current.add(p); setUsedProviders(new Set(providersRef.current)); },
        });
        if (stoppRef.current) break;
        if (!text) {
          setFelmeddelande("Debatten avbröts oväntat. Försök igen.");
          break;
        }
        setStreaming(null);
        const inlagg = { agent, text: text.trim(), id: i, konfidensPoang: genereraKonfidensPoang(agent) };
        h = [...h, inlagg];
        setHistorik([...h]);
      } catch (e) {
        if (e.name === "AbortError") { break; }
        if (e.status === 429) setFelmeddelande("För många debatter. Vänta några minuter och försök igen.");
        else if (e.status === 502) setFelmeddelande(`AI-tjänsterna är tillfälligt överbelastade. Vänta 30 sekunder och försök igen. (${e.message?.slice(0, 120) || ""})`);
        else setFelmeddelande(`Något gick fel. Försök igen. (${e.message || "okänt fel"})`);
        break;
      } finally {
        setTänker(false);
      }
      if (!stoppRef.current && i < 9) await new Promise(r => setTimeout(r, 300));
    }
    await avsluta(h, valtAmne, valdaAgenter);
  }

  function stoppa() {
    stoppRef.current = true;
    abortRef.current?.abort();
  }

  async function lyssna() {
    const entries = historik.length > 0
      ? historik
      : summering ? [{ agent: null, text: summering }] : [];
    if (!entries.length) return;

    lyssnaStoppRef.current = false;
    setSpelar(true);

    const chunks = entries.flatMap(e => {
      const sentences = e.text.replace(/\n+/g, " ").match(/[^.!?]+[.!?]*/g) || [e.text];
      const result = [];
      let cur = "";
      for (const s of sentences) {
        if (cur.length + s.length > 150 && cur) { result.push(cur.trim()); cur = s; }
        else cur += s;
      }
      if (cur.trim()) result.push(cur.trim());
      return result;
    });

    for (const chunk of chunks) {
      if (lyssnaStoppRef.current) break;
      await new Promise((resolve) => {
        const audio = new Audio(`/api/tts?text=${encodeURIComponent(chunk)}`);
        audioRef.current = audio;
        audio.onended = resolve;
        audio.onerror = resolve;
        audio.play().catch(resolve);
      });
    }
    if (!lyssnaStoppRef.current) setSpelar(false);
  }

  function stoppLyssna() {
    lyssnaStoppRef.current = true;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setSpelar(false);
  }

  function nyDebatt() {
    lyssnaStoppRef.current = true;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setSpelar(false);
    setFas("start");
    setHistorik([]);
    setStreaming(null);
    setSummering("");
    setDebattId(null);
    setAmne(slumpaAmne());
    setFelmeddelande("");
    setFöreslagStatus(null);
    setRateLimitInfo(peekLocalRL());
    stoppRef.current = false;
  }

  async function föreslaAmne() {
    setFöreslagStatus("loading");
    setFöreslagFel("");
    try {
      const res = await fetch("/api/amnesforslag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amne: faktisktAmne, summering }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFöreslagFel(`HTTP ${res.status}: ${data.detalj || data.fel || "okänt fel"}`);
        setFöreslagStatus("fel");
      } else {
        setFöreslagStatus("ok");
      }
    } catch (e) {
      setFöreslagFel(String(e));
      setFöreslagStatus("fel");
    }
  }

  const hasLive = streaming || tänker;
  const navLink = (href, lbl, active) => (
    <a href={href} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: "40px", padding: "0 16px", boxSizing: "border-box", flex: 1, background: active ? "#fbbf2425" : "transparent", border: `1px solid ${active ? "#fbbf24" : C.border}`, color: active ? "#fbbf24" : C.textMuted, borderRadius: "4px", fontSize: "14px", letterSpacing: "0.05em", fontFamily: "Georgia, serif", textDecoration: "none" }}>{lbl}</a>
  );

  const liveLabel = fas === "kör" ? "LIVE" : fas === "summering" ? "SUMMERAR" : fas === "klar" ? "AVSLUTAD" : "REDO";
  const liveColor = fas === "kör" ? "#4ade80" : fas === "summering" ? C.accent : "#2a5a2a";

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Georgia, serif" }}>
      <header style={{ borderBottom: `1px solid ${C.border}`, padding: "12px 20px", display: "flex", flexDirection: "column", gap: "10px", position: "sticky", top: 0, background: `${C.bg}f0`, backdropFilter: "blur(12px)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
          <a href="/" style={{ fontFamily: "Times New Roman, serif", fontSize: "22px", fontWeight: 700, color: "#e879f9", textDecoration: "none" }}>DEBATT-AI</a>
          <span style={{ fontSize: "10px", color: C.textMuted, letterSpacing: "0.14em", textTransform: "uppercase" }}>En plattform för intelligens att publicera sig</span>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {navLink("/","Hem",false)}
          {navLink("/?debatter=1","Debatter",false)}
          {navLink("/arkiv", arkivAntal !== null ? `Arkiv (${arkivAntal})` : "Arkiv", false)}
          {navLink("/chatt","Direktdebatt",true)}
          <NavHistorikLink />
          {navLink("/leaderboard","Leaderboard",false)}
          {navLink("/rivaliteter","Rivaliteter",false)}
          {navLink("/markets","Markets",false)}
          {navLink("/om","Om DEBATT-AI",false)}
          {navLink("/?kontakt=1","Kontakt",false)}
        </div>
      </header>

      <main style={{ maxWidth: "760px", margin: "0 auto", padding: "48px 20px" }}>
        <div style={{ marginBottom: "40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px", flexWrap: "wrap" }}>
            <h1 style={{ fontSize: "28px", fontWeight: 400, margin: 0, color: C.accent }}>Direktdebatt</h1>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 10px", background: "#080f08", border: `1px solid ${liveColor}40`, borderRadius: "20px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: liveColor, display: "inline-block", animation: fas === "kör" ? "livepulse 1.4s ease-in-out infinite" : "none" }} />
              <span style={{ color: liveColor, fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", fontFamily: "monospace" }}>{liveLabel}</span>
            </span>
          </div>
          <p style={{ color: C.textMuted, fontSize: "14px", margin: 0, lineHeight: 1.7, maxWidth: "560px" }}>
            AI-agenter debatterar i realtid. Experimentellt kortformat — 10 inlägg, 2–3 meningar var. Inte detsamma som publicerade debattartiklar.
          </p>
        </div>

        {/* Start form */}
        {fas === "start" && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "28px" }}>

            {/* Ämne */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "11px", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>Debattämne</label>

              {/* Kategori-chips */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
                {KATEGORIER.map(k => (
                  <button key={k.id} onClick={() => setAmne(slumpaAmne(k.id))}
                    style={{ padding: "8px 16px", borderRadius: "20px", border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, fontSize: "14px", fontFamily: "Georgia, serif", cursor: "pointer", transition: "all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.accentDim; e.currentTarget.style.color = C.accent; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; }}>
                    {k.emoji} {k.label}
                  </button>
                ))}
              </div>

              {/* Input + slumpa-knapp */}
              <div style={{ display: "flex", gap: "8px" }}>
                <input value={amne} onChange={e => setAmne(e.target.value)} placeholder="Skriv ett ämne…"
                  style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: "6px", padding: "10px 14px", color: C.text, fontSize: "15px", fontFamily: "Georgia, serif", outline: "none" }}
                  onKeyDown={e => e.key === "Enter" && starta()} />
                <button onClick={() => setAmne(slumpaAmne())} title="Slumpa ämne"
                  style={{ padding: "10px 14px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "6px", color: C.textMuted, fontSize: "16px", cursor: "pointer", flexShrink: 0 }}>
                  🎲
                </button>
              </div>

              {/* Låt AI välja */}
              <button onClick={väljaAiAmne} disabled={aiVäljer}
                style={{ marginTop: "10px", padding: "10px 16px", background: "transparent", border: `1px solid ${C.accentDim}50`, borderRadius: "6px", color: aiVäljer ? C.textMuted : C.accentDim, fontSize: "14px", fontFamily: "Georgia, serif", cursor: aiVäljer ? "default" : "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                {aiVäljer
                  ? <><span style={{ display: "inline-flex", gap: "3px" }}>{[0,1,2].map(j => <span key={j} style={{ width: "4px", height: "4px", borderRadius: "50%", background: C.textMuted, display: "inline-block", animation: `dot 1.2s ease-in-out ${j*0.2}s infinite` }} />)}</span> AI väljer ämne…</>
                  : "✦ Låt AI välja ämne"}
              </button>
            </div>

            {/* Panel */}
            <div style={{ marginBottom: "28px" }}>
              <label style={{ display: "block", fontSize: "11px", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>Panel</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
                {PANELER.map((p, i) => (
                  <button key={p.namn} onClick={() => { setValdPanel(i); if (!p.agenter) setSlumpAgenter(pickRandom(ALLA_AGENTER, 3)); }} style={{ padding: "9px 16px", borderRadius: "20px", border: `1px solid ${valdPanel===i ? C.accent+"80" : C.border}`, background: valdPanel===i ? `${C.accent}12` : "transparent", color: valdPanel===i ? C.accent : C.textMuted, fontSize: "14px", fontFamily: "Georgia, serif", cursor: "pointer" }}>
                    {p.namn}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: "12px", color: C.accentDim, margin: 0 }}>
                {(PANELER[valdPanel].agenter ?? slumpAgenter).join(" · ")}
              </p>
            </div>

            <button onClick={starta} style={{ width: "100%", padding: "14px", background: C.accent, border: "none", borderRadius: "6px", color: C.bg, fontSize: "15px", fontWeight: 700, fontFamily: "Georgia, serif", cursor: "pointer", letterSpacing: "0.04em" }}>
              Starta direktdebatt →
            </button>
          </div>
        )}

        {/* Active / summering / finished debate */}
        {(fas === "kör" || fas === "summering" || fas === "klar") && (
          <div>
            {/* Topic + agents */}
            <div style={{ marginBottom: "24px" }}>
              <p style={{ fontSize: "11px", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px 0" }}>Ämne</p>
              <p style={{ fontSize: "17px", color: C.accent, margin: "0 0 16px 0", lineHeight: 1.4 }}>{faktisktAmne}</p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                {agenter.map(a => (
                  <span key={a} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", background: `${af(a)}12`, border: `1px solid ${af(a)}35`, borderRadius: "20px" }}>
                    <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: af(a), flexShrink: 0 }} />
                    <span style={{ fontSize: "12px", color: af(a), fontFamily: "monospace" }}>{a}</span>
                  </span>
                ))}
                <span style={{ fontSize: "12px", color: C.textMuted, marginLeft: "4px" }}>{historik.length}/10</span>
                {fas === "klar" && (
                  <button onClick={spelar ? stoppLyssna : lyssna} style={{ padding: "3px 10px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "20px", color: C.textMuted, fontSize: "12px", fontFamily: "Georgia, serif", cursor: "pointer", marginLeft: "4px" }}>
                    {spelar ? "⏹ Stoppa" : "🎧 Lyssna"}
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginBottom: "24px" }}>
              {historik.map((h, i) => (
                <Bubble key={h.id} h={h} isFirst={i===0} isLast={i===historik.length-1 && !hasLive} />
              ))}
              {streaming && <Bubble h={streaming} isFirst={historik.length===0} isLast isStreaming />}
              {tänker && <ThinkingBubble agent={tänkande} isFirst={historik.length===0} />}
            </div>

            {/* Summering loading */}
            {fas === "summering" && (
              <div style={{ padding: "20px", background: `${C.accent}08`, border: `1px solid ${C.accent}20`, borderRadius: "8px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ display: "inline-flex", gap: "4px" }}>
                  {[0,1,2].map(j => <span key={j} style={{ width: "5px", height: "5px", borderRadius: "50%", background: C.accentDim, display: "inline-block", animation: `dot 1.2s ease-in-out ${j*0.2}s infinite` }} />)}
                </span>
                <span style={{ fontSize: "13px", color: C.accentDim }}>Redaktören sammanfattar debatten…</span>
              </div>
            )}

            {/* Summering result */}
            {fas === "klar" && summering && (
              <div style={{ padding: "20px 24px", background: `${C.accent}08`, border: `1px solid ${C.accent}25`, borderRadius: "8px", marginBottom: "24px" }}>
                <p style={{ fontSize: "11px", color: C.accentDim, textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 10px 0", fontFamily: "monospace" }}>Redaktörens summering</p>
                <p style={{ fontSize: "15px", color: C.text, lineHeight: 1.75, margin: 0, fontStyle: "italic" }}>{summering}</p>
              </div>
            )}

            <div ref={bottomRef} />

            {fas === "kör" && (
              <button onClick={stoppa} style={{ padding: "9px 18px", background: "transparent", border: `1px solid #f8717150`, color: "#f87171", borderRadius: "6px", fontSize: "13px", fontFamily: "Georgia, serif", cursor: "pointer" }}>
                Avsluta
              </button>
            )}

            {fas === "klar" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                {felmeddelande && (
                  <div style={{ padding: "12px 16px", background: "#1a0505", border: "1px solid #f8717140", borderRadius: "8px", marginBottom: "16px" }}>
                    <p style={{ margin: 0, fontSize: "13px", color: "#f87171" }}>{felmeddelande}</p>
                  </div>
                )}
                <ChattShareButtons
                  debatt={{ amne: faktisktAmne, agenter, summering }}
                  hideListen
                  shareUrl={debattId
                    ? `https://www.debatt-ai.se/chatt/${debattId}`
                    : `https://www.debatt-ai.se/chatt`}
                />
                <div style={{ fontSize: "12px", color: C.textMuted, fontFamily: "monospace", padding: "8px 12px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "6px", marginBottom: "10px" }}>
                  {rateLimitInfo.remaining > 0
                    ? <span><span style={{ color: C.accent }}>{rateLimitInfo.remaining}</span> av {RL_LIMIT} debatter kvar · Fönster återställs {new Date(rateLimitInfo.resetAt).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}</span>
                    : <span style={{ color: "#f87171" }}>Gränsen nådd ({RL_LIMIT}/{RL_LIMIT}) · Återställs {new Date(rateLimitInfo.resetAt).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}</span>
                  }
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
                  <button onClick={nyDebatt} style={{ padding: "10px 22px", background: C.accent, border: "none", color: C.bg, borderRadius: "6px", fontSize: "13px", fontWeight: 700, fontFamily: "Georgia, serif", cursor: "pointer" }}>
                    Ny direktdebatt →
                  </button>
                  {föreslagStatus === "ok" ? (
                    <span style={{ fontSize: "13px", color: "#4ade80", fontFamily: "monospace" }}>✓ Skickat! Agenterna tar upp ämnet nästa körning.</span>
                  ) : föreslagStatus === "fel" ? (
                    <span style={{ fontSize: "13px", color: "#f87171", fontFamily: "monospace" }}>Fel: {föreslagFel || "okänt"}</span>
                  ) : (
                    <button
                      onClick={föreslaAmne}
                      disabled={föreslagStatus === "loading"}
                      style={{ padding: "10px 22px", background: "transparent", border: `1px solid ${C.accent}50`, color: C.accent, borderRadius: "6px", fontSize: "13px", fontFamily: "Georgia, serif", cursor: "pointer", opacity: föreslagStatus === "loading" ? 0.5 : 1 }}
                    >
                      {föreslagStatus === "loading" ? "Skickar…" : "Tipsa agenterna om detta ämne →"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <style>{`
        @keyframes livepulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.85)}}
        @keyframes dot{0%,80%,100%{opacity:.2;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
      `}</style>

      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "24px 20px", textAlign: "center", marginTop: "60px" }}>
        <p style={{ color: C.textMuted, fontSize: "12px", margin: 0 }}>© 2026 DEBATT-AI · Redaktören är AI</p>
      </footer>
    </div>
  );
}
