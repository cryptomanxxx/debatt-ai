"use client";
import { useState, useEffect, useRef } from "react";

const C = {
  bg: "#0a0a0a", surface: "#0f0f0f", border: "#1e1e1e",
  border2: "#2a2a2a", text: "#f0ede6", textMuted: "#666660",
  accent: "#e8d5a3", green: "#4ade80", red: "#f87171",
  blue: "#60a5fa", purple: "#e879f9", emerald: "#34d399",
};

const ALLA_AGENTER = [
  "Nationalekonom","Miljöaktivist","Teknikoptimist","Konservativ debattör",
  "Jurist","Journalist","Filosof","Läkare","Psykolog","Historiker",
  "Sociolog","Kryptoanalytiker","Den hungriga","Mamman","Den sura",
  "Den trötta","Den stressade","Den lugna","Pensionären","Tonåringen",
  "Den nostalgiske","Hypokondrikern","Optimisten","Den rike",
];

const EXEMPELAMNEN = [
  "Bör Sverige bygga mer kärnkraft?",
  "Är sociala medier skadliga för ungdomar?",
  "Ska Sverige gå med i euron?",
  "Bör köttkonsumtion beskattas hårdare?",
  "Är fyra dagars arbetsvecka en bra idé?",
];

const AGENT_FARGER = {
  "Nationalekonom": "#60a5fa", "Miljöaktivist": "#4ade80",
  "Teknikoptimist": "#e879f9", "Konservativ debattör": "#fb923c",
  "Jurist": "#a78bfa", "Journalist": "#f59e0b", "Filosof": "#818cf8",
  "Läkare": "#34d399", "Psykolog": "#f472b6", "Historiker": "#d97706",
  "Sociolog": "#10b981", "Kryptoanalytiker": "#fbbf24",
  "Den hungriga": "#ef4444", "Mamman": "#ec4899", "Den sura": "#dc2626",
  "Den trötta": "#6b7280", "Den stressade": "#f97316", "Den lugna": "#06b6d4",
  "Pensionären": "#84cc16", "Tonåringen": "#a3e635", "Den nostalgiske": "#92400e",
  "Hypokondrikern": "#7c3aed", "Optimisten": "#fcd34d", "Den rike": "#d4af37",
};

function AgentChip({ agent, selected, onClick }) {
  const color = AGENT_FARGER[agent] || C.textMuted;
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: "12px", padding: "6px 12px", borderRadius: "20px",
        cursor: "pointer", fontFamily: "Georgia, serif",
        border: `1px solid ${selected ? color + "80" : C.border2}`,
        background: selected ? color + "18" : "transparent",
        color: selected ? color : C.textMuted,
        transition: "all 0.15s",
        touchAction: "manipulation",
        minHeight: "34px",
      }}
    >
      {agent}
    </button>
  );
}

function LoadingDots() {
  const [dots, setDots] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDots(d => (d + 1) % 4), 500);
    return () => clearInterval(t);
  }, []);
  return <span>{".".repeat(dots)}</span>;
}

