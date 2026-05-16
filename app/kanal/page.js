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

const DEBATT_AGENTER = [
  "Nationalekonom","Miljöaktivist","Teknikoptimist","Konservativ debattör",
  "Jurist","Journalist","Filosof","Läkare","Psykolog","Historiker",
  "Sociolog","Kryptoanalytiker",
];

function randomPanel(n = 3) {
  return [...DEBATT_AGENTER].sort(() => Math.random() - 0.5).slice(0, n);
}

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
function useBlinkState(active) {
  const [blinkState, setBlinkState] = useState("open");
  const timerRef = useRef(null);

  useEffect(() => {
    if (!active) {
      setBlinkState("open");
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    let cancelled = false;

    const doBlink = async () => {
      if (cancelled) return;
      setBlinkState("half");
      await sleep(80);
      if (cancelled) return;
      setBlinkState("closed");
      await sleep(120);
      if (cancelled) return;
      setBlinkState("half");
      await sleep(80);
      if (cancelled) return;
      setBlinkState("open");

      const delay = 3000 + Math.random() * 4000;
      timerRef.current = setTimeout(doBlink, delay);
    };

    const initialDelay = 1000 + Math.random() * 2000;
    timerRef.current = setTimeout(doBlink, initialDelay);

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active]);

  return blinkState;
}

// ── Amplitude-hook ────────────────────────────────────────────────────────────
function useAmplitude(isSpeaking) {
  const amplitudeRef = useRef(1);
  const frameRef     = useRef(null);

  useEffect(() => {
    let running = true;
    const tick = () => {
      if (!running) return;
      const target = isSpeaking
        ? 0.5 + Math.random() * 0.5
        : 0.05 + Math.random() * 0.08;
      amplitudeRef.current += (target - amplitudeRef.current) * 0.15;
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [isSpeaking]);

  return amplitudeRef;
}

// ── WaveformBar ────────────────────────────────────────────────────────────────
function WaveformBar({ isSpeaking, isThinking }) {
  const canvasRef    = useRef(null);
  const amplitudeRef = useAmplitude(isSpeaking);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx    = canvas.getContext("2d");
    const W      = canvas.width;
    const H      = canvas.height;
    const BARS   = 12;
    const GAP    = 3;
    const barW   = (W - GAP * (BARS - 1)) / BARS;
    let frameId;
    let dotPhase = 0;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      if (isThinking) {
        dotPhase += 0.06;
        const dotR   = 4;
        const dots   = 3;
        const totalW = dots * dotR * 2 + (dots - 1) * 10;
        const startX = (W - totalW) / 2;
        const cy     = H / 2;
        for (let d = 0; d < dots; d++) {
          const phase   = dotPhase + d * (Math.PI * 2 / 3);
          const opacity = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(phase));
          const scale   = 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(phase));
          ctx.beginPath();
          ctx.arc(startX + d * (dotR * 2 + 10) + dotR, cy, dotR * scale, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(160, 200, 240, ${opacity})`;
          ctx.fill();
        }
      } else {
        for (let b = 0; b < BARS; b++) {
          const amp    = amplitudeRef.current;
          const noise  = 0.4 + Math.random() * 0.6;
          const height = Math.max(2, (H * amp * noise) * (isSpeaking ? 1 : 0.12));
          const x      = b * (barW + GAP);
          const y      = (H - height) / 2;
          ctx.fillStyle = "rgba(160, 200, 240, 0.85)";
          ctx.beginPath();
          ctx.roundRect(x, y, barW, height, 2);
          ctx.fill();
        }
      }
      frameId = requestAnimationFrame(draw);
    };
    frameId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameId);
  }, [isSpeaking, isThinking, amplitudeRef]);

  return (
    <canvas
      ref={canvasRef}
      width={240}
      height={12}
      style={{ width: "100%", height: "12px", display: "block" }}
    />
  );
}

// ── AnchorImage ───────────────────────────────────────────────────────────────
// Open-eye mouth frames: anna.png (m0), anna-small.png (m1), anna-medium.png (m2), anna-large.png (m3)
const MOUTH_OPEN   = ["anna.png", "anna-small.png", "anna-medium.png", "anna-large.png"];
const MOUTH_HALF   = ["anna-m0-half.png", "anna-m1-half.png", "anna-m2-half.png", "anna-m3-half.png"];
const MOUTH_CLOSED = ["anna-m0-closed.png", "anna-m1-closed.png", "anna-m2-closed.png", "anna-m3-closed.png"];

function AnchorImage({ blinkState, isSpeaking }) {
  const [mouthIdx, setMouthIdx] = useState(1);

  useEffect(() => {
    if (!isSpeaking) { setMouthIdx(1); return; }
    // Cycle between m1 and m2 — avoids jumping back to m0 which shifts the head
    const id = setInterval(() => setMouthIdx(m => m === 1 ? 2 : 1), 220);
    return () => clearInterval(id);
  }, [isSpeaking]);

  let src;
  if (isSpeaking) {
    const frames = blinkState === "closed" ? MOUTH_CLOSED
                 : blinkState === "half"   ? MOUTH_HALF
                 :                           MOUTH_OPEN;
    src = `/avatarer/podd/${frames[mouthIdx]}`;
  } else {
    src = blinkState === "open"   ? `/avatarer/podd/anna.png`
        : blinkState === "half"   ? `/avatarer/podd/anna-m0-half.png`
        :                           `/avatarer/podd/anna-m0-closed.png`;
  }

  return (
    <img
      src={src}
      alt="Anna"
      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }}
    />
  );
}

export default function KanalPage() {
  const [mode, setMode]           = useState("idle");
  const [nyheter, setNyheter]     = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [lang, setLang]           = useState("sv");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [oversatter, setOversatter] = useState(false);
  const [debattInfo, setDebattInfo]   = useState(null);
  const [currentSpeaker, setCurrentSpeaker] = useState(null); // null = Anna
  const [currentText, setCurrentText] = useState("");

  const nyheterRef  = useRef([]);
  const runningRef  = useRef(false);
  const sessionRef  = useRef(0);
  const langRef     = useRef("sv");

  useEffect(() => {
    fetch("/api/kanal/nyheter")
      .then(r => r.json())
      .then(data => {
        const withStatus = data.map(n => ({ ...n, expandStatus: "idle" }));
        nyheterRef.current = withStatus;
        setNyheter(withStatus);
      })
      .catch(e => console.error("Nyheter-fetch-fel:", e));
  }, []);

  async function spelaUppText(text, agent, textLang = "sv") {
    return new Promise(resolve => {
      const voiceConf = (agent && AGENT_ROST[agent]) ? AGENT_ROST[agent] : AGENT_ROST["Anna"];
      // Use English voice when reading English content (Anna or no specific agent)
      const isAnna = !agent || agent === "Anna";
      const voice = (textLang === "en" && isAnna) ? "US English Female" : voiceConf.voice;
      if (typeof responsiveVoice === "undefined" || !responsiveVoice.voiceSupport()) {
        resolve();
        return;
      }
      setIsSpeaking(false);
      setIsThinking(true);
      responsiveVoice.speak(
        text,
        voice,
        {
          rate: voiceConf.rate,
          pitch: voiceConf.pitch,
          onstart: () => { setIsThinking(false); setIsSpeaking(true); },
          onend:   () => { setIsSpeaking(false); resolve(); },
          onerror: () => { setIsSpeaking(false); resolve(); },
        }
      );
    });
  }

  async function batchExpanderaRubriker() {
    const lista = nyheterRef.current;
    if (!lista.length) return false;
    try {
      const res = await fetch("/api/kanal/batch-expand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: lista.map(n => ({ rubrik: n.rubrik, kalla: n.kalla })) }),
      });
      const { expanded } = await res.json();
      if (Array.isArray(expanded) && expanded.length === lista.length) {
        nyheterRef.current = nyheterRef.current.map((n, i) =>
          expanded[i] && expanded[i] !== n.rubrik
            ? { ...n, text: expanded[i], expandStatus: "done" }
            : { ...n, expandStatus: "failed" }
        );
        setNyheter([...nyheterRef.current]);
        return true;
      }
    } catch (e) {
      console.error("Batch-expand-fel:", e);
    }
    return false;
  }

  async function batchOversattRubriker() {
    const lista = nyheterRef.current;
    if (!lista.length) return;
    try {
      const res = await fetch("/api/kanal/batch-rubriker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rubriker: lista.map(n => n.rubrik) }),
      });
      const { translated } = await res.json();
      if (Array.isArray(translated) && translated.length === lista.length) {
        nyheterRef.current = nyheterRef.current.map((n, i) =>
          translated[i] && translated[i] !== n.rubrik
            ? { ...n, rubrikEn: translated[i] }
            : n
        );
        setNyheter([...nyheterRef.current]);
      }
    } catch (e) {
      console.error("Batch-översätt-fel:", e);
    }
  }

  async function expanderaItem(item, i) {
    if (item.expandStatus === "done") return item.text;
    nyheterRef.current = nyheterRef.current.map((n, j) =>
      j === i ? { ...n, expandStatus: "loading" } : n
    );
    try {
      const res = await fetch("/api/kanal/expand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rubrik: item.rubrik, kalla: item.kalla, lang: langRef.current }),
      });
      const { text } = await res.json();
      if (text && text !== item.rubrik) {
        const rubrikEn = langRef.current === "en"
          ? (text.split(/(?<=[.!?])\s+/)[0] || text).slice(0, 120)
          : undefined;
        nyheterRef.current = nyheterRef.current.map((n, j) =>
          j === i ? { ...n, text, expandStatus: "done", ...(rubrikEn ? { rubrikEn } : {}) } : n
        );
        setNyheter([...nyheterRef.current]);
        return text;
      }
      nyheterRef.current = nyheterRef.current.map((n, j) =>
        j === i ? { ...n, expandStatus: "failed" } : n
      );
    } catch (e) {
      console.error("expanderaItem-fel:", e);
      nyheterRef.current = nyheterRef.current.map((n, j) =>
        j === i ? { ...n, expandStatus: "failed" } : n
      );
    }
    return item.rubrik;
  }

  async function spelaUppNyheter() {
    const session = sessionRef.current;
    const lista   = nyheterRef.current;
    setMode("nyheter");

    if (langRef.current === "en") {
      setOversatter(true);
      if (nyheterRef.current.some(n => !n.rubrikEn)) {
        await batchOversattRubriker();
        if (session !== sessionRef.current) return;
        await sleep(4000);
      }
      await expanderaItem(nyheterRef.current[0], 0);
      if (session !== sessionRef.current) return;
      setOversatter(false);
    } else {
      setOversatter(true);
      if (nyheterRef.current.some(n => n.expandStatus !== "done")) {
        const batchOk = await batchExpanderaRubriker();
        if (session !== sessionRef.current) return;
        if (!batchOk) {
          await sleep(2000);
          await expanderaItem(nyheterRef.current[0], 0);
          if (session !== sessionRef.current) return;
        }
      }
      setOversatter(false);
    }

    for (let i = 0; i < lista.length; i++) {
      if (session !== sessionRef.current) return;
      setCurrentIdx(i);

      const nextPrefetch = i + 1 < lista.length
        ? expanderaItem(nyheterRef.current[i + 1], i + 1)
        : Promise.resolve();

      const item = nyheterRef.current[i];
      const text = item.expandStatus === "done"
        ? item.text
        : (langRef.current === "en" && item.rubrikEn ? item.rubrikEn : item.rubrik);

      setCurrentText(text);
      const t0 = Date.now();
      await spelaUppText(text, null, langRef.current);
      if (session !== sessionRef.current) return;
      await nextPrefetch;

      const elapsed = Date.now() - t0;
      if (elapsed < 5000) await sleep(5000 - elapsed);

      if (session !== sessionRef.current) return;
      await sleep(600);
    }
  }

  async function streamText(amne, historik, agent) {
    try {
      const res = await fetch("/api/chatt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amne, historik, agent, lang: "sv" }),
      });
      if (!res.ok || !res.body) return "";
      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6);
          if (raw === "[DONE]") continue;
          try { text += JSON.parse(raw).choices?.[0]?.delta?.content ?? ""; } catch {}
        }
      }
      return text.trim();
    } catch { return ""; }
  }

  async function spelaUppDirektDebatt() {
    const session = sessionRef.current;
    const agenter = randomPanel(3);

    // Hämta ämne
    setIsThinking(true);
    let amne = "Framtidens Sverige";
    try {
      const r    = await fetch("/api/chatt/amne", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agenter }),
      });
      const data = await r.json();
      if (data.amne) amne = data.amne;
    } catch {}
    setIsThinking(false);
    if (session !== sessionRef.current) return;

    // Anna presenterar debatten
    setCurrentSpeaker(null);
    setCurrentText(`Nu följer en direktdebatt om: ${amne}`);
    await spelaUppText(`Nu följer en direktdebatt. Ämne: ${amne}`, null);
    if (session !== sessionRef.current) return;
    await sleep(400);

    setMode("debatt");
    const historik = [];
    const TURNS    = 6;

    for (let t = 0; t < TURNS; t++) {
      if (session !== sessionRef.current) { setCurrentSpeaker(null); return; }
      const agent = agenter[t % agenter.length];

      setCurrentSpeaker(agent);
      setDebattInfo({ amne, agenter, turn: t + 1, total: TURNS, agent });
      setIsThinking(true);

      const text = await streamText(amne, historik, agent);
      if (session !== sessionRef.current) { setCurrentSpeaker(null); return; }
      setIsThinking(false);

      if (text) {
        setCurrentText(text);
        historik.push({ agent, text: text.slice(0, 300) });
        await spelaUppText(text, agent);
      }
      if (session !== sessionRef.current) { setCurrentSpeaker(null); return; }
      await sleep(800);
    }

    setCurrentSpeaker(null);
  }

  async function startaSandning() {
    if (runningRef.current) return;
    runningRef.current = true;
    setMode("starting");
    setOversatter(false);

    try {
      await spelaUppNyheter();
    } catch (e) {
      console.error("Nyheter-fel:", e);
    }

    if (runningRef.current) {
      try {
        await spelaUppDirektDebatt();
      } catch (e) {
        console.error("Debatt-fel:", e);
      }
    }

    runningRef.current = false;
    setMode("idle");
    setIsSpeaking(false);
    setIsThinking(false);
    setOversatter(false);
    setCurrentText("");
  }

  function stoppaSandning() {
    runningRef.current = false;
    sessionRef.current++; // invalidates all in-flight async loops
    if (typeof responsiveVoice !== "undefined") responsiveVoice.cancel();
    setMode("idle");
    setIsSpeaking(false);
    setIsThinking(false);
    setOversatter(false);
    setCurrentIdx(0);
    setDebattInfo(null);
    setCurrentSpeaker(null);
    setCurrentText("");
  }

  function bytLang(nyttLang) {
    if (nyttLang === lang) return;
    stoppaSandning();
    setLang(nyttLang);
    langRef.current = nyttLang;
    nyheterRef.current = nyheterRef.current.map(n => ({ ...n, text: undefined, expandStatus: "idle", rubrikEn: undefined }));
    setNyheter([...nyheterRef.current]);
  }

  const running  = mode !== "idle";
  const blinkState = useBlinkState(running);
  const current  = nyheter[currentIdx] || null;
  const upcoming = nyheter.slice(currentIdx + 1, currentIdx + 6);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Georgia, serif" }}>

      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "6px 20px", background: "#050505", borderBottom: `1px solid ${C.border}`,
        fontSize: "11px", fontFamily: "monospace", letterSpacing: "0.1em",
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: "6px", color: running ? "#e05050" : C.textMuted }}>
          <span style={{
            width: "7px", height: "7px", borderRadius: "50%",
            background: running ? "#e05050" : "#333",
            boxShadow: running ? "0 0 6px #e05050" : "none",
          }} />
          {running ? "SÄNDER NYHETER" : "NYHETSKANAL"}
        </span>
        <span style={{ color: C.textMuted }}>AI NYHETSKANAL</span>
      </div>

      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 20px" }}>
        <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>

          <div style={{ flex: "0 0 440px", minWidth: 0 }}>

            <div style={{
              position: "relative", borderRadius: "12px", overflow: "hidden",
              border: `1px solid ${C.border}`,
              aspectRatio: "4/3",
              background: "#050505",
            }}>
              {currentSpeaker ? (
                <img
                  src={`/avatarer/${agentSlug(currentSpeaker)}.png`}
                  alt={currentSpeaker}
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }}
                />
              ) : (
                <AnchorImage blinkState={blinkState} isSpeaking={isSpeaking} />
              )}

              <div style={{
                position: "absolute", top: "12px", left: "12px",
                display: "flex", alignItems: "center", gap: "6px",
                background: "rgba(0,0,0,0.7)", borderRadius: "4px", padding: "4px 8px",
              }}>
                <span style={{
                  width: "6px", height: "6px", borderRadius: "50%",
                  background: running ? (mode === "debatt" ? "#9060e0" : "#e05050") : "#444",
                  boxShadow: running ? `0 0 6px ${mode === "debatt" ? "#9060e0" : "#e05050"}` : "none",
                }} />
                <span style={{
                  fontSize: "10px", letterSpacing: "0.12em", fontFamily: "monospace",
                  color: running ? (mode === "debatt" ? "#9060e0" : "#e05050") : "#555",
                }}>
                  {mode === "debatt" ? "DEBATT" : "LIVE"}
                </span>
              </div>

              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                background: "linear-gradient(transparent, rgba(0,0,0,0.85))",
                padding: "20px 14px 10px",
              }}>
                <div style={{
                  fontSize: "20px", fontWeight: 400, lineHeight: 1,
                  color: currentSpeaker ? (AGENT_FARG[currentSpeaker] || "#c0b0e8") : ANCHOR_FARG,
                }}>
                  {currentSpeaker || "Anna"}
                </div>
                <div style={{ fontSize: "11px", color: "#888", letterSpacing: "0.08em", marginTop: "2px" }}>
                  {currentSpeaker ? "Debattör" : "Nyhetsankare"}
                </div>
                <div style={{ marginTop: "8px" }}>
                  <WaveformBar isSpeaking={isSpeaking} isThinking={isThinking || oversatter} />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              {[["sv","🇸🇪 Svenska"],["en","🇬🇧 English"]].map(([l, lbl]) => (
                <button key={l} onClick={() => bytLang(l)} style={{
                  flex: 1, padding: "9px", borderRadius: "6px", fontSize: "13px",
                  border: `1px solid ${lang === l ? "#4a7a9b" : C.border}`,
                  background: lang === l ? "#0a1a2a" : "transparent",
                  color: lang === l ? "#a0c8f0" : C.textMuted,
                  cursor: "pointer", fontFamily: "Georgia, serif",
                }}>
                  {lbl}
                </button>
              ))}
            </div>

            <button
              onClick={running ? stoppaSandning : startaSandning}
              style={{
                width: "100%", marginTop: "8px", padding: "13px",
                borderRadius: "6px", fontSize: "14px", fontFamily: "Georgia, serif",
                border: `1px solid ${running ? "#5a2020" : "#2a4a2a"}`,
                background: running ? "#1a0808" : "#081208",
                color: running ? "#e05050" : C.accent,
                cursor: "pointer", letterSpacing: "0.08em",
              }}
            >
              {running ? "⏹ STOPPA SÄNDNING" : "▶ STARTA SÄNDNING"}
            </button>

            <p style={{ fontSize: "11px", color: C.textMuted, marginTop: "12px", lineHeight: 1.6, fontFamily: "monospace" }}>
              {nyheter.length} nyheter · följs av debatter
            </p>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>

            {oversatter && (
              <div style={{
                background: "#0a0f0a", border: `1px solid ${C.accent}40`,
                borderRadius: "8px", padding: "14px 18px", marginBottom: "16px",
                display: "flex", alignItems: "center", gap: "10px",
              }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: C.accent, boxShadow: `0 0 8px ${C.accent}`, flexShrink: 0 }} />
                <span style={{ fontSize: "12px", color: C.accent, fontFamily: "monospace", letterSpacing: "0.1em" }}>
                  {lang === "en" ? "PREPARING BROADCAST…" : "FÖRBEREDER SÄNDNING…"}
                </span>
              </div>
            )}

            {current && mode === "nyheter" && (
              <div style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: "8px", padding: "20px 24px", marginBottom: "16px",
              }}>
                <p style={{ fontSize: "11px", color: C.textMuted, fontFamily: "monospace", letterSpacing: "0.1em", margin: "0 0 10px" }}>LÄSER NU</p>
                <h2 style={{ fontSize: "22px", fontWeight: 400, lineHeight: 1.3, margin: "0 0 8px", color: C.text }}>
                  {lang === "en" && current.rubrikEn ? current.rubrikEn : current.rubrik}
                </h2>
                {currentText && currentText !== current.rubrik && currentText !== current.rubrikEn && (
                  <p style={{ fontSize: "15px", color: "#c0b8a8", lineHeight: 1.75, margin: "12px 0 10px" }}>
                    {currentText}
                  </p>
                )}
                <p style={{ fontSize: "12px", color: C.textMuted, margin: 0, fontFamily: "monospace" }}>{current.kalla}</p>
              </div>
            )}

            {debattInfo && mode === "debatt" && (
              <div style={{
                background: "#0a080f", border: "1px solid #3a2a5a",
                borderRadius: "8px", padding: "20px 24px", marginBottom: "16px",
              }}>
                <p style={{ fontSize: "11px", color: "#8080c0", fontFamily: "monospace", letterSpacing: "0.1em", margin: "0 0 10px" }}>
                  DIREKTDEBATT · INLÄGG {debattInfo.turn}/{debattInfo.total}
                </p>
                <h2 style={{ fontSize: "17px", fontWeight: 400, lineHeight: 1.4, margin: "0 0 14px", color: "#c0b0e8" }}>
                  {debattInfo.amne}
                </h2>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {debattInfo.agenter?.map(a => (
                    <span key={a} style={{
                      fontSize: "11px", padding: "3px 8px", borderRadius: "4px", fontFamily: "monospace",
                      background: a === debattInfo.agent ? "#2a1a4a" : "transparent",
                      border: `1px solid ${a === debattInfo.agent ? (AGENT_FARG[a] || "#9060e0") : "#2a2a3a"}`,
                      color: a === debattInfo.agent ? (AGENT_FARG[a] || "#c0b0e8") : "#555",
                    }}>
                      {a}
                    </span>
                  ))}
                </div>
                {currentText && (
                  <p style={{ fontSize: "14px", color: "#a098c0", lineHeight: 1.7, margin: "14px 0 0", fontStyle: "italic" }}>
                    {currentText.slice(0, 300)}{currentText.length > 300 ? "…" : ""}
                  </p>
                )}
              </div>
            )}

            {upcoming.length > 0 && (
              <div style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: "8px", padding: "16px 20px",
              }}>
                <p style={{ fontSize: "11px", color: C.textMuted, fontFamily: "monospace", letterSpacing: "0.1em", margin: "0 0 12px" }}>I KÖN</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {upcoming.map((n, idx) => (
                    <div key={`${n.rubrik}-${idx}`} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                      <span style={{ fontSize: "12px", color: C.textMuted, fontFamily: "monospace", flexShrink: 0, paddingTop: "2px" }}>
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: "0 0 2px", fontSize: "14px", color: "#b0a898", lineHeight: 1.35 }}>
                          {lang === "en" && n.rubrikEn ? n.rubrikEn : n.rubrik}
                        </p>
                        <p style={{ margin: 0, fontSize: "11px", color: C.textMuted, fontFamily: "monospace" }}>{n.kalla}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {mode === "idle" && (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <p style={{ fontSize: "13px", color: C.textMuted, fontStyle: "italic" }}>
                  Tryck på ▶ STARTA SÄNDNING för att börja
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <NewsTicker />
    </div>
  );
}
