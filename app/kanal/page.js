"use client";
import { useState, useRef, useEffect } from "react";
import NewsTicker from "../NewsTicker";

const C = {
  bg: "#080808", surface: "#0f0f0f", border: "#1a1a1a",
  text: "#e8e0d0", textMuted: "#555", accent: "#6abf6a",
};

const ANCHOR = "Nationalekonom";
const ANCHOR_FARG = "#6abf6a";

function agentSlug(namn) {
  return namn.toLowerCase()
    .replace(/ä/g, "a").replace(/å/g, "a").replace(/ö/g, "o")
    .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function Waveform({ amplitude }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "2px", height: "24px" }}>
      {Array.from({ length: 24 }, (_, i) => {
        const base = 0.2 + 0.35 * Math.abs(Math.sin(i * 0.85));
        const h = amplitude > 0.02 ? 3 + (base + amplitude * 0.65) * 22 : 3;
        return (
          <div key={i} style={{
            width: "3px",
            height: `${Math.min(24, Math.max(3, h))}px`,
            background: ANCHOR_FARG,
            borderRadius: "1.5px",
            opacity: 0.75,
            transition: "height 0.08s ease",
          }} />
        );
      })}
    </div>
  );
}

function TalkingFace({ amplitude, speaking }) {
  const slug = agentSlug(ANCHOR);
  const base = `/avatarer/podd/${slug}`;
  const amp = speaking ? amplitude : 0;
  let state = 0;
  if (amp > 0.65) state = 3;
  else if (amp > 0.35) state = 2;
  else if (amp > 0.08) state = 1;
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

function AnchorPanel({ speaking, amplitude }) {
  const glow = speaking ? 18 + amplitude * 40 : 0;
  return (
    <div style={{ position: "relative", width: "100%", paddingTop: "75%", background: "#000", borderRadius: "4px", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0 }}>
        <TalkingFace amplitude={amplitude} speaking={speaking} />

        {/* Lower gradient + name */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "48px 20px 18px", background: "linear-gradient(transparent, rgba(0,0,0,0.9))" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              {speaking && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#f87171", display: "inline-block" }} />
                  <span style={{ fontSize: "11px", color: "#f87171", fontFamily: "monospace", letterSpacing: "0.1em" }}>LIVE</span>
                </div>
              )}
              <p style={{ fontSize: "20px", fontWeight: 700, color: C.text, margin: 0, fontFamily: "Times New Roman, serif", textShadow: "0 2px 8px #000" }}>
                {ANCHOR}
              </p>
              <p style={{ fontSize: "11px", color: ANCHOR_FARG, margin: "2px 0 0 0", letterSpacing: "0.06em" }}>
                Nyhetspresentatör
              </p>
            </div>
            {speaking && <Waveform amplitude={amplitude} />}
          </div>
        </div>

        {/* Glow ring when speaking */}
        {speaking && (
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            boxShadow: `inset 0 0 ${glow * 1.5}px ${ANCHOR_FARG}33`,
            border: `2px solid ${ANCHOR_FARG}55`,
            transition: "box-shadow 0.08s ease",
          }} />
        )}
      </div>
    </div>
  );
}

export default function KanalPage() {
  const [nyheter, setNyheter]       = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [speaking, setSpeaking]     = useState(false);
  const [amplitude, setAmplitude]   = useState(0);
  const [running, setRunning]       = useState(false);
  const [laddar, setLaddar]         = useState(true);

  const runningRef  = useRef(false);
  const ampTimer    = useRef(null);
  const nyheterRef  = useRef([]);

  useEffect(() => {
    fetch("/api/ticker")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length) {
          setNyheter(data);
          nyheterRef.current = data;
        }
        setLaddar(false);
      })
      .catch(() => setLaddar(false));
    return () => {
      runningRef.current = false;
      if (ampTimer.current) clearInterval(ampTimer.current);
    };
  }, []);

  async function spelaUppNyhet(text) {
    setSpeaking(true);
    await new Promise(resolve => {
      if (!runningRef.current) { resolve(); return; }
      const startAnim = () => {
        ampTimer.current = setInterval(() => {
          if (!runningRef.current) { clearInterval(ampTimer.current); return; }
          const t = Date.now();
          setAmplitude(Math.max(0.05, 0.35 + 0.55 * Math.sin(t * 0.009) * Math.abs(Math.cos(t * 0.014))));
        }, 70);
      };
      const stopAnim = () => {
        if (ampTimer.current) clearInterval(ampTimer.current);
        setAmplitude(0);
        resolve();
      };
      const timeout = setTimeout(stopAnim, text.length * 75 + 4000);
      if (window.responsiveVoice) {
        window.responsiveVoice.speak(text, "Swedish Male", {
          pitch: 0.88, rate: 0.88,
          onstart: startAnim,
          onend:   () => { clearTimeout(timeout); stopAnim(); },
          onerror: () => { clearTimeout(timeout); stopAnim(); },
        });
      } else {
        // Fallback: simulate speaking duration
        startAnim();
        setTimeout(stopAnim, Math.max(2000, text.length * 60));
      }
    });
    setSpeaking(false);
    setAmplitude(0);
  }

  async function startaKanal() {
    if (runningRef.current) return;
    runningRef.current = true;
    setRunning(true);

    const lista = nyheterRef.current;
    if (!lista.length) { stoppaKanal(); return; }

    let idx = 0;
    while (runningRef.current) {
      setCurrentIdx(idx);
      const nyhet = lista[idx];
      const text = `${nyhet.rubrik}. Källa: ${nyhet.kalla}.`;
      await spelaUppNyhet(text);
      if (!runningRef.current) break;
      await new Promise(r => setTimeout(r, 600));
      idx = (idx + 1) % lista.length;
    }
    stoppaKanal();
  }

  function stoppaKanal() {
    runningRef.current = false;
    setRunning(false);
    setSpeaking(false);
    setAmplitude(0);
    if (ampTimer.current) clearInterval(ampTimer.current);
    if (window.responsiveVoice) window.responsiveVoice.cancel();
  }

  const current = nyheter[currentIdx];
  const upcoming = running
    ? [...Array(Math.min(5, nyheter.length))].map((_, i) => nyheter[(currentIdx + i + 1) % nyheter.length]).filter(Boolean)
    : [];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, display: "flex", flexDirection: "column" }}>

      {/* Nav */}
      <nav style={{ borderBottom: `1px solid ${C.border}`, padding: "0 24px", height: "48px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "13px", color: C.textMuted, fontFamily: "monospace", letterSpacing: "0.08em" }}>← debatt.ai</span>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: running ? "#f87171" : C.textMuted, boxShadow: running ? "0 0 8px #f87171" : "none" }} />
          <span style={{ fontSize: "11px", color: running ? "#f87171" : C.textMuted, fontFamily: "monospace", letterSpacing: "0.1em" }}>
            {running ? "SÄNDER LIVE" : "AV LUFTEN"}
          </span>
        </div>
        <div style={{ fontSize: "12px", color: C.textMuted, fontFamily: "monospace", letterSpacing: "0.06em" }}>
          AI NYHETSKANAL
        </div>
      </nav>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", maxWidth: "1100px", width: "100%", margin: "0 auto", padding: "32px 24px 24px", gap: "32px" }}>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", alignItems: "start" }}>

          {/* Left: anchor */}
          <div>
            <AnchorPanel speaking={speaking} amplitude={amplitude} />

            {/* Controls */}
            <div style={{ marginTop: "20px", display: "flex", gap: "12px", alignItems: "center" }}>
              {!running ? (
                <button
                  onClick={startaKanal}
                  disabled={laddar || nyheter.length === 0}
                  style={{
                    flex: 1, padding: "14px", background: laddar ? C.surface : ANCHOR_FARG,
                    color: laddar ? C.textMuted : "#000", border: "none", borderRadius: "4px",
                    fontSize: "13px", fontWeight: 700, cursor: laddar ? "default" : "pointer",
                    letterSpacing: "0.08em", fontFamily: "monospace",
                  }}
                >
                  {laddar ? "LADDAR NYHETER…" : "▶  STARTA SÄNDNING"}
                </button>
              ) : (
                <button
                  onClick={stoppaKanal}
                  style={{
                    flex: 1, padding: "14px", background: "#1a1a1a",
                    color: "#f87171", border: `1px solid #f8717133`, borderRadius: "4px",
                    fontSize: "13px", fontWeight: 700, cursor: "pointer",
                    letterSpacing: "0.08em", fontFamily: "monospace",
                  }}
                >
                  ■  STOPPA SÄNDNING
                </button>
              )}
            </div>

            {nyheter.length > 0 && (
              <p style={{ fontSize: "11px", color: C.textMuted, margin: "12px 0 0 0", textAlign: "center", fontFamily: "monospace" }}>
                {nyheter.length} nyheter från {[...new Set(nyheter.map(n => n.kalla))].length} källor
              </p>
            )}
          </div>

          {/* Right: current headline + upcoming */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Current headline */}
            <div style={{ padding: "28px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "4px", minHeight: "160px" }}>
              <div style={{ fontSize: "10px", color: C.textMuted, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "16px", fontFamily: "monospace" }}>
                {running && speaking ? "LÄSER NU" : running ? "NÄSTA" : "SENASTE"}
              </div>
              {current ? (
                <>
                  <p style={{
                    fontSize: "22px", fontWeight: 700, lineHeight: 1.35,
                    fontFamily: "Times New Roman, serif", color: C.text, margin: "0 0 16px 0",
                    borderLeft: `3px solid ${ANCHOR_FARG}`, paddingLeft: "16px",
                  }}>
                    {current.rubrik}
                  </p>
                  <p style={{ fontSize: "11px", color: ANCHOR_FARG, margin: 0, fontFamily: "monospace", letterSpacing: "0.06em" }}>
                    {current.kalla}
                  </p>
                </>
              ) : (
                <p style={{ fontSize: "14px", color: C.textMuted, margin: 0 }}>
                  {laddar ? "Hämtar nyheter…" : "Inga nyheter tillgängliga."}
                </p>
              )}
            </div>

            {/* Upcoming queue */}
            {upcoming.length > 0 && (
              <div style={{ padding: "20px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "4px" }}>
                <div style={{ fontSize: "10px", color: C.textMuted, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "14px", fontFamily: "monospace" }}>
                  I KÖN
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {upcoming.map((n, i) => (
                    <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", opacity: 1 - i * 0.15 }}>
                      <span style={{ fontSize: "10px", color: C.textMuted, fontFamily: "monospace", paddingTop: "2px", flexShrink: 0 }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <p style={{ fontSize: "13px", color: C.text, margin: "0 0 2px 0", lineHeight: 1.4 }}>{n.rubrik}</p>
                        <p style={{ fontSize: "10px", color: C.textMuted, margin: 0, fontFamily: "monospace" }}>{n.kalla}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info box when not running */}
            {!running && !laddar && nyheter.length > 0 && (
              <div style={{ padding: "16px", background: "#0a0a0a", border: `1px solid ${C.border}`, borderRadius: "4px" }}>
                <p style={{ fontSize: "12px", color: C.textMuted, margin: 0, lineHeight: 1.7 }}>
                  Nationalekonom läser upp aktuella nyhetsrubriker från svenska och internationella källor i realtid.
                  Tryck på <strong style={{ color: C.text }}>STARTA SÄNDNING</strong> för att börja.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom ticker */}
      <div style={{ flexShrink: 0 }}>
        <NewsTicker />
      </div>

      <style>{`
        @keyframes dot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        * { box-sizing: border-box; }
        @media (max-width: 700px) {
          .kanal-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
