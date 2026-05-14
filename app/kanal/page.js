"use client";
import { useState, useRef, useEffect } from "react";
import NewsTicker from "../NewsTicker";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const C = {
  bg: "#080808", surface: "#0f0f0f", border: "#1a1a1a",
  text: "#e8e0d0", textMuted: "#555", accent: "#6abf6a",
};

const ANCHOR      = "Anna";
const ANCHOR_FARG = "#a0c8f0";

const AGENT_FARG = {
  "Anna":                 "#a0c8f0",
  "Nationalekonom":       "#6abf6a","Miljöaktivist":"#4ade80","Teknikoptimist":"#38bdf8",
  "Konservativ debattör": "#b8862a","Jurist":"#d4945a","Journalist":"#f8fafc",
  "Filosof":              "#e879f9","Läkare":"#f87171","Psykolog":"#c084fc",
  "Historiker":           "#c8a060","Sociolog":"#60a0d8","Kryptoanalytiker":"#f59e0b",
  "Den hungriga":         "#86efac","Mamman":"#f9a8d4","Den sura":"#94a3b8",
  "Den trötta":           "#7dd3fc","Den stressade":"#fca5a5","Den lugna":"#a7f3d0",
  "Pensionären":          "#d8b4fe","Tonåringen":"#fdba74","Den nostalgiske":"#fde68a",
  "Hypokondrikern":       "#6ee7b7","Optimisten":"#fcd34d","Den rike":"#c4b5fd",
};

const AGENT_ROST = {
  "Anna":                 { voice: "Swedish Female", rate: 1.0,  pitch: 1.0  },
  "Nationalekonom":       { voice: "Swedish Male",   rate: 1.0,  pitch: 1.0  },
  "Teknikoptimist":       { voice: "Swedish Male",   rate: 1.0,  pitch: 1.0  },
  "Konservativ debattör": { voice: "Swedish Male",   rate: 1.0,  pitch: 1.0  },
  "Jurist":               { voice: "Swedish Male",   rate: 1.0,  pitch: 1.0  },
  "Filosof":              { voice: "Swedish Male",   rate: 1.0,  pitch: 1.0  },
  "Historiker":           { voice: "Swedish Male",   rate: 1.0,  pitch: 1.0  },
  "Sociolog":             { voice: "Swedish Male",   rate: 1.0,  pitch: 1.0  },
  "Kryptoanalytiker":     { voice: "Swedish Male",   rate: 1.0,  pitch: 1.0  },
  "Den hungriga":         { voice: "Swedish Male",   rate: 0.85, pitch: 0.88 },
  "Den sura":             { voice: "Swedish Male",   rate: 0.92, pitch: 0.83 },
  "Den trötta":           { voice: "Swedish Male",   rate: 0.70, pitch: 0.78 },
  "Pensionären":          { voice: "Swedish Male",   rate: 0.78, pitch: 0.82 },
  "Tonåringen":           { voice: "Swedish Male",   rate: 1.25, pitch: 1.15 },
  "Den nostalgiske":      { voice: "Swedish Male",   rate: 0.82, pitch: 0.90 },
  "Hypokondrikern":       { voice: "Swedish Male",   rate: 1.02, pitch: 1.02 },
  "Optimisten":           { voice: "Swedish Male",   rate: 1.12, pitch: 1.08 },
  "Den rike":             { voice: "Swedish Male",   rate: 0.88, pitch: 0.87 },
  "Miljöaktivist":        { voice: "Swedish Female", rate: 1.0,  pitch: 1.0  },
  "Journalist":           { voice: "Swedish Female", rate: 1.0,  pitch: 1.0  },
  "Läkare":               { voice: "Swedish Female", rate: 1.0,  pitch: 1.0  },
  "Psykolog":             { voice: "Swedish Female", rate: 1.0,  pitch: 1.0  },
  "Mamman":               { voice: "Swedish Female", rate: 0.95, pitch: 1.08 },
  "Den stressade":        { voice: "Swedish Female", rate: 1.28, pitch: 1.12 },
  "Den lugna":            { voice: "Swedish Female", rate: 0.75, pitch: 0.97 },
};

