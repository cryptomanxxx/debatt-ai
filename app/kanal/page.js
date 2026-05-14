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

  const imgStyle = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 5%" };
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

function AnchorPanel({ speaking, amplitude }) {
  const glow = speaking ? 18 + amplitude * 40 : 0;
  return (
    <div style={{ position: "relative", width: "100%", paddingTop: "90%", background: "#000", borderRadius: "4px", overflow: "hidden" }}>
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
              <p style={{ fontSize: "11px", color: ANCHOR_FARG, margin: "2px 0 0 0", letterSpacing: "0.06em" }}>Nyhetsankare</p>
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

function DebattAgentPanel({ agent, speaking, amplitude }) {
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
                  <span style={{ fontSize: "11px", color: "#f87171", fontFamily: "monospace", letterSpacing: "0.1em" }}>TALAR</span>
                </div>
              )}
              <p style={{ fontSize: "20px", fontWeight: 700, color: C.text, margin: 0, fontFamily: "Times New Roman, serif", textShadow: "0 2px 8px #000" }}>{agent}</p>
              <p style={{ fontSize: "11px", color: farg, margin: "2px 0 0 0", letterSpacing: "0.06em" }}>Debattör</p>
            </div>
            {speaking && <Waveform amplitude={amplitude} farg={farg} />}