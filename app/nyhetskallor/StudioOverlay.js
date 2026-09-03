"use client";
import { useEffect, useState } from "react";
import { AGENTER, AnchorImage, WaveformBar, useBlinkState, usePreload } from "./AgentOverlay";

// Vem som pratar (speaker-nyckeln i LLM-svaret) mappat till agentens faktiska
// röst/bildkonfiguration i AGENTER — samma "Peter"-visningsnamn-mönster som
// AgentOverlay: rösten och avataren hämtas via agentnyckeln "Nationalekonom",
// bara namnet som visas skiljer sig.
const ROLLER = [
  { speaker: "anna", agent: "Anna", namn: "Anna" },
  { speaker: "peter", agent: "Nationalekonom", namn: "Peter" },
];

function rolleFor(speaker) {
  return ROLLER.find(r => r.speaker === speaker) || ROLLER[0];
}

function StudioPerson({ rolle, isSpeaking, dimmed }) {
  const cfg = AGENTER[rolle.agent];
  const framesReady = usePreload(cfg);
  const blinkState = useBlinkState(cfg.hasBlink && isSpeaking && framesReady);

  return (
    <div style={{
      flex: 1, position: "relative", aspectRatio: "3/4", overflow: "hidden",
      opacity: dimmed ? 0.5 : 1, filter: isSpeaking ? "brightness(1.08)" : "none",
      transform: dimmed ? "scale(0.97)" : "scale(1)",
      transition: "opacity 250ms ease, transform 250ms ease, filter 250ms ease",
    }}>
      <AnchorImage cfg={cfg} blinkState={blinkState} isSpeaking={isSpeaking} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.85))", padding: "16px 10px 8px" }}>
        <div style={{ fontSize: "16px", fontWeight: 400, lineHeight: 1, color: cfg.farg }}>{rolle.namn}</div>
        <div style={{ fontSize: "9px", color: "#888", letterSpacing: "0.06em", marginTop: "2px" }}>{cfg.roll}</div>
      </div>
    </div>
  );
}

// Anna och Peter i samma studio — genererar en kort dialog om en nyhet via
// /api/studio (ren text, ingen streaming) och spelar sedan upp replikerna i
// tur och ordning med responsiveVoice, med visuell fokusväxling mellan de två
// (opacity/scale/brightness) istället för riktig videogenerering. v1 av det
// tvåankars-studiokoncept som efterfrågades efter AgentOverlay-uppläsningen.
export default function StudioOverlay({ rubrik, beskrivning, onClose }) {
  const [fas, setFas] = useState("laddar"); // laddar | spelar | klar | fel
  const [turns, setTurns] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [fel, setFel] = useState("");

  // Hämta dialogen
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/studio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rubrik, beskrivning }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok || !Array.isArray(data.turns) || data.turns.length === 0) {
          setFel(data.error || "Kunde inte skapa studiosamtalet just nu.");
          setFas("fel");
          return;
        }
        setTurns(data.turns);
        setFas("spelar");
      } catch {
        if (!cancelled) { setFel("Nätverksfel — försök igen."); setFas("fel"); }
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Spela upp repliker i tur och ordning
  useEffect(() => {
    if (fas !== "spelar" || turns.length === 0) return;
    if (activeIdx >= turns.length) { setFas("klar"); return; }

    const turn = turns[activeIdx];
    const rolle = rolleFor(turn.speaker);
    const cfg = AGENTER[rolle.agent];

    if (typeof window === "undefined" || !window.responsiveVoice || !window.responsiveVoice.voiceSupport()) {
      const t = setTimeout(() => setActiveIdx(i => i + 1), 1800);
      return () => clearTimeout(t);
    }

    window.responsiveVoice.speak(turn.text, cfg.rvVoice, {
      rate: cfg.rate,
      pitch: cfg.pitch,
      onend:   () => setActiveIdx(i => i + 1),
      onerror: () => setActiveIdx(i => i + 1),
    });
    return () => { window.responsiveVoice?.cancel(); };
  }, [fas, activeIdx, turns]);

  // Stäng automatiskt en liten stund efter sista repliken
  useEffect(() => {
    if (fas !== "klar") return;
    const t = setTimeout(onClose, 1500);
    return () => clearTimeout(t);
  }, [fas, onClose]);

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const turn = turns[activeIdx];
  const aktivRolle = turn ? rolleFor(turn.speaker) : null;
  const annaAktiv = fas === "spelar" && aktivRolle?.speaker === "anna";
  const peterAktiv = fas === "spelar" && aktivRolle?.speaker === "peter";

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "20px", overflowY: "auto" }}
    >
      <div onClick={e => e.stopPropagation()} style={{ width: "min(760px, 96vw)", margin: "auto 0" }}>
        <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: "1px solid #1a1a1a", background: "#050505" }}>
          <div style={{
            position: "absolute", top: "12px", left: "12px", zIndex: 1,
            display: "flex", alignItems: "center", gap: "6px",
            background: "rgba(0,0,0,0.7)", borderRadius: "4px", padding: "4px 8px",
          }}>
            <span style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: fas === "spelar" ? "#e05050" : "#444",
              boxShadow: fas === "spelar" ? "0 0 6px #e05050" : "none",
            }} />
            <span style={{ fontSize: "10px", letterSpacing: "0.12em", fontFamily: "monospace", color: fas === "spelar" ? "#e05050" : "#555" }}>
              STUDIO
            </span>
          </div>

          <div style={{ display: "flex" }}>
            <StudioPerson rolle={ROLLER[0]} isSpeaking={annaAktiv} dimmed={fas === "spelar" && !annaAktiv} />
            <StudioPerson rolle={ROLLER[1]} isSpeaking={peterAktiv} dimmed={fas === "spelar" && !peterAktiv} />
          </div>

          <div style={{ padding: "14px 16px", borderTop: "1px solid #1a1a1a", minHeight: "76px" }}>
            {fas === "laddar" && (
              <p style={{ margin: 0, fontSize: "13px", color: "#666", fontStyle: "italic" }}>Skapar studiosamtal…</p>
            )}
            {fas === "fel" && (
              <p style={{ margin: 0, fontSize: "13px", color: "#e05050" }}>{fel}</p>
            )}
            {(fas === "spelar" || fas === "klar") && turn && (
              <>
                <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#ccc", lineHeight: 1.6 }}>
                  <span style={{ color: AGENTER[aktivRolle.agent]?.farg, fontWeight: 700 }}>{aktivRolle.namn}: </span>
                  {turn.text}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ flex: 1 }}>
                    <WaveformBar isSpeaking={fas === "spelar"} isThinking={false} farg={AGENTER[aktivRolle.agent]?.farg} />
                  </div>
                  <span style={{ fontSize: "10px", color: "#555", fontFamily: "monospace", flexShrink: 0 }}>
                    {Math.min(activeIdx + 1, turns.length)}/{turns.length}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            width: "100%", marginTop: "10px", padding: "10px",
            borderRadius: "6px", fontSize: "13px", fontFamily: "Georgia, serif",
            border: "1px solid #5a2020", background: "#1a0808", color: "#e05050",
            cursor: "pointer", letterSpacing: "0.06em", boxSizing: "border-box",
          }}
        >
          ⏹ Stäng
        </button>
      </div>
    </div>
  );
}
