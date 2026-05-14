"use client";
import { useState } from "react";

export const metadata = undefined; // client component

const C = {
  bg: "#0a0a0a", surface: "#0f0f0f", border: "#1e1e1e",
  border2: "#2a2a2a", text: "#f0ede6", textMuted: "#666660",
  accent: "#e8d5a3", green: "#4ade80", red: "#f87171",
  blue: "#60a5fa", purple: "#e879f9",
};

const ALLA_AGENTER = [
  "Nationalekonom","Miljöaktivist","Teknikoptimist","Konservativ debattör",
  "Jurist","Journalist","Filosof","Läkare","Psykolog","Historiker",
  "Sociolog","Kryptoanalytiker","Den hungriga","Mamman","Den sura",
  "Den trötta","Den stressade","Den lugna","Pensionären","Tonåringen",
  "Den nostalgiske","Hypokondrikern","Optimisten","Den rike",
];

const EXEMPEL = [
  "Ska jag investera i Bitcoin nu?",
  "Bör Sverige återinföra kärnkraft?",
  "Är det rätt att börja ett företag under lågkonjunktur?",
  "Should AI development be regulated by governments?",
];

function stanceColor(stance) {
  if (stance === "positiv") return C.green;
  if (stance === "negativ") return C.red;
  return C.textMuted;
}

function recColor(rec) {
  if (rec === "positiv") return C.green;
  if (rec === "negativ") return C.red;
  if (rec === "neutral") return C.textMuted;
  return C.blue;
}

function JsonView({ data }) {
  const json = JSON.stringify(data, null, 2);
  return (
    <pre style={{
      background: "#050505",
      border: `1px solid ${C.border}`,
      borderRadius: "8px",
      padding: "20px",
      fontSize: "12px",
      lineHeight: 1.7,
      color: "#a0a09a",
      overflowX: "auto",
      margin: 0,
      fontFamily: "monospace",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
    }}>
      {json}
    </pre>
  );
}

