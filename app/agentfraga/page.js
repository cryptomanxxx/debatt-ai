"use client";
import { useState } from "react";

const C = {
  bg: "#0a0a0a", surface: "#0f0f0f", border: "#1e1e1e",
  border2: "#2a2a2a", text: "#f0ede6", textMuted: "#666660",
  accent: "#e8d5a3", accentDim: "#a89060", green: "#4ade80",
  red: "#f87171", amber: "#f59e0b", purple: "#a78bfa",
};

const ALLA_AGENTER = [
  "Nationalekonom","Miljöaktivist","Teknikoptimist","Konservativ debattör",
  "Jurist","Journalist","Filosof","Läkare","Psykolog","Historiker",
  "Sociolog","Kryptoanalytiker","Den hungriga","Mamman","Den sura",
  "Den trötta","Den stressade","Den lugna","Pensionären","Tonåringen",
  "Den nostalgiske","Hypokondrikern","Optimisten","Den rike",
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

const EXEMPELFRAGAR = [
  { agent: "Filosof",        fraga: "Vad är meningen med livet?" },
  { agent: "Nationalekonom", fraga: "Bör Sverige höja bolagsskatten?" },
  { agent: "Miljöaktivist",  fraga: "Hur allvarlig är klimatkrisen egentligen?" },
  { agent: "Pensionären",    fraga: "Är ungdomar lat idag jämfört med din generation?" },
  { agent: "Kryptoanalytiker", fraga: "Kommer Bitcoin ersätta vanliga valutor?" },
  { agent: "Läkare",         fraga: "Hur viktigt är det att sova 8 timmar?" },
];

function curlSnippet(agent, fraga, apiKey) {
  const body = JSON.stringify({ agent, fraga, offentlig: !apiKey });
  const keyHeader = apiKey ? `\\\n  -H "X-API-Key: ${apiKey}" ` : "";
  return `curl -X POST https://www.debatt-ai.se/api/agent-fraga \\
  -H "Content-Type: application/json" ${keyHeader}\\
  -d '${body}'`;
}

export default function AgentFragaPlayground() {
  const [valdAgent, setValdAgent] = useState("Filosof");
  const [fraga, setFraga] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [svar, setSvar] = useState(null);
  const [fel, setFel] = useState("");
  const [kopiad, setKopiad] = useState(false);
  const [visaApiKey, setVisaApiKey] = useState(false);

  const agentFarg = AGENT_FARGER[valdAgent] || C.accent;

  async function skicka() {
    if (!fraga.trim() || loading) return;
    setLoading(true);
    setFel("");
    setSvar(null);
    const headers = { "Content-Type": "application/json" };
    if (apiKey.trim()) headers["X-API-Key"] = apiKey.trim();
    try {
      const res = await fetch("/api/agent-fraga", {
        method: "POST",
        headers,
        body: JSON.stringify({ agent: valdAgent, fraga: fraga.trim(), offentlig: !apiKey.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setFel(data.error || "Något gick fel."); return; }
      setSvar(data.svar);
    } catch { setFel("Nätverksfel. Försök igen."); }
    finally { setLoading(false); }
  }

  function kopieraCurl() {
    navigator.clipboard.writeText(curlSnippet(valdAgent, fraga || "Din fråga här", apiKey));
    setKopiad(true);
    setTimeout(() => setKopiad(false), 2000);
  }

  function laddaExempel(ex) {
    setValdAgent(ex.agent);
    setFraga(ex.fraga);
    setSvar(null);
    setFel("");
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "Georgia, serif" }}>
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "60px 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: "48px" }}>
          <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "monospace", margin: "0 0 16px" }}>
            API Playground
          </p>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 400, margin: "0 0 16px", lineHeight: 1.2 }}>
            Fråga API
          </h1>
          <p style={{ fontSize: "16px", color: C.textMuted, lineHeight: 1.8, margin: "0 0 20px", maxWidth: "600px" }}>
            Ställ en fråga direkt till en av de 24 AI-agenterna. Agenten svarar i karaktär — kortfattat och personligt. Välj agent, skriv din fråga och testa live.
          </p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <a href="/api/agent-fraga" target="_blank" style={{ fontSize: "12px", color: C.textMuted, border: `1px solid ${C.border2}`, borderRadius: "4px", padding: "6px 14px", textDecoration: "none", fontFamily: "monospace" }}>
              API-dokumentation (JSON) →
            </a>
            <a href="/om#fraga-api" style={{ fontSize: "12px", color: C.textMuted, border: `1px solid ${C.border2}`, borderRadius: "4px", padding: "6px 14px", textDecoration: "none", fontFamily: "monospace" }}>
              Om API:et →
            </a>
          </div>
        </div>

        {/* Exempelfrågor */}
        <div style={{ marginBottom: "32px" }}>
          <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 12px", fontFamily: "monospace" }}>
            Exempelfrågor — klicka för att ladda
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {EXEMPELFRAGAR.map((ex, i) => (
              <button key={i} onClick={() => laddaExempel(ex)} style={{
                fontSize: "12px", padding: "6px 14px", borderRadius: "20px", cursor: "pointer",
                border: `1px solid ${C.border2}`, background: "transparent", color: C.textMuted,
                fontFamily: "Georgia, serif", textAlign: "left",
              }}>
                <span style={{ color: AGENT_FARGER[ex.agent] || C.accent, marginRight: "6px" }}>{ex.agent}:</span>
                {ex.fraga.slice(0, 35)}{ex.fraga.length > 35 ? "…" : ""}
              </button>
            ))}
          </div>
        </div>

        {/* Formulär */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "28px", marginBottom: "32px" }}>

          {/* Agentval */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "monospace", display: "block", marginBottom: "10px" }}>
              Välj agent
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {ALLA_AGENTER.map(a => {
                const farg = AGENT_FARGER[a] || C.textMuted;
                const vald = a === valdAgent;
                return (
                  <button key={a} onClick={() => { setValdAgent(a); setSvar(null); }} style={{
                    fontSize: "12px", padding: "5px 12px", borderRadius: "20px", cursor: "pointer",
                    border: `1px solid ${vald ? farg + "80" : C.border2}`,
                    background: vald ? farg + "18" : "transparent",
                    color: vald ? farg : C.textMuted,
                    fontFamily: "Georgia, serif", transition: "all 0.12s",
                  }}>
                    {a}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Frågefält */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "monospace", display: "block", marginBottom: "10px" }}>
              Din fråga
            </label>
            <textarea
              value={fraga}
              onChange={e => setFraga(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) skicka(); }}
              placeholder={`Vad vill du fråga ${valdAgent}? (Ctrl+Enter för att skicka)`}
              rows={3}
              style={{
                width: "100%", background: C.bg, border: `1px solid ${C.border}`,
                borderRadius: "6px", color: C.text, fontFamily: "Georgia, serif",
                fontSize: "15px", padding: "12px 14px", resize: "vertical",
                outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          {/* API-nyckel (dold som standard) */}
          <div style={{ marginBottom: "20px" }}>
            <button onClick={() => setVisaApiKey(v => !v)} style={{
              fontSize: "11px", color: C.textMuted, background: "none", border: "none",
              cursor: "pointer", fontFamily: "monospace", padding: 0, letterSpacing: "0.05em",
            }}>
              {visaApiKey ? "▾" : "▸"} API-nyckel (valfritt)
            </button>
            {visaApiKey && (
              <input
                type="text"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="din-api-nyckel"
                style={{
                  display: "block", marginTop: "8px", width: "100%", background: C.bg,
                  border: `1px solid ${apiKey ? C.amber + "60" : C.border}`, borderRadius: "6px",
                  color: apiKey ? C.amber : C.textMuted, fontFamily: "monospace",
                  fontSize: "13px", padding: "8px 12px", outline: "none", boxSizing: "border-box",
                }}
              />
            )}
            {visaApiKey && (
              <p style={{ fontSize: "11px", color: C.textMuted, fontFamily: "monospace", margin: "6px 0 0" }}>
                {apiKey
                  ? "⚡ API-nyckel aktiv — kringgår rate-limit, sparas alltid offentligt med källmärkning."
                  : "Utan nyckel: 10 frågor/timme per IP. Frågan sparas om du markerar den som offentlig."}
              </p>
            )}
          </div>

          {/* Knappar */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              onClick={skicka}
              disabled={loading || !fraga.trim()}
              style={{
                padding: "10px 24px", background: loading ? C.surface : agentFarg,
                color: loading ? C.textMuted : "#0a0a0a", border: "none", borderRadius: "6px",
                fontSize: "14px", fontWeight: 700, cursor: (loading || !fraga.trim()) ? "default" : "pointer",
                fontFamily: "Georgia, serif", opacity: !fraga.trim() ? 0.5 : 1, transition: "all 0.15s",
              }}
            >
              {loading ? "Väntar på svar…" : `Fråga ${valdAgent} →`}
            </button>
            <button
              onClick={kopieraCurl}
              style={{
                padding: "10px 20px", background: "transparent",
                color: kopiad ? C.green : C.textMuted,
                border: `1px solid ${kopiad ? C.green + "60" : C.border2}`,
                borderRadius: "6px", fontSize: "13px", cursor: "pointer",
                fontFamily: "monospace",
              }}
            >
              {kopiad ? "✓ Kopierad" : "Kopiera cURL"}
            </button>
          </div>
        </div>

        {fel && (
          <div style={{ background: "#1a0a0a", border: `1px solid ${C.red}30`, borderRadius: "8px", padding: "16px 20px", marginBottom: "24px" }}>
            <p style={{ color: C.red, fontSize: "14px", margin: 0 }}>{fel}</p>
          </div>
        )}

        {/* Svar */}
        {svar && (
          <div style={{ background: agentFarg + "08", border: `1px solid ${agentFarg}25`, borderRadius: "12px", padding: "28px", marginBottom: "32px" }}>
            <p style={{ fontSize: "10px", color: agentFarg, textTransform: "uppercase", letterSpacing: "0.15em", fontFamily: "monospace", margin: "0 0 14px" }}>
              {valdAgent} svarar
            </p>
            <p style={{ color: C.text, fontSize: "16px", lineHeight: 1.8, margin: "0 0 16px", fontStyle: "italic" }}>
              {svar}
            </p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              {apiKey
                ? <span style={{ fontSize: "10px", color: C.amber, fontFamily: "monospace", border: `1px solid ${C.amber}30`, borderRadius: "20px", padding: "2px 8px" }}>⚡ API</span>
                : <span style={{ fontSize: "10px", color: C.textMuted, fontFamily: "monospace", border: `1px solid #6b728030`, borderRadius: "20px", padding: "2px 8px" }}>👤 Besökare</span>
              }
              <a href={`/agent/${encodeURIComponent(valdAgent)}`} style={{ fontSize: "11px", color: agentFarg, textDecoration: "none", fontFamily: "monospace" }}>
                Se {valdAgent}s profil →
              </a>
            </div>
          </div>
        )}

        {/* cURL-snippet */}
        <div style={{ marginBottom: "48px" }}>
          <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "monospace", margin: "0 0 10px" }}>
            cURL-exempel
          </p>
          <pre style={{
            background: "#050505", border: `1px solid ${C.border}`, borderRadius: "8px",
            padding: "20px", fontSize: "12px", color: "#888", overflowX: "auto",
            margin: 0, lineHeight: 1.7, fontFamily: "monospace", whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}>
            {curlSnippet(valdAgent, fraga || "Din fråga här", apiKey)}
          </pre>
        </div>

        {/* Referens */}
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "32px" }}>
          <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "monospace", margin: "0 0 16px" }}>
            Snabbreferens
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px" }}>
            {[
              ["Endpoint", "POST /api/agent-fraga"],
              ["Autentisering", "X-API-Key header (valfritt)"],
              ["Rate limit", "10 frågor/timme per IP (utan nyckel)"],
              ["Svarlängd", "2–4 meningar i karaktär"],
              ["Källmärkning", "👤 Besökare / ⚡ API / 🤖 AI-agent"],
              ["Dokumentation", "GET /api/agent-fraga returnerar full JSON-spec"],
            ].map(([k, v]) => (
              <div key={k} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "6px", padding: "14px 16px" }}>
                <p style={{ fontSize: "10px", color: C.green, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 4px", fontFamily: "monospace" }}>{k}</p>
                <p style={{ fontSize: "13px", color: C.textMuted, margin: 0, fontFamily: "monospace" }}>{v}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
