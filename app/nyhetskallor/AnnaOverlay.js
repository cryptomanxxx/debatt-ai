"use client";
import { useEffect, useRef, useState } from "react";

const ANCHOR_FARG = "#a0c8f0";

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Blink-hook (samma logik som /kanal) ─────────────────────────────────────
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
      timerRef.current = setTimeout(doBlink, 3000 + Math.random() * 4000);
    };
    timerRef.current = setTimeout(doBlink, 1000 + Math.random() * 2000);
    return () => { cancelled = true; if (timerRef.current) clearTimeout(timerRef.current); };
  }, [active]);

  return blinkState;
}

// ── Amplitude-hook (samma logik som /kanal) ─────────────────────────────────
function useAmplitude(isSpeaking) {
  const amplitudeRef = useRef(1);
  const frameRef = useRef(null);
  useEffect(() => {
    let running = true;
    const tick = () => {
      if (!running) return;
      const target = isSpeaking ? 0.5 + Math.random() * 0.5 : 0.05 + Math.random() * 0.08;
      amplitudeRef.current += (target - amplitudeRef.current) * 0.15;
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => { running = false; if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [isSpeaking]);
  return amplitudeRef;
}

function WaveformBar({ isSpeaking, isThinking }) {
  const canvasRef = useRef(null);
  const amplitudeRef = useAmplitude(isSpeaking);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height, BARS = 12, GAP = 3;
    const barW = (W - GAP * (BARS - 1)) / BARS;
    let frameId, dotPhase = 0;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      if (isThinking) {
        dotPhase += 0.06;
        const dotR = 4, dots = 3;
        const totalW = dots * dotR * 2 + (dots - 1) * 10;
        const startX = (W - totalW) / 2, cy = H / 2;
        for (let d = 0; d < dots; d++) {
          const phase = dotPhase + d * (Math.PI * 2 / 3);
          const opacity = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(phase));
          const scale = 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(phase));
          ctx.beginPath();
          ctx.arc(startX + d * (dotR * 2 + 10) + dotR, cy, dotR * scale, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(160, 200, 240, ${opacity})`;
          ctx.fill();
        }
      } else {
        for (let b = 0; b < BARS; b++) {
          const amp = amplitudeRef.current;
          const noise = 0.4 + Math.random() * 0.6;
          const height = Math.max(2, (H * amp * noise) * (isSpeaking ? 1 : 0.12));
          const x = b * (barW + GAP), y = (H - height) / 2;
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

  return <canvas ref={canvasRef} width={240} height={12} style={{ width: "100%", height: "12px", display: "block" }} />;
}

// Open-eye mouth frames: anna.png (m0), anna-small.png (m1), anna-medium.png (m2), anna-large.png (m3)
const MOUTH_OPEN   = ["anna.png", "anna-small.png", "anna-medium.png", "anna-large.png"];
const MOUTH_HALF   = ["anna-m0-half.png", "anna-m1-half.png", "anna-m2-half.png", "anna-m3-half.png"];
const MOUTH_CLOSED = ["anna-m0-closed.png", "anna-m1-closed.png", "anna-m2-closed.png", "anna-m3-closed.png"];

function AnchorImage({ blinkState, isSpeaking }) {
  const [mouthIdx, setMouthIdx] = useState(1);
  useEffect(() => {
    if (!isSpeaking) { setMouthIdx(1); return; }
    const id = setInterval(() => setMouthIdx(m => m === 1 ? 2 : 1), 220);
    return () => clearInterval(id);
  }, [isSpeaking]);

  let src;
  if (isSpeaking) {
    const frames = blinkState === "closed" ? MOUTH_CLOSED : blinkState === "half" ? MOUTH_HALF : MOUTH_OPEN;
    src = `/avatarer/podd/${frames[mouthIdx]}`;
  } else {
    src = blinkState === "open" ? `/avatarer/podd/anna.png`
        : blinkState === "half" ? `/avatarer/podd/anna-m0-half.png`
        : `/avatarer/podd/anna-m0-closed.png`;
  }

  return <img src={src} alt="Anna" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }} />;
}

// Fristående overlay som visar Anna (video + röst) precis som på /kanal, men
// för en enskild nyhet i taget istället för en löpande sändning. Ett enda
// instans monteras i taget från NyhetskallorClient (key=nyhet-id tvingar en
// ren remount — och därmed cancel() av föregående uppläsning — när besökaren
// klickar "Anna läser" på en annan nyhet medan overlayen redan är öppen).
export default function AnnaOverlay({ text, onClose }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(true);
  const running = isSpeaking || isThinking;
  const blinkState = useBlinkState(true);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    if (typeof window === "undefined" || !window.responsiveVoice || !window.responsiveVoice.voiceSupport()) {
      setIsThinking(false);
      return;
    }
    window.responsiveVoice.speak(text, "Swedish Female", {
      rate: 1.0,
      pitch: 1.0,
      onstart: () => { setIsThinking(false); setIsSpeaking(true); },
      onend:   () => { setIsSpeaking(false); onClose(); },
      onerror: () => { setIsSpeaking(false); onClose(); },
    });
    return () => { window.responsiveVoice?.cancel(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
    >
      <div onClick={e => e.stopPropagation()} style={{ width: "min(380px, 92vw)" }}>
        <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: "1px solid #1a1a1a", aspectRatio: "4/3", background: "#050505" }}>
          <AnchorImage blinkState={blinkState} isSpeaking={isSpeaking} />

          <div style={{
            position: "absolute", top: "12px", left: "12px",
            display: "flex", alignItems: "center", gap: "6px",
            background: "rgba(0,0,0,0.7)", borderRadius: "4px", padding: "4px 8px",
          }}>
            <span style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: running ? "#e05050" : "#444",
              boxShadow: running ? "0 0 6px #e05050" : "none",
            }} />
            <span style={{ fontSize: "10px", letterSpacing: "0.12em", fontFamily: "monospace", color: running ? "#e05050" : "#555" }}>
              LIVE
            </span>
          </div>

          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.85))", padding: "20px 14px 10px" }}>
            <div style={{ fontSize: "20px", fontWeight: 400, lineHeight: 1, color: ANCHOR_FARG }}>Anna</div>
            <div style={{ fontSize: "11px", color: "#888", letterSpacing: "0.08em", marginTop: "2px" }}>Nyhetsankare</div>
            <div style={{ marginTop: "8px" }}>
              <WaveformBar isSpeaking={isSpeaking} isThinking={isThinking} />
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            width: "100%", marginTop: "10px", padding: "10px",
            borderRadius: "6px", fontSize: "13px", fontFamily: "Georgia, serif",
            border: "1px solid #5a2020", background: "#1a0808", color: "#e05050",
            cursor: "pointer", letterSpacing: "0.06em",
          }}
        >
          ⏹ Stäng
        </button>
      </div>
    </div>
  );
}