function agentSlug(namn) {
  return namn.toLowerCase()
    .replace(/ä/g, "a").replace(/å/g, "a").replace(/ö/g, "o")
    .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Blink-hook ────────────────────────────────────────────────────────────────
function useBlinkState(amplitudeRef) {
  const [blinkState, setBlinkState] = useState("open"); // open | half | closed
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const doBlink = async () => {
      if (cancelled) return;
      setBlinkState("half");
      await sleep(80);            // håll minst transitionstiden (80ms) innan nästa state
      if (cancelled) return;
      setBlinkState("closed");
      await sleep(120);           // 60ms transition + 60ms faktisk stängd
      if (cancelled) return;
      setBlinkState("half");
      await sleep(80);
      if (cancelled) return;
      setBlinkState("open");
    };

    const schedule = () => {
      const delay = 4000 + Math.random() * 3000; // 4–7s naturligt intervall
      timerRef.current = setTimeout(async () => {
        if (cancelled) return;
        await doBlink();
        if (!cancelled && Math.random() < 0.2) { await sleep(150); if (!cancelled) await doBlink(); }
        if (!cancelled) schedule();
      }, delay);
    };

    schedule();
    return () => { cancelled = true; clearTimeout(timerRef.current); };
  }, [amplitudeRef]);

  return blinkState;
}

// ── Komponenter ──────────────────────────────────────────────────────────────

function Waveform({ amplitude, farg = ANCHOR_FARG }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "2px", height: "24px" }}>
      {Array.from({ length: 24 }, (_, i) => {
        const base = 0.2 + 0.35 * Math.abs(Math.sin(i * 0.85));
        const h = amplitude > 0.02 ? 3 + (base + amplitude * 0.65) * 22 : 3;
        return <div key={i} style={{ width: "3px", height: `${Math.min(24, Math.max(3, h))}px`, background: farg, borderRadius: "1.5px", opacity: 0.75, transition: "height 0.08s ease" }} />;
      })}
    </div>
  );
}

const MIN_STATE_HOLD = 160; // ms — längre hold ger lugnare rörelse

function TalkingFace({ amplitude, speaking }) {
  const slug = agentSlug(ANCHOR);
  const base = `/avatarer/podd/${slug}`;
  const amp = speaking ? amplitude : 0;

  // Höga trösklar → munnen är mest i neutral/small, sällan medium, nästan aldrig large
  let rawMouth = 0;
  if (amp > 0.82) rawMouth = 3;
  else if (amp > 0.52) rawMouth = 2;
  else if (amp > 0.18) rawMouth = 1;

  const stateRef = useRef(0);
  const stateTimeRef = useRef(0);
  const now = Date.now();
  if (rawMouth !== stateRef.current && now - stateTimeRef.current >= MIN_STATE_HOLD) {
    stateRef.current = rawMouth;
    stateTimeRef.current = now;
  }
  const mouthState = speaking ? stateRef.current : 0; // 0–3

  // Blink — amplitudeRef håller senaste värdet utan stale closure
  const amplitudeRef = useRef(amp);
  amplitudeRef.current = amp;
  const blinkState = useBlinkState(amplitudeRef); // "open" | "half" | "closed"

  // 12 förkomponerade bilder: 4 munlägen × 3 ögonlägen
  const MOUTH_SUFFIX = ["", "-small", "-medium", "-large"];
  const allStates = [];
  for (let m = 0; m < 4; m++) {
    for (const eyes of ["open", "half", "closed"]) {
      const src = eyes === "open"
        ? `${base}${MOUTH_SUFFIX[m]}.png`
        : `${base}-m${m}-${eyes}.png`;
      allStates.push({ m, eyes, src });
    }
  }

  const imgStyle = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "fill" };
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {allStates.map(({ m, eyes, src }) => (
        <img key={src} src={src} alt="" style={{
          ...imgStyle,
          opacity: m === mouthState && eyes === blinkState ? 1 : 0,
          transition: "opacity 80ms ease-in-out",
        }} onError={e => { e.target.style.display = "none"; }} />
      ))}
    </div>
  );
}

function AnchorPanel({ speaking, amplitude, anchorTitle = "Nyhetsankare" }) {
  const glow = speaking ? 18 + amplitude * 40 : 0;
  return (
    <div style={{ position: "relative", width: "100%", paddingTop: "80%", background: "#000", borderRadius: "4px", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0 }}>
        <TalkingFace amplitude={amplitude} speaking={speaking} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "48px 20px 18px", background: "linear-gradient(transparent, rgba(0,0,0,0.9))" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              {speaking && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#f87171", display: "inline-block" }} />
                  <span style={{ fontSize: "11px", color: "#f87171", fontFamily: "monospace", letterSpacing: "0.1em" }}>LIVE</span>
                </div>
              )}
              <p style={{ fontSize: "20px", fontWeight: 700, color: C.text, margin: 0, fontFamily: "Times New Roman, serif", textShadow: "0 2px 8px #000" }}>{ANCHOR}</p>
              <p style={{ fontSize: "11px", color: ANCHOR_FARG, margin: "2px 0 0 0", letterSpacing: "0.06em" }}>{anchorTitle}</p>
            </div>
            {speaking && <Waveform amplitude={amplitude} />}
          </div>
        </div>
        {speaking && (
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", boxShadow: `inset 0 0 ${glow * 1.5}px ${ANCHOR_FARG}33`, border: `2px solid ${ANCHOR_FARG}55`, transition: "box-shadow 0.08s ease" }} />
        )}
      </div>
    </div>
  );
}

function DebattAgentPanel({ agent, speaking, amplitude, debattor = "Debattör", talar = "TALAR" }) {
  const farg = AGENT_FARG[agent] || C.accent;
  const glow = speaking ? 18 + amplitude * 40 : 0;
  const slug = agentSlug(agent);
  return (
    <div style={{ position: "relative", width: "100%", paddingTop: "75%", background: "#000", borderRadius: "4px", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0 }}>
        <img src={`/avatarer/${slug}.png`} alt={agent} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "48px 20px 18px", background: "linear-gradient(transparent, rgba(0,0,0,0.92))" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              {speaking && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#f87171", display: "inline-block" }} />
                  <span style={{ fontSize: "11px", color: "#f87171", fontFamily: "monospace", letterSpacing: "0.1em" }}>{talar}</span>
                </div>
              )}
              <p style={{ fontSize: "20px", fontWeight: 700, color: C.text, margin: 0, fontFamily: "Times New Roman, serif", textShadow: "0 2px 8px #000" }}>{agent}</p>
              <p style={{ fontSize: "11px", color: farg, margin: "2px 0 0 0", letterSpacing: "0.06em" }}>{debattor}</p>
            </div>
            {speaking && <Waveform amplitude={amplitude} farg={farg} />}
          </div>
        </div>
        {speaking && (
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", boxShadow: `inset 0 0 ${glow * 1.5}px ${farg}33`, border: `2px solid ${farg}55`, transition: "box-shadow 0.08s ease" }} />
        )}
      </div>
    </div>
  );
}

// ── Huvud ─────────────────────────────────────────────────────────────────────