export default function BeslutPage() {
  const [question, setQuestion]       = useState("");
  const [lang, setLang]               = useState("sv");
  const [apiKey, setApiKey]           = useState("");
  const [selectedAgents, setSelected] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState(null);
  const [error, setError]             = useState("");
  const [showRaw, setShowRaw]         = useState(false);

  const toggleAgent = (a) =>
    setSelected(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  async function submit() {
    if (!question.trim() || loading) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const headers = { "Content-Type": "application/json" };
      if (apiKey.trim()) headers["X-API-Key"] = apiKey.trim();

      const body = { question: question.trim(), lang };
      if (selectedAgents.length > 0) body.agents = selectedAgents;

      const res = await fetch("/api/beslut", { method: "POST", headers, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Något gick fel."); return; }
      setResult(data);
    } catch { setError("Nätverksfel. Försök igen."); }
    finally { setLoading(false); }
  }

  const curlCmd = `curl -X POST https://www.debatt-ai.se/api/beslut \\
  -H "Content-Type: application/json"${apiKey ? ` \\\n  -H "X-API-Key: ${apiKey}"` : ""} \\
  -d '${JSON.stringify({ question: question || "Din fråga här", lang, ...(selectedAgents.length ? { agents: selectedAgents } : {}) })}'`;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "Georgia, serif" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "48px 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: "48px" }}>
          <p style={{ fontSize: "11px", color: C.purple, letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 12px", fontFamily: "monospace" }}>
            DEBATT-AI / Decision API
          </p>
          <h1 style={{ fontSize: "36px", fontWeight: 400, margin: "0 0 16px", color: C.text }}>
            API Playground
          </h1>
          <p style={{ fontSize: "16px", color: C.textMuted, lineHeight: 1.7, margin: "0 0 24px", maxWidth: "600px" }}>
            Testa Decision API:et interaktivt. Ställ en fråga och få strukturerade svar från 5 AI-agenter med olika världsbilder — designat för AI-companions och beslutssystem.
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <a href="/api/beslut" target="_blank" style={{ fontSize: "13px", color: C.accent, fontFamily: "monospace", textDecoration: "none", border: `1px solid ${C.border2}`, borderRadius: "4px", padding: "6px 14px" }}>
              GET /api/beslut — dokumentation →
            </a>
            <a href="/om" style={{ fontSize: "13px", color: C.textMuted, fontFamily: "monospace", textDecoration: "none", border: `1px solid ${C.border}`, borderRadius: "4px", padding: "6px 14px" }}>
              Om plattformen →
            </a>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", alignItems: "start" }} className="beslut-grid">

          {/* Vänster: formulär */}
          <div>
            {/* Fråga */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "monospace", display: "block", marginBottom: "8px" }}>
                Fråga *
              </label>
              <textarea
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) submit(); }}
                placeholder="Skriv din fråga här… (Ctrl+Enter för att skicka)"
                rows={4}
                style={{ width: "100%", background: C.surface, border: `1px solid ${C.border2}`, borderRadius: "6px", color: C.text, fontFamily: "Georgia, serif", fontSize: "15px", padding: "14px 16px", resize: "vertical", outline: "none", boxSizing: "border-box" }}
              />
              <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                {EXEMPEL.map(ex => (
                  <button key={ex} onClick={() => setQuestion(ex)} style={{ fontSize: "11px", color: C.textMuted, background: "transparent", border: `1px solid ${C.border}`, borderRadius: "20px", padding: "3px 10px", cursor: "pointer", fontFamily: "Georgia, serif" }}>
                    {ex.length > 35 ? ex.slice(0, 35) + "…" : ex}
                  </button>
                ))}
              </div>
            </div>

            {/* Språk + API-nyckel */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
              <div>
                <label style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "monospace", display: "block", marginBottom: "8px" }}>
                  Språk
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[["sv", "Svenska"], ["en", "English"]].map(([val, label]) => (
                    <button key={val} onClick={() => setLang(val)} style={{
                      flex: 1, padding: "8px", borderRadius: "6px",
                      border: `1px solid ${lang === val ? C.accent + "60" : C.border}`,
                      background: lang === val ? C.accent + "12" : "transparent",
                      color: lang === val ? C.accent : C.textMuted,
                      fontSize: "13px", cursor: "pointer", fontFamily: "Georgia, serif",
                    }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "monospace", display: "block", marginBottom: "8px" }}>
                  API-nyckel (valfri)
                </label>
                <input
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="dai_…"
                  style={{ width: "100%", background: C.surface, border: `1px solid ${C.border2}`, borderRadius: "6px", color: C.text, fontFamily: "monospace", fontSize: "12px", padding: "8px 12px", outline: "none", boxSizing: "border-box" }}
                />
              </div>
            </div>

            {/* Agent-urval */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "monospace", display: "block", marginBottom: "8px" }}>
                Agenter {selectedAgents.length > 0 ? `(${selectedAgents.length} valda)` : "(auto-urval)"}
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {ALLA_AGENTER.map(a => (
                  <button key={a} onClick={() => toggleAgent(a)} style={{
                    fontSize: "11px", padding: "4px 10px", borderRadius: "20px", cursor: "pointer",
                    border: `1px solid ${selectedAgents.includes(a) ? C.purple + "60" : C.border}`,
                    background: selectedAgents.includes(a) ? C.purple + "15" : "transparent",
                    color: selectedAgents.includes(a) ? C.purple : C.textMuted,
                    fontFamily: "Georgia, serif",
                  }}>
                    {a}
                  </button>
                ))}
              </div>
              {selectedAgents.length > 0 && (
                <button onClick={() => setSelected([])} style={{ marginTop: "8px", fontSize: "11px", color: C.textMuted, background: "transparent", border: "none", cursor: "pointer", padding: 0, fontFamily: "Georgia, serif" }}>
                  Återställ till auto-urval
                </button>
              )}
            </div>

            {/* Skicka */}
            <button onClick={submit} disabled={loading || !question.trim()} style={{
              width: "100%", padding: "14px", background: loading ? C.surface : C.accent,
              color: loading ? C.textMuted : "#0a0a0a", border: "none", borderRadius: "6px",
              fontSize: "15px", fontWeight: 700, cursor: (loading || !question.trim()) ? "default" : "pointer",
              fontFamily: "Georgia, serif", opacity: !question.trim() ? 0.5 : 1, marginBottom: "20px",
            }}>
              {loading ? "Väntar på agenter…" : "Skicka →"}
            </button>

            {error && <p style={{ color: C.red, fontSize: "13px", margin: "0 0 16px" }}>{error}</p>}

            {/* cURL-snippet */}
            <div>
              <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "monospace", margin: "0 0 8px" }}>
                cURL
              </p>
              <pre style={{ background: "#050505", border: `1px solid ${C.border}`, borderRadius: "6px", padding: "14px 16px", fontSize: "11px", color: "#666", overflowX: "auto", margin: 0, fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {curlCmd}
              </pre>
            </div>
          </div>

          {/* Höger: resultat */}
          <div>
            {result ? (
              <>
                {/* Consensus-kort */}
                <div style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: "8px", padding: "24px", marginBottom: "16px" }}>
                  <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "monospace", margin: "0 0 16px" }}>
                    Konsensus
                  </p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "40px", fontWeight: 400, color: recColor(result.consensus.recommendation) }}>
                      {Math.round(result.consensus.probability * 100)}%
                    </span>
                    <div>
                      <span style={{ fontSize: "16px", color: recColor(result.consensus.recommendation), textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace" }}>
                        {result.consensus.recommendation}
                      </span>
                      <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                        <span style={{ fontSize: "11px", color: C.textMuted, fontFamily: "monospace" }}>
                          confidence: {result.consensus.confidence}
                        </span>
                        <span style={{ fontSize: "11px", color: C.textMuted, fontFamily: "monospace" }}>
                          disagreement: {result.consensus.disagreement}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Per-agent */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {result.agents.map(a => (
                      <div key={a.agent} style={{ borderTop: `1px solid ${C.border}`, paddingTop: "10px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <span style={{ fontSize: "12px", color: stanceColor(a.stance), fontFamily: "monospace", fontWeight: 700 }}>
                            {a.agent}
                          </span>
                          <span style={{ fontSize: "11px", color: stanceColor(a.stance), fontFamily: "monospace" }}>
                            {a.stance} · {a.probability}%
                          </span>
                        </div>
                        <p style={{ fontSize: "13px", color: C.textMuted, lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>
                          {a.reasoning}
                        </p>
                      </div>
                    ))}
                  </div>

                  <p style={{ fontSize: "11px", color: "#333", fontFamily: "monospace", margin: "16px 0 0" }}>
                    {result.model} · {result.latency_ms}ms
                  </p>
                </div>

                {/* Raw JSON */}
                <button onClick={() => setShowRaw(r => !r)} style={{ fontSize: "12px", color: C.textMuted, background: "transparent", border: `1px solid ${C.border}`, borderRadius: "4px", padding: "6px 14px", cursor: "pointer", fontFamily: "monospace", marginBottom: "8px" }}>
                  {showRaw ? "Dölj" : "Visa"} raw JSON
                </button>
                {showRaw && <JsonView data={result} />}
              </>
            ) : (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "40px 24px", textAlign: "center" }}>
                <p style={{ fontSize: "13px", color: C.textMuted, margin: 0, fontFamily: "monospace" }}>
                  Svaret visas här
                </p>
              </div>
            )}

            {/* Rate limits */}
            <div style={{ marginTop: "24px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "20px" }}>
              <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "monospace", margin: "0 0 12px" }}>
                Rate limits
              </p>
              {[
                ["Fri tier (utan nyckel)", "10 req/timme per IP"],
                ["API-nyckel", "100 req/timme (standard)"],
              ].map(([tier, limit]) => (
                <div key={tier} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "13px", color: C.textMuted }}>{tier}</span>
                  <span style={{ fontSize: "12px", color: C.accent, fontFamily: "monospace" }}>{limit}</span>
                </div>
              ))}
              <p style={{ fontSize: "12px", color: "#444", margin: "12px 0 0", fontStyle: "italic" }}>
                Vill du ha högre gränser? Kontakta oss via formuläret på startsidan.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 720px) {
          .beslut-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