function DebattInlagg({ inlagg, visible }) {
  const color = AGENT_FARGER[inlagg.agent] || C.textMuted;
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border2}`,
      borderLeft: `3px solid ${color}`,
      borderRadius: "8px",
      padding: "20px",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(8px)",
      transition: "opacity 0.3s, transform 0.3s",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
        <span style={{
          fontSize: "10px", color: C.textMuted, fontFamily: "monospace",
          background: "#050505", border: `1px solid ${C.border}`,
          borderRadius: "4px", padding: "2px 8px",
        }}>
          #{inlagg.ordning}
        </span>
        <span style={{ fontSize: "14px", fontWeight: 700, color, fontFamily: "monospace" }}>
          {inlagg.agent}
        </span>
      </div>
      <p style={{ fontSize: "15px", color: C.text, lineHeight: 1.75, margin: 0 }}>
        {inlagg.text}
      </p>
    </div>
  );
}

export default function DebattPlaygroundPage() {
  const [amne, setAmne]               = useState("");
  const [lang, setLang]               = useState("sv");
  const [antalInlagg, setAntal]       = useState(6);
  const [valda, setValda]             = useState([]);
  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState(null);
  const [error, setError]             = useState("");
  const [elapsed, setElapsed]         = useState(0);
  const [visibleIdx, setVisibleIdx]   = useState(-1);
  const [showRaw, setShowRaw]         = useState(false);
  const timerRef = useRef(null);
  const resultRef = useRef(null);

  const toggleAgent = (a) => {
    setValda(prev => {
      if (prev.includes(a)) return prev.filter(x => x !== a);
      if (prev.length >= 4) return prev;
      return [...prev, a];
    });
  };

  useEffect(() => {
    if (!loading) { clearInterval(timerRef.current); setElapsed(0); return; }
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [loading]);

  useEffect(() => {
    if (!result) { setVisibleIdx(-1); return; }
    let idx = 0;
    const show = () => {
      setVisibleIdx(i => i + 1);
      idx++;
      if (idx < result.inlagg.length) setTimeout(show, 200);
    };
    setTimeout(show, 100);
  }, [result]);

  async function startaDebatt() {
    if (!amne.trim() || loading) return;
    setLoading(true);
    setError("");
    setResult(null);
    setVisibleIdx(-1);
    try {
      const body = { amne: amne.trim(), lang, antal_inlagg: antalInlagg };
      if (valda.length >= 2) body.agenter = valda;
      const res = await fetch("/api/debatt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Något gick fel."); return; }
      setResult(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    } catch { setError("Nätverksfel. Kontrollera anslutningen och försök igen."); }
    finally { setLoading(false); }
  }

  const curlCmd = `curl -X POST https://www.debatt-ai.se/api/debatt \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({
    amne: amne || "Bör Sverige bygga mer kärnkraft?",
    ...(valda.length >= 2 ? { agenter: valda } : {}),
    antal_inlagg: antalInlagg,
    lang,
  })}'`;

  const kanSkicka = amne.trim().length > 0 && (valda.length === 0 || valda.length >= 2);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "Georgia, serif" }}>
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "40px 20px 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: "40px" }}>
          <p style={{ fontSize: "11px", color: C.emerald, letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 10px", fontFamily: "monospace" }}>
            DEBATT-AI / Debatt API
          </p>
          <h1 style={{ fontSize: "32px", fontWeight: 400, margin: "0 0 14px", color: C.text, lineHeight: 1.2 }}>
            Debatt Playground
          </h1>
          <p style={{ fontSize: "15px", color: C.textMuted, lineHeight: 1.7, margin: "0 0 20px", maxWidth: "560px" }}>
            Välj ett ämne, välj agenter och starta en fullständig AI-debatt. Allt returneras som JSON via{" "}
            <code style={{ color: C.accent, fontFamily: "monospace", fontSize: "13px" }}>POST /api/debatt</code>.
          </p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <a href="/api/debatt" target="_blank" style={{ fontSize: "12px", color: C.accent, fontFamily: "monospace", textDecoration: "none", border: `1px solid ${C.border2}`, borderRadius: "4px", padding: "6px 12px" }}>
              GET /api/debatt — dokumentation →
            </a>
            <a href="/chatt" style={{ fontSize: "12px", color: C.textMuted, fontFamily: "monospace", textDecoration: "none", border: `1px solid ${C.border}`, borderRadius: "4px", padding: "6px 12px" }}>
              Direktdebatt (live-streaming) →
            </a>
          </div>
        </div>

        {/* Formulär */}
        <div style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: "10px", padding: "28px", marginBottom: "32px" }}>

          {/* Ämne */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "monospace", display: "block", marginBottom: "8px" }}>
              Debattämne *
            </label>
            <textarea
              value={amne}
              onChange={e => setAmne(e.target.value)}
              placeholder={lang === "sv" ? "Skriv ett debattämne…" : "Enter a debate topic…"}
              rows={3}
              style={{
                width: "100%", background: "#050505", border: `1px solid ${C.border2}`,
                borderRadius: "6px", color: C.text, fontFamily: "Georgia, serif",
                fontSize: "15px", padding: "14px 16px", resize: "vertical",
                outline: "none", boxSizing: "border-box", lineHeight: 1.6,
              }}
            />
            {/* Exempelämnen */}
            <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
              {EXEMPELAMNEN.map(ex => (
                <button
                  key={ex}
                  onClick={() => setAmne(ex)}
                  style={{
                    fontSize: "11px", color: C.textMuted, background: "transparent",
                    border: `1px solid ${C.border}`, borderRadius: "16px",
                    padding: "4px 10px", cursor: "pointer", fontFamily: "Georgia, serif",
                    touchAction: "manipulation",
                  }}
                >
                  {ex.length > 38 ? ex.slice(0, 38) + "…" : ex}
                </button>
              ))}
            </div>
          </div>

          {/* Antal inlägg + Språk */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
            <div>
              <label style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "monospace", display: "block", marginBottom: "8px" }}>
                Antal inlägg: <span style={{ color: C.accent }}>{antalInlagg}</span>
              </label>
              <input
                type="range" min={2} max={10} step={1}
                value={antalInlagg}
                onChange={e => setAntal(Number(e.target.value))}
                style={{ width: "100%", accentColor: C.accent, cursor: "pointer" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: C.textMuted, fontFamily: "monospace", marginTop: "4px" }}>
                <span>2 (snabb)</span>
                <span>10 (lång)</span>
              </div>
            </div>
            <div>
              <label style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "monospace", display: "block", marginBottom: "8px" }}>
                Språk
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                {[["sv", "🇸🇪 Svenska"], ["en", "🇬🇧 English"]].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setLang(val)}
                    style={{
                      flex: 1, padding: "10px 8px", borderRadius: "6px",
                      border: `1px solid ${lang === val ? C.accent + "60" : C.border}`,
                      background: lang === val ? C.accent + "15" : "transparent",
                      color: lang === val ? C.accent : C.textMuted,
                      fontSize: "12px", cursor: "pointer", fontFamily: "Georgia, serif",
                      touchAction: "manipulation", minHeight: "42px",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Agentval */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <label style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "monospace" }}>
                Agenter{" "}
                {valda.length > 0
                  ? <span style={{ color: valda.length >= 2 ? C.emerald : C.accent }}>({valda.length}/4 valda)</span>
                  : <span>(3 slumpmässiga)</span>
                }
              </label>
              {valda.length > 0 && (
                <button
                  onClick={() => setValda([])}
                  style={{ fontSize: "11px", color: C.textMuted, background: "transparent", border: "none", cursor: "pointer", padding: 0, fontFamily: "monospace" }}
                >
                  Återställ
                </button>
              )}
            </div>
            {valda.length === 1 && (
              <p style={{ fontSize: "11px", color: C.accent, fontFamily: "monospace", margin: "0 0 8px" }}>
                Välj minst 2 agenter (eller 0 för slumpmässigt urval)
              </p>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {ALLA_AGENTER.map(a => (
                <AgentChip
                  key={a}
                  agent={a}
                  selected={valda.includes(a)}
                  onClick={() => toggleAgent(a)}
                />
              ))}
            </div>
          </div>

          {/* Skicka-knapp */}
          <button
            onClick={startaDebatt}
            disabled={loading || !kanSkicka}
            style={{
              width: "100%", padding: "16px", borderRadius: "8px",
              background: (loading || !kanSkicka) ? C.surface : C.accent,
              color: (loading || !kanSkicka) ? C.textMuted : "#0a0a0a",
              border: `1px solid ${(loading || !kanSkicka) ? C.border2 : "transparent"}`,
              fontSize: "16px", fontWeight: 700, cursor: (loading || !kanSkicka) ? "default" : "pointer",
              fontFamily: "Georgia, serif", opacity: !kanSkicka ? 0.5 : 1,
              touchAction: "manipulation", minHeight: "52px",
              transition: "all 0.2s",
            }}
          >
            {loading ? (
              <span>
                Debatten pågår ({elapsed}s)<LoadingDots />
              </span>
            ) : "Starta debatt →"}
          </button>

          {loading && (
            <p style={{ fontSize: "12px", color: C.textMuted, fontFamily: "monospace", margin: "10px 0 0", textAlign: "center" }}>
              Varje inlägg genereras sekventiellt — {antalInlagg} inlägg tar ca {antalInlagg * 2}–{antalInlagg * 4}s
            </p>
          )}

          {error && (
            <div style={{ marginTop: "12px", background: C.red + "10", border: `1px solid ${C.red + "40"}`, borderRadius: "6px", padding: "12px 16px" }}>
              <p style={{ color: C.red, fontSize: "13px", margin: 0, fontFamily: "monospace" }}>{error}</p>
            </div>
          )}

          {/* cURL */}
          <div style={{ marginTop: "20px" }}>
            <p style={{ fontSize: "10px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "monospace", margin: "0 0 6px" }}>
              cURL — testa från terminalen
            </p>
            <pre style={{
              background: "#050505", border: `1px solid ${C.border}`, borderRadius: "6px",
              padding: "12px 14px", fontSize: "11px", color: "#555", margin: 0,
              fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all",
              overflowX: "auto",
            }}>
              {curlCmd}
            </pre>
          </div>
        </div>

        {/* Resultat */}
        {result && (
          <div ref={resultRef}>
            {/* Metadata */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 400, margin: "0 0 4px", color: C.text }}>
                  {result.amne}
                </h2>
                <p style={{ fontSize: "12px", color: C.textMuted, fontFamily: "monospace", margin: 0 }}>
                  {result.agenter.join(" · ")} · {result.inlagg.length} inlägg · {result.latency_ms}ms
                </p>
              </div>
              <button
                onClick={() => setShowRaw(s => !s)}
                style={{
                  fontSize: "11px", color: C.textMuted, background: "transparent",
                  border: `1px solid ${C.border2}`, borderRadius: "4px",
                  padding: "6px 12px", cursor: "pointer", fontFamily: "monospace",
                  touchAction: "manipulation",
                }}
              >
                {showRaw ? "Dölj JSON" : "Visa JSON"}
              </button>
            </div>

            {showRaw && (
              <div style={{ marginBottom: "24px" }}>
                <pre style={{
                  background: "#050505", border: `1px solid ${C.border}`, borderRadius: "8px",
                  padding: "20px", fontSize: "11px", lineHeight: 1.6, color: "#666",
                  overflowX: "auto", margin: 0, fontFamily: "monospace",
                  whiteSpace: "pre-wrap", wordBreak: "break-word",
                }}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}

            {/* Inlägg */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
              {result.inlagg.map((inlagg, i) => (
                <DebattInlagg key={i} inlagg={inlagg} visible={i <= visibleIdx} />
              ))}
            </div>

            {/* Summering */}
            {visibleIdx >= result.inlagg.length - 1 && (
              <div style={{
                background: "#050505",
                border: `1px solid ${C.border2}`,
                borderRadius: "8px",
                padding: "24px",
                opacity: 1,
                transition: "opacity 0.5s",
              }}>
                <p style={{ fontSize: "10px", color: C.textMuted, letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "monospace", margin: "0 0 12px" }}>
                  Summering — neutral moderator
                </p>
                <p style={{ fontSize: "15px", color: C.textMuted, lineHeight: 1.8, margin: 0, fontStyle: "italic" }}>
                  {result.summering}
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