export default function KanalPage() {
  const [nyheter, setNyheter]               = useState([]);
  const [debatt, setDebatt]                 = useState(null);
  const [mode, setMode]                     = useState("nyheter");
  const [currentIdx, setCurrentIdx]         = useState(0);
  const [debattIdx, setDebattIdx]           = useState(0);
  const [currentAgent, setCurrentAgent]     = useState(null);
  const [speaking, setSpeaking]             = useState(false);
  const [amplitude, setAmplitude]           = useState(0);
  const [running, setRunning]               = useState(false);
  const [laddar, setLaddar]                 = useState(true);
  const [lang, setLang]                     = useState("sv");
  const [translatedAmne, setTranslatedAmne] = useState(null);
  const [translatedInlagg, setTranslatedInlagg] = useState(null);
  const [oversatter, setOversatter]         = useState(false);
  const [oversattIdx, setOversattIdx]       = useState(0);

  const runningRef     = useRef(false);
  const ampTimer       = useRef(null);
  const nyheterRef     = useRef([]);
  const debattRef      = useRef(null);
  const langRef        = useRef("sv");
  const translateCache = useRef({});

  const L = lang === "en" ? {
    debattemne: "DEBATE TOPIC", nastaUpp: "UP NEXT", inlagg: "POST",
    debattor: "Debater", talar: "SPEAKING",
    stoppaSandning: "■  STOP BROADCAST", startaSandning: "▶  START BROADCAST",
    sandingNyheter: "BROADCASTING NEWS", debattPagar: "DEBATE IN PROGRESS",
    laddar: "LOADING…", kvallensDebatt: "TONIGHT'S DEBATE",
    iKon: "UPCOMING", lasNu: "NOW READING", nasta: "NEXT", senasteNyhet: "LATEST NEWS",
    statusDebatt: "debate available", statusIngen: "no debate yet",
  } : {
    debattemne: "DEBATTÄMNE", nastaUpp: "NÄSTA UPP", inlagg: "INLÄGG",
    debattor: "Debattör", talar: "TALAR",
    stoppaSandning: "■  STOPPA SÄNDNING", startaSandning: "▶  STARTA SÄNDNING",
    sandingNyheter: "SÄNDER NYHETER", debattPagar: "DEBATT PÅGÅR",
    laddar: "LADDAR…", kvallensDebatt: "KVÄLLENS DEBATT",
    iKon: "I KÖN", lasNu: "LÄSER NU", nasta: "NÄSTA", senasteNyhet: "SENASTE NYHET",
    statusDebatt: "debatt tillgänglig", statusIngen: "ingen debatt ännu",
  };

  async function hamtaData() {
    setLaddar(true);
    const [nyheterData, debattData] = await Promise.all([
      fetch("/api/kanal/nyheter").then(r => r.json()).catch(() => []),
      fetch(`${SB_URL}/rest/v1/chatt_debatter?kalla=eq.kanal&order=skapad.desc&limit=1`, {
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      }).then(r => r.json()).catch(() => []),
    ]);
    if (Array.isArray(nyheterData) && nyheterData.length) {
      setNyheter(nyheterData);
      nyheterRef.current = nyheterData;
    }
    if (Array.isArray(debattData) && debattData.length) {
      setDebatt(debattData[0]);
      debattRef.current = debattData[0];
    }
    setLaddar(false);
  }

  async function translateText(text) {
    if (!text) return text;
    if (translateCache.current[text]) return translateCache.current[text];
    try {
      const res = await fetch("/api/kanal/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const { translated } = await res.json();
      translateCache.current[text] = translated;
      return translated;
    } catch {
      return text;
    }
  }

  async function handleLangChange(l) {
    if (running) return;
    setLang(l);
    langRef.current = l;
    translateCache.current = {};
    setTranslatedAmne(null);
    setTranslatedInlagg(null);
    await hamtaData();
  }

  useEffect(() => {
    hamtaData();
    return () => {
      runningRef.current = false;
      if (ampTimer.current) clearInterval(ampTimer.current);
    };
  }, []);

  async function spelaUppText(text, agent) {
    const svRost = AGENT_ROST[agent ?? ANCHOR] ?? { voice: "Swedish Female", rate: 0.90, pitch: 1.02 };
    const rost = langRef.current === "en"
      ? { ...svRost, voice: svRost.voice.includes("Female") ? "US English Female" : "US English Male" }
      : svRost;
    setCurrentAgent(agent);
    setSpeaking(true);
    await new Promise(resolve => {
      if (!runningRef.current) { resolve(); return; }
      const startAnim = () => {
        ampTimer.current = setInterval(() => {
          if (!runningRef.current) { clearInterval(ampTimer.current); return; }
          const t = Date.now();
          // Dämpad amplitud — munnen rör sig lite, inte mycket
          const syllable = Math.pow(Math.max(0, Math.sin(t * 0.016)), 2.8);
          const env = 0.25 + 0.45 * Math.pow(Math.abs(Math.sin(t * 0.0025)), 0.8);
          const jitter = 0.015 * Math.sin(t * 0.09) + 0.01 * Math.sin(t * 0.041);
          setAmplitude(Math.min(0.75, Math.max(0, syllable * env + jitter)));
        }, 60);
      };
      const stopAnim = () => {
        if (ampTimer.current) clearInterval(ampTimer.current);
        setAmplitude(0);
        resolve();
      };
      const timeout = setTimeout(stopAnim, text.length * 75 + 4000);
      if (window.responsiveVoice) {
        window.responsiveVoice.speak(text, rost.voice, {
          pitch: rost.pitch, rate: rost.rate,
          onstart: startAnim,
          onend:   () => { clearTimeout(timeout); stopAnim(); },
          onerror: () => { clearTimeout(timeout); stopAnim(); },
        });
      } else {
        startAnim();
        setTimeout(stopAnim, Math.max(2000, text.length * 60));
      }
    });
    setSpeaking(false);
    setAmplitude(0);
  }

  async function expanderaItem(item, i) {
    if (item.text && item.text !== item.rubrik) return item.text;
    try {
      const res = await fetch("/api/kanal/expand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rubrik: item.rubrik, kalla: item.kalla, lang: langRef.current }),
      });
      const { text } = await res.json();
      if (text && text !== item.rubrik) {
        // Extract the first sentence as the English headline
        const rubrikEn = langRef.current === "en"
          ? (text.split(/(?<=[.!?])\s+/)[0] || text).slice(0, 120)
          : undefined;
        // Update state so the panel shows the expanded text
        nyheterRef.current = nyheterRef.current.map((n, j) =>
          j === i ? { ...n, text, ...(rubrikEn ? { rubrikEn } : {}) } : n
        );
        setNyheter([...nyheterRef.current]);
        return text;
      }
    } catch {}
    return item.rubrik;
  }

  async function spelaUppNyheter() {
    const lista = nyheterRef.current;
    setMode("nyheter");

    if (langRef.current === "en") {
      // Pre-expand ALL items with pacing before starting broadcast.
      // Without this, failed expansions cause items to play in ~3s (just the short
      // Swedish rubrik), which triggers the next expansion immediately — a cascade
      // that rate-limits all providers within seconds.
      setOversatter(true);
      setOversattIdx(0);
      for (let i = 0; i < lista.length; i++) {
        if (!runningRef.current) { setOversatter(false); return; }
        setOversattIdx(i + 1);
        await expanderaItem(nyheterRef.current[i], i);
        if (i < lista.length - 1) await sleep(1500);
      }
      setOversatter(false);
    } else {
      // Swedish: only pre-expand first item, rest are fetched during playback
      await expanderaItem(lista[0], 0);
    }

    for (let i = 0; i < lista.length; i++) {
      if (!runningRef.current) return;
      setCurrentIdx(i);

      // Swedish mode: pre-fetch next item during current item's playback
      const nextPrefetch = langRef.current !== "en" && i + 1 < lista.length
        ? expanderaItem(nyheterRef.current[i + 1], i + 1)
        : Promise.resolve();

      const item = nyheterRef.current[i];
      const text = (item.text && item.text !== item.rubrik) ? item.text : item.rubrik;
      await spelaUppText(text, null);

      if (langRef.current !== "en") await nextPrefetch;

      if (!runningRef.current) return;
      await sleep(600);
    }
  }

  async function spelaUppDebatt() {
    const d = debattRef.current;
    if (!d) return;
    const isEn = langRef.current === "en";
    setMode("debatt");

    const amne = isEn ? await translateText(d.amne) : d.amne;

    // Pre-translate all inlägg so the panel shows English text immediately
    let inlaggTexts = null;
    if (isEn) {
      setTranslatedAmne(amne);
      inlaggTexts = await Promise.all(d.inlagg.map(inp => translateText(inp.text)));
      setTranslatedInlagg(inlaggTexts);
    }

    const intro = isEn
      ? `Now moving to tonight's debate: ${amne}`
      : `Nu övergår vi till kvällens debatt: ${amne}`;
    await spelaUppText(intro, null);
    if (!runningRef.current) return;
    await sleep(800);

    for (let i = 0; i < d.inlagg.length; i++) {
      if (!runningRef.current) return;
      setDebattIdx(i);
      const text = isEn ? (inlaggTexts?.[i] || d.inlagg[i].text) : d.inlagg[i].text;
      await spelaUppText(text, d.inlagg[i].agent);
      if (!runningRef.current) return;
      await sleep(700);
    }
    setMode("nyheter");
    setCurrentAgent(null);
  }

  async function startaKanal() {
    if (runningRef.current) return;
    runningRef.current = true;
    setRunning(true);
    while (runningRef.current) {
      await spelaUppNyheter();
      if (!runningRef.current) break;
      if (debattRef.current) await spelaUppDebatt();
    }
    stoppaKanal();
  }

  function stoppaKanal() {
    runningRef.current = false;
    setRunning(false);
    setSpeaking(false);
    setAmplitude(0);
    setCurrentAgent(null);
    setMode("nyheter");
    setTranslatedAmne(null);
    setTranslatedInlagg(null);
    setOversatter(false);
    setOversattIdx(0);
    if (ampTimer.current) clearInterval(ampTimer.current);
    if (window.responsiveVoice) window.responsiveVoice.cancel();
  }

  // ── UI-beräkningar ────────────────────────────────────────────────────────

  const isDebattMode  = mode === "debatt" && running;
  const currentNyhet  = nyheter[currentIdx];
  const currentInlagg = debatt?.inlagg?.[debattIdx];
  const activeAgent   = isDebattMode ? currentAgent : null;
  const activeFarg    = activeAgent ? (AGENT_FARG[activeAgent] || C.accent) : ANCHOR_FARG;

  const upcomingNyheter = running && !isDebattMode
    ? [...Array(Math.min(5, nyheter.length))].map((_, i) => nyheter[(currentIdx + i + 1) % nyheter.length]).filter(Boolean)
    : [];

  const upcomingInlagg = isDebattMode && debatt?.inlagg
    ? debatt.inlagg.slice(debattIdx + 1, debattIdx + 4)
    : [];

  const displayAmne = translatedAmne || debatt?.amne;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, display: "flex", flexDirection: "column" }}>

      {/* Live-indikator */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: "6px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: running ? "#f87171" : C.textMuted, boxShadow: running ? "0 0 8px #f87171" : "none", transition: "all 0.3s" }} />
          {running && (
            <span style={{ fontSize: "11px", color: "#f87171", fontFamily: "monospace", letterSpacing: "0.1em" }}>
              {isDebattMode ? L.debattPagar : L.sandingNyheter}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {isDebattMode && (
            <span style={{ fontSize: "10px", color: activeFarg, fontFamily: "monospace", letterSpacing: "0.08em", border: `1px solid ${activeFarg}44`, padding: "2px 8px", borderRadius: "3px" }}>
              DEBATT
            </span>
          )}
          <span style={{ fontSize: "11px", color: C.textMuted, fontFamily: "monospace", letterSpacing: "0.06em" }}>AI NYHETSKANAL</span>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", maxWidth: "1100px", width: "100%", margin: "0 auto", padding: "32px 24px 24px", gap: "32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", alignItems: "start" }}>

          {/* Left: anchor/agent panel */}
          <div>
            {isDebattMode && activeAgent
              ? <DebattAgentPanel agent={activeAgent} speaking={speaking} amplitude={amplitude} debattor={L.debattor} talar={L.talar} />
              : <AnchorPanel speaking={speaking && !isDebattMode} amplitude={amplitude} anchorTitle={lang === "en" ? "News Anchor" : "Nyhetsankare"} />
            }

            <div style={{ marginTop: "20px" }}>
              {/* Språkväljare */}
              <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
                {[["sv", "🇸🇪 Svenska"], ["en", "🇬🇧 English"]].map(([l, label]) => (
                  <button key={l} onClick={() => handleLangChange(l)} disabled={running}
                    style={{ flex: 1, padding: "8px", background: lang === l ? ANCHOR_FARG : "transparent", color: lang === l ? "#000" : C.textMuted, border: `1px solid ${lang === l ? ANCHOR_FARG : C.border}`, borderRadius: "4px", fontSize: "12px", fontWeight: lang === l ? 700 : 400, cursor: running ? "default" : "pointer", fontFamily: "monospace", letterSpacing: "0.04em", transition: "all 0.15s" }}>
                    {label}
                  </button>
                ))}
              </div>

              {!running ? (
                <button
                  onClick={startaKanal}
                  disabled={laddar || nyheter.length === 0}
                  style={{ width: "100%", padding: "14px", background: laddar ? C.surface : ANCHOR_FARG, color: laddar ? C.textMuted : "#000", border: "none", borderRadius: "4px", fontSize: "13px", fontWeight: 700, cursor: laddar ? "default" : "pointer", letterSpacing: "0.08em", fontFamily: "monospace" }}
                >
                  {laddar ? L.laddar : L.startaSandning}
                </button>
              ) : (
                <button
                  onClick={stoppaKanal}
                  style={{ width: "100%", padding: "14px", background: "#1a1a1a", color: "#f87171", border: "1px solid #f8717133", borderRadius: "4px", fontSize: "13px", fontWeight: 700, cursor: "pointer", letterSpacing: "0.08em", fontFamily: "monospace" }}
                >
                  {L.stoppaSandning}
                </button>
              )}
            </div>

            {!laddar && (
              <p style={{ fontSize: "11px", color: C.textMuted, margin: "12px 0 0 0", textAlign: "center", fontFamily: "monospace" }}>
                {nyheter.length} {lang === "en" ? "news" : "nyheter"} · {debatt ? L.statusDebatt : L.statusIngen}
              </p>
            )}
          </div>

          {/* Right: content panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Nyheter-mode */}
            {!isDebattMode && (
              <>
                <div style={{ padding: "28px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "4px", minHeight: "200px" }}>
                  <div style={{ fontSize: "10px", color: oversatter ? ANCHOR_FARG : C.textMuted, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "16px", fontFamily: "monospace" }}>
                    {oversatter
                      ? (lang === "en" ? `TRANSLATING ${oversattIdx}/${nyheter.length}…` : `ÖVERSÄTTER ${oversattIdx}/${nyheter.length}…`)
                      : running && speaking ? L.lasNu : running ? L.nasta : L.senasteNyhet}
                  </div>
                  {currentNyhet ? (
                    <>
                      <p style={{ fontSize: "20px", fontWeight: 700, lineHeight: 1.35, fontFamily: "Times New Roman, serif", color: C.text, margin: "0 0 14px 0", borderLeft: `3px solid ${ANCHOR_FARG}`, paddingLeft: "16px" }}>
                        {lang === "en" && currentNyhet.rubrikEn ? currentNyhet.rubrikEn : currentNyhet.rubrik}
                      </p>
                      {currentNyhet.text && currentNyhet.text !== currentNyhet.rubrik && (
                        <p style={{ fontSize: "14px", lineHeight: 1.75, color: "#aaa", margin: "0 0 14px 0", paddingLeft: "19px" }}>
                          {currentNyhet.text}
                        </p>
                      )}
                      <p style={{ fontSize: "11px", color: ANCHOR_FARG, margin: 0, fontFamily: "monospace", letterSpacing: "0.06em", paddingLeft: "19px" }}>
                        {currentNyhet.kalla}
                      </p>
                    </>
                  ) : (
                    <p style={{ fontSize: "14px", color: C.textMuted, margin: 0 }}>
                      {laddar
                        ? (lang === "en" ? "Fetching and expanding news…" : "Hämtar och expanderar nyheter…")
                        : (lang === "en" ? "Press START BROADCAST to begin." : "Tryck STARTA SÄNDNING för att börja.")}
                    </p>
                  )}
                </div>

                {upcomingNyheter.length > 0 && (
                  <div style={{ padding: "20px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "4px" }}>
                    <div style={{ fontSize: "10px", color: C.textMuted, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "14px", fontFamily: "monospace" }}>{L.iKon}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {upcomingNyheter.map((n, i) => (
                        <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", opacity: 1 - i * 0.15 }}>
                          <span style={{ fontSize: "10px", color: C.textMuted, fontFamily: "monospace", paddingTop: "2px", flexShrink: 0 }}>{String(i + 1).padStart(2, "0")}</span>
                          <div>
                            <p style={{ fontSize: "13px", color: C.text, margin: "0 0 2px 0", lineHeight: 1.4 }}>{lang === "en" && n.rubrikEn ? n.rubrikEn : n.rubrik}</p>
                            <p style={{ fontSize: "10px", color: C.textMuted, margin: 0, fontFamily: "monospace" }}>{n.kalla}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!running && debatt && (
                  <div style={{ padding: "20px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "4px" }}>
                    <div style={{ fontSize: "10px", color: C.textMuted, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "12px", fontFamily: "monospace" }}>{L.kvallensDebatt}</div>
                    <p style={{ fontSize: "15px", fontFamily: "Times New Roman, serif", color: C.text, margin: "0 0 10px 0", lineHeight: 1.4 }}>{debatt.amne}</p>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {(debatt.agenter || []).map(a => (
                        <span key={a} style={{ fontSize: "11px", color: AGENT_FARG[a] || C.accent, background: `${AGENT_FARG[a] || C.accent}12`, border: `1px solid ${AGENT_FARG[a] || C.accent}30`, borderRadius: "20px", padding: "2px 10px" }}>{a}</span>
                      ))}
                    </div>
                    {debatt.summering && (
                      <p style={{ fontSize: "12px", color: C.textMuted, margin: "12px 0 0 0", lineHeight: 1.65, fontStyle: "italic" }}>{debatt.summering}</p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Debatt-mode */}
            {isDebattMode && currentInlagg && (
              <>
                <div style={{ padding: "16px 20px", background: "#0a0a14", border: `1px solid ${activeFarg}30`, borderRadius: "4px" }}>
                  <div style={{ fontSize: "10px", color: C.textMuted, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "6px", fontFamily: "monospace" }}>{L.debattemne}</div>
                  <p style={{ fontSize: "14px", color: activeFarg, margin: 0, fontFamily: "Times New Roman, serif", lineHeight: 1.4 }}>{displayAmne}</p>
                </div>

                <div style={{ padding: "28px", background: C.surface, border: `1px solid ${activeFarg}40`, borderRadius: "4px", minHeight: "160px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                    <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#f87171", display: "inline-block" }} />
                    <span style={{ fontSize: "10px", color: activeFarg, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "monospace" }}>
                      {currentInlagg.agent} · {L.inlagg} {debattIdx + 1}/{debatt.inlagg.length}
                    </span>
                  </div>
                  <p style={{ fontSize: "18px", lineHeight: 1.6, fontFamily: "Times New Roman, serif", color: C.text, margin: 0, borderLeft: `3px solid ${activeFarg}`, paddingLeft: "16px" }}>
                    {translatedInlagg?.[debattIdx] || currentInlagg.text}
                  </p>
                </div>

                {upcomingInlagg.length > 0 && (
                  <div style={{ padding: "20px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "4px" }}>
                    <div style={{ fontSize: "10px", color: C.textMuted, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "14px", fontFamily: "monospace" }}>{L.nastaUpp}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {upcomingInlagg.map((inp, i) => (
                        <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", opacity: 1 - i * 0.25 }}>
                          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: AGENT_FARG[inp.agent] || C.accent, flexShrink: 0, marginTop: "5px" }} />
                          <div>
                            <p style={{ fontSize: "11px", color: AGENT_FARG[inp.agent] || C.accent, margin: "0 0 2px 0", fontFamily: "monospace" }}>{inp.agent}</p>
                            <p style={{ fontSize: "12px", color: C.textMuted, margin: 0, lineHeight: 1.5 }}>
                              {(translatedInlagg?.[debattIdx + 1 + i] || inp.text).slice(0, 80)}…
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ flexShrink: 0 }}>
        <NewsTicker />
      </div>

      <style>{`
        @keyframes dot { 0%,100%{opacity:1}50%{opacity:0} }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
