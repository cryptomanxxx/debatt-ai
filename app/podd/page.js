"use client";
import { useState, useRef, useEffect, useCallback } from "react";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const C = {
  bg: "#080808", surface: "#0f0f0f", border: "#1a1a1a",
  text: "#e8e0d0", textMuted: "#555", accent: "#c8b89a",
};

// Avatar filename mapping
function avatarSrc(namn) {
  const slug = namn
    .toLowerCase()
    .replace(/ä/g, "a").replace(/å/g, "a").replace(/ö/g, "o")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return `/avatarer/${slug}.png`;
}

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

const PANELER = [
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
  if (!res.ok) {
    const status = res.status;
    throw Object.assign(new Error(`HTTP ${status}`), { status });
  }
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

// Agent avatar card component
function AgentCard({ namn, speaking, done, amplitude = 0 }) {
  const farg = AGENT_FARG[namn] || C.accent;
  const src = avatarSrc(namn);
  const scale = speaking ? 1 + amplitude * 0.05 : 1;
  const glow = speaking ? 12 + amplitude * 28 : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
      <div style={{
        position: "relative", width: "120px", height: "120px", flexShrink: 0,
        borderRadius: "50%", overflow: "hidden",
        border: `3px solid ${speaking ? farg : done ? farg + "40" : "#1a1a1a"}`,
        boxShadow: speaking ? `0 0 ${glow}px ${farg}70, 0 0 ${glow * 2}px ${farg}25` : "none",
        transform: `scale(${scale})`,
        transition: "transform 0.06s ease-out, border-color 0.3s ease",
      }}>
        <img src={src} alt={namn} style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={e => { e.target.style.display = "none"; }} />
        {speaking && (
          <div style={{ position: "absolute", bottom: "6px", right: "6px", width: "20px", height: "20px", borderRadius: "50%", background: farg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}>
            🎙
          </div>
        )}
      </div>
      <span style={{ fontSize: "13px", color: speaking ? farg : C.textMuted, textAlign: "center", fontWeight: speaking ? 600 : 400, transition: "color 0.3s ease", lineHeight: 1.3 }}>
        {namn}
      </span>
    </div>
  );
}

export default function PoddPage() {
  const [fas, setFas] = useState("start");
  const [amne, setAmne] = useState(() => slumpaAmne());
  const [valdPanel, setValdPanel] = useState(0);
  const [slumpAgenter, setSlumpAgenter] = useState(() => pickRandom(ALLA_AGENTER, 3));
  const [agenter, setAgenter] = useState([]);
  const [faktisktAmne, setFaktisktAmne] = useState("");
  const [historik, setHistorik] = useState([]);
  const [streaming, setStreaming] = useState(null);
  const [tänkande, setTänkande] = useState("");
  const [summering, setSummering] = useState("");
  const [speakerAgent, setSpeakerAgent] = useState(null);
  const [amplitude, setAmplitude] = useState(0);
  const [rateLimitInfo, setRateLimitInfo] = useState({ remaining: RL_LIMIT, resetAt: null });
  const [fel, setFel] = useState("");
  const [debattId, setDebattId] = useState(null);
  const stoppRef = useRef(false);
  const abortRef = useRef(null);
  const audioRef = useRef(null);
  const autoplayRef = useRef(true);
  const transcriptRef = useRef(null);
  const amplitudeRef = useRef(0);

  useEffect(() => {
    setRateLimitInfo(peekLocalRL());
    return () => { autoplayRef.current = false; };
  }, []);

  useEffect(() => {
    transcriptRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [historik, streaming]);

  async function spelaUppText(text, agent) {
    if (!autoplayRef.current) return;
    setSpeakerAgent(agent);
    const sentences = text.replace(/\n+/g, " ").match(/[^.!?]+[.!?]*/g) || [text];
    const chunks = [];
    let cur = "";
    for (const s of sentences) {
      if (cur.length + s.length > 150 && cur) { chunks.push(cur.trim()); cur = s; }
      else cur += s;
    }
    if (cur.trim()) chunks.push(cur.trim());
    for (const chunk of chunks) {
      if (!autoplayRef.current || stoppRef.current) break;
      await new Promise((resolve) => {
        const audio = new Audio(`/api/tts?text=${encodeURIComponent(chunk)}`);
        audioRef.current = audio;
        let animFrame = null;
        let ctx = null;

        function cleanup() {
          if (animFrame) cancelAnimationFrame(animFrame);
          amplitudeRef.current = 0;
          setAmplitude(0);
          ctx?.close().catch(() => {});
        }

        audio.addEventListener("canplay", () => {
          try {
            ctx = new AudioContext();
            ctx.resume().catch(() => {});
            const source = ctx.createMediaElementSource(audio);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.6;
            source.connect(analyser);
            analyser.connect(ctx.destination);
            const data = new Uint8Array(analyser.frequencyBinCount);
            function tick() {
              analyser.getByteFrequencyData(data);
              // Average of low-mid frequencies (speech range)
              const avg = data.slice(2, 20).reduce((a, b) => a + b, 0) / 18;
              const amp = Math.min(1, avg / 90);
              amplitudeRef.current = amp;
              setAmplitude(amp);
              animFrame = requestAnimationFrame(tick);
            }
            tick();
          } catch { /* AudioContext unavailable — animate without */ }
        }, { once: true });

        audio.onended = () => { cleanup(); resolve(); };
        audio.onerror = () => { cleanup(); resolve(); };
        audio.play().catch(() => { cleanup(); resolve(); });
      });
    }
    if (autoplayRef.current) { setSpeakerAgent(null); setAmplitude(0); }
  }

  async function avsluta(h, valtAmne, valdaAgenter) {
    setStreaming(null);
    setTänkande("");
    setSpeakerAgent(null);
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
      setFel(`Gränsen nådd (${RL_LIMIT} debatter/10 min). Försök igen om ${min} minut${min === 1 ? "" : "er"}.`);
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
    setFel("");
    setSpeakerAgent(null);
    autoplayRef.current = true;
    setFas("kör");
    stoppRef.current = false;

    let h = [];
    for (let i = 0; i < 10; i++) {
      if (stoppRef.current) break;
      const agent = valdaAgenter[i % valdaAgenter.length];
      setTänkande(agent);
      setStreaming(null);
      const abort = new AbortController();
      abortRef.current = abort;
      try {
        let gotFirst = false;
        const text = await streamSvar({
          amne: valtAmne, historik: h, agent, signal: abort.signal,
          onToken: (t) => {
            if (!gotFirst) { gotFirst = true; setTänkande(""); }
            setStreaming({ agent, text: t });
          },
        });
        if (stoppRef.current) break;
        if (!text) { setFel("Debatten avbröts oväntat."); break; }
        setStreaming(null);
        const inlagg = { agent, text: text.trim(), id: i };
        h = [...h, inlagg];
        setHistorik([...h]);
        // Auto-play TTS för detta inlägg
        await spelaUppText(text.trim(), agent);
      } catch (e) {
        if (e.name === "AbortError") break;
        setFel("Något gick fel. Försök igen.");
        break;
      } finally {
        setTänkande("");
      }
      if (!stoppRef.current && i < 9) await new Promise(r => setTimeout(r, 200));
    }
    await avsluta(h, valtAmne, valdaAgenter);
  }

  function stoppa() {
    stoppRef.current = true;
    autoplayRef.current = false;
    audioRef.current?.pause();
    abortRef.current?.abort();
    setSpeakerAgent(null);
  }

  function nyDebatt() {
    stoppa();
    autoplayRef.current = true;
    setFas("start");
    setHistorik([]);
    setSummering("");
    setDebattId(null);
    setFel("");
    setAmne(slumpaAmne());
    setSlumpAgenter(pickRandom(ALLA_AGENTER, 3));
  }

  const valdaAgenter = PANELER[valdPanel].agenter ?? slumpAgenter;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "Georgia, serif" }}>
      <style>{`
        @keyframes dot { 0%,80%,100% { opacity:0.2; } 40% { opacity:1; } }
      `}</style>

      <header style={{ borderBottom: `1px solid ${C.border}`, padding: "0 20px", background: `${C.bg}f0`, backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", maxWidth: "900px", margin: "0 auto", flexWrap: "wrap" }}>
          <a href="/" style={{ fontFamily: "Times New Roman, serif", fontSize: "20px", fontWeight: 700, color: "#e879f9", padding: "10px 16px 10px 0", textDecoration: "none" }}>DEBATT-AI</a>
          <a href="/" className="neon-nav">Hem</a>
          <a href="/arkiv" className="neon-nav">Arkiv</a>
          <a href="/chatt" className="neon-nav">Direktdebatt</a>
          <a href="/podd" className="neon-nav" style={{ color: C.accent }}>Videopodden</a>
        </div>
      </header>

      <main style={{ maxWidth: "760px", margin: "0 auto", padding: "40px 20px" }}>

        {/* Hero */}
        <div style={{ marginBottom: "36px" }}>
          <p style={{ fontSize: "11px", color: "#888", letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 10px 0" }}>
            🎙 AI VIDEOPODDEN
          </p>
          <h1 style={{ fontSize: "30px", fontWeight: 400, margin: "0 0 10px 0", lineHeight: 1.25 }}>
            Live-debatt med AI-agenter
          </h1>
          <p style={{ color: C.textMuted, fontSize: "15px", lineHeight: 1.7, margin: 0 }}>
            Välj panel och ämne — agenterna debatterar live med automatisk uppläsning.
          </p>
        </div>

        {/* ── START ── */}
        {fas === "start" && (
          <div>
            {/* Panel selection */}
            <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>Panel</p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
              {PANELER.map((p, i) => (
                <button key={i} onClick={() => { setValdPanel(i); if (!p.agenter) setSlumpAgenter(pickRandom(ALLA_AGENTER, 3)); }}
                  style={{ background: valdPanel === i ? `${C.accent}18` : "transparent", border: `1px solid ${valdPanel === i ? C.accent + "60" : C.border}`, color: valdPanel === i ? C.accent : C.textMuted, borderRadius: "4px", padding: "7px 14px", fontSize: "13px", cursor: "pointer", fontFamily: "Georgia, serif" }}>
                  {p.namn}
                </button>
              ))}
            </div>

            {/* Preview avatars */}
            <div style={{ display: "flex", gap: "20px", justifyContent: "center", marginBottom: "28px" }}>
              {valdaAgenter.map(a => (
                <AgentCard key={a} namn={a} speaking={false} done={false} amplitude={0} />
              ))}
            </div>

            {/* Topic */}
            <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>Ämne</p>
            <div style={{ position: "relative", marginBottom: "20px" }}>
              <input
                value={amne} onChange={e => setAmne(e.target.value)}
                style={{ background: "#0d0d0d", border: `1px solid ${C.border}`, borderRadius: "4px", color: C.text, fontFamily: "Georgia, serif", fontSize: "16px", padding: "12px 48px 12px 16px", width: "100%", boxSizing: "border-box", outline: "none" }}
              />
              <button onClick={() => setAmne(slumpaAmne())} title="Slumpa ämne"
                style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.textMuted, fontSize: "18px", cursor: "pointer", padding: "4px 6px", lineHeight: 1 }}>
                ↺
              </button>
            </div>

            {rateLimitInfo.remaining <= 0 && (
              <p style={{ color: "#f87171", fontSize: "13px", margin: "0 0 16px 0" }}>
                Gränsen nådd. Försök igen om {Math.ceil(((rateLimitInfo.resetAt || Date.now() + 600000) - Date.now()) / 60000)} min.
              </p>
            )}
            {fel && <p style={{ color: "#f87171", fontSize: "14px", margin: "0 0 16px 0" }}>{fel}</p>}

            <button onClick={starta} disabled={rateLimitInfo.remaining <= 0}
              style={{ background: "#c8b89a", color: "#080808", border: "none", borderRadius: "4px", padding: "14px 32px", fontSize: "15px", fontWeight: 700, letterSpacing: "0.08em", cursor: rateLimitInfo.remaining > 0 ? "pointer" : "not-allowed", fontFamily: "Georgia, serif" }}>
              ▶ Starta podden
            </button>
            <p style={{ color: C.textMuted, fontSize: "12px", marginTop: "10px" }}>
              Ljudet spelas automatiskt · {rateLimitInfo.remaining}/{RL_LIMIT} debatter kvar
            </p>
          </div>
        )}

        {/* ── KÖR ── */}
        {(fas === "kör" || fas === "summering") && agenter.length > 0 && (
          <div>
            {/* Agent avatars — live stage */}
            <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginBottom: "28px", padding: "28px 20px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px" }}>
              {agenter.map(a => (
                <AgentCard key={a} namn={a} speaking={speakerAgent === a} done={false} amplitude={speakerAgent === a ? amplitude : 0} />
              ))}
            </div>

            {/* Topic */}
            <p style={{ fontSize: "13px", color: C.textMuted, textAlign: "center", marginBottom: "20px", fontStyle: "italic" }}>
              {faktisktAmne}
            </p>

            {/* Current streaming / thinking */}
            {tänkande && !streaming && (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", marginBottom: "16px" }}>
                <span style={{ fontSize: "13px", color: C.textMuted }}>{tänkande} tänker</span>
                <span style={{ display: "inline-flex", gap: "4px" }}>
                  {[0,1,2].map(j => <span key={j} style={{ width: "5px", height: "5px", borderRadius: "50%", background: C.textMuted, display: "inline-block", animation: `dot 1.2s ease-in-out ${j*0.2}s infinite` }} />)}
                </span>
              </div>
            )}
            {streaming && (
              <div style={{ padding: "16px 18px", background: C.surface, border: `1px solid ${(AGENT_FARG[streaming.agent] || C.accent) + "30"}`, borderRadius: "8px", marginBottom: "16px" }}>
                <p style={{ fontSize: "12px", color: AGENT_FARG[streaming.agent] || C.accent, margin: "0 0 8px 0", letterSpacing: "0.06em", textTransform: "uppercase" }}>{streaming.agent}</p>
                <p style={{ color: C.text, fontSize: "15px", lineHeight: 1.75, margin: 0 }}>{streaming.text}<span style={{ display: "inline-block", width: "2px", height: "1em", background: C.accent, marginLeft: "2px", verticalAlign: "text-bottom", animation: "dot 0.8s step-end infinite" }} /></p>
              </div>
            )}

            {/* Transcript */}
            {historik.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 12px 0" }}>
                  Transkript ({historik.length}/10)
                </p>
                {historik.map((e, i) => (
                  <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "14px", opacity: speakerAgent && speakerAgent !== e.agent ? 0.5 : 1, transition: "opacity 0.3s" }}>
                    <div style={{ width: "3px", borderRadius: "2px", background: AGENT_FARG[e.agent] || C.accent, flexShrink: 0, alignSelf: "stretch" }} />
                    <div>
                      <p style={{ fontSize: "11px", color: AGENT_FARG[e.agent] || C.accent, margin: "0 0 4px 0", letterSpacing: "0.06em" }}>{e.agent}</p>
                      <p style={{ color: C.textMuted, fontSize: "14px", lineHeight: 1.7, margin: 0 }}>{e.text}</p>
                    </div>
                  </div>
                ))}
                <div ref={transcriptRef} />
              </div>
            )}

            <button onClick={stoppa} style={{ background: "none", border: `1px solid #f8717140`, color: "#f87171", borderRadius: "4px", padding: "10px 22px", fontSize: "13px", cursor: "pointer", fontFamily: "Georgia, serif" }}>
              ⏹ Stoppa
            </button>
          </div>
        )}

        {/* ── KLAR ── */}
        {fas === "klar" && (
          <div>
            {/* Done stage — avatars */}
            <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginBottom: "20px", padding: "24px 20px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px" }}>
              {agenter.map(a => (
                <AgentCard key={a} namn={a} speaking={false} done={true} amplitude={0} />
              ))}
            </div>

            <p style={{ fontSize: "13px", color: C.textMuted, textAlign: "center", marginBottom: "20px", fontStyle: "italic" }}>{faktisktAmne}</p>

            {summering && (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "20px", marginBottom: "20px" }}>
                <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px 0" }}>AI-summering</p>
                <p style={{ color: C.text, fontSize: "15px", lineHeight: 1.75, margin: 0, fontStyle: "italic" }}>{summering}</p>
              </div>
            )}

            {/* Transcript */}
            <div style={{ marginBottom: "24px" }}>
              <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 12px 0" }}>Transkript</p>
              {historik.map((e, i) => (
                <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "14px" }}>
                  <div style={{ width: "3px", borderRadius: "2px", background: AGENT_FARG[e.agent] || C.accent, flexShrink: 0, alignSelf: "stretch" }} />
                  <div>
                    <p style={{ fontSize: "11px", color: AGENT_FARG[e.agent] || C.accent, margin: "0 0 4px 0", letterSpacing: "0.06em" }}>{e.agent}</p>
                    <p style={{ color: C.textMuted, fontSize: "14px", lineHeight: 1.7, margin: 0 }}>{e.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button onClick={nyDebatt} style={{ background: C.accent, color: C.bg, border: "none", borderRadius: "4px", padding: "12px 24px", fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: "Georgia, serif" }}>
                ▶ Ny debatt
              </button>
              {debattId && (
                <a href={`/chatt/${debattId}`} style={{ display: "inline-flex", alignItems: "center", background: "none", border: `1px solid ${C.border}`, color: C.textMuted, borderRadius: "4px", padding: "12px 24px", fontSize: "14px", textDecoration: "none" }}>
                  Dela debatten →
                </a>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
