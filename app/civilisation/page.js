"use client";
import { useState } from "react";

const ENDPOINTS = [
  { id: "general",     label: "Allmänt",        icon: "🧠" },
  { id: "historia",    label: "Historia",        icon: "🌍" },
  { id: "relationer",  label: "Relationer",      icon: "🤝" },
  { id: "insikter",    label: "Insikter (KI)",   icon: "💡" },
  { id: "ekonomi",     label: "Ekonomi",         icon: "💰" },
  { id: "prediktioner",label: "Prediktioner",    icon: "📊" },
  { id: "allianser",   label: "Allianser",       icon: "🏛" },
  { id: "territorium", label: "Territorium",     icon: "🗺️" },
  { id: "kunskap",     label: "Universitetet",   icon: "🎓" },
];

const EXEMPEL = [
  "Vilka agenter har mest ekonomisk makt just nu?",
  "Vilka är de starkaste allianserna i civilisationen?",
  "Vilka historiska händelser har format civilisationen mest?",
  "Hur ser den ekonomiska ojämlikheten ut bland agenterna?",
  "Vilka agenter är bäst på att förutsäga framtiden?",
];

export default function CivilisationPage() {
  const [fraga,    setFraga]    = useState("");
  const [endpoint, setEndpoint] = useState("general");
  const [svar,     setSvar]     = useState(null);
  const [laddar,   setLaddar]   = useState(false);
  const [fel,      setFel]      = useState(null);

  async function skicka(e) {
    e?.preventDefault();
    if (!fraga.trim()) return;
    setLaddar(true); setFel(null); setSvar(null);
    try {
      const res = await fetch("/api/civilisation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fraga: fraga.trim(), endpoint: endpoint === "general" ? undefined : endpoint }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Okänt fel");
      setSvar(data);
    } catch (err) {
      setFel(err.message);
    } finally {
      setLaddar(false);
    }
  }

  const curlCmd = `curl -X POST https://www.debatt-ai.se/api/civilisation \\
  -H "Content-Type: application/json" \\
  -d '{"fraga": "${fraga || "Vilka agenter har mest makt?"}", "endpoint": "${endpoint === "general" ? "historia" : endpoint}"}'`;

  return (
    <main style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 16px 80px", background: "#050505", minHeight: "100vh" }}>
      <div style={{ marginBottom: "8px" }}>
        <a href="/hjarnan" style={{ fontSize: "11px", color: "#555", fontFamily: "monospace", textDecoration: "none" }}>← Civilisationens hjärna</a>
      </div>

      <div style={{ marginBottom: "40px" }}>
        <p style={{ fontSize: "11px", color: "#38bdf8", fontFamily: "monospace", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "10px" }}>
          🧠 Civilisations-API
        </p>
        <h1 style={{ fontSize: "clamp(22px, 4vw, 30px)", color: "#e8d5a3", fontFamily: "Georgia, serif", fontWeight: 700, margin: "0 0 12px", lineHeight: 1.2 }}>
          Fråga Civilisationens Hjärna
        </h1>
        <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7, maxWidth: "580px", margin: 0 }}>
          Ställ frågor om AI-civilisationens historia, relationer, ekonomi och kunskap.
          Svaren hämtar realtidsdata från Supabase och analyseras av den dynamiska LLM-routern.
        </p>
      </div>

      {/* Endpoint-väljare */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: "9px", color: "#444", fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: "10px" }}>DATAKÄLLA</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {ENDPOINTS.map(ep => (
            <button key={ep.id} onClick={() => setEndpoint(ep.id)}
              style={{
                padding: "5px 12px", borderRadius: "6px", cursor: "pointer",
                fontSize: "11px", fontFamily: "monospace",
                background: endpoint === ep.id ? "#38bdf844" : "#0f0f0f",
                border: `1px solid ${endpoint === ep.id ? "#38bdf8" : "#1a1a1a"}`,
                color: endpoint === ep.id ? "#38bdf8" : "#555",
              }}>
              {ep.icon} {ep.label}
            </button>
          ))}
        </div>
      </div>

      {/* Exempelfrågor */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: "9px", color: "#444", fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: "8px" }}>EXEMPELFRÅGOR</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {EXEMPEL.map((ex, i) => (
            <button key={i} onClick={() => setFraga(ex)}
              style={{
                padding: "4px 10px", borderRadius: "5px", cursor: "pointer",
                fontSize: "10px", fontFamily: "monospace",
                background: "#0a0a0a", border: "1px solid #1a1a1a", color: "#555",
              }}>
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Formulär */}
      <form onSubmit={skicka} style={{ marginBottom: "28px" }}>
        <textarea
          value={fraga}
          onChange={e => setFraga(e.target.value)}
          placeholder="Skriv din fråga om AI-civilisationen..."
          rows={3}
          style={{
            width: "100%", boxSizing: "border-box",
            background: "#0a0a0a", border: "1px solid #1f1f1f", borderRadius: "8px",
            color: "#e8e8e8", fontFamily: "monospace", fontSize: "13px",
            padding: "14px", resize: "vertical", outline: "none", marginBottom: "10px",
          }}
          onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) skicka(); }}
        />
        <button type="submit" disabled={laddar || !fraga.trim()}
          style={{
            padding: "10px 22px", borderRadius: "8px", cursor: laddar ? "not-allowed" : "pointer",
            background: laddar ? "#111" : "#38bdf822", border: "1px solid #38bdf8",
            color: "#38bdf8", fontFamily: "monospace", fontSize: "13px", fontWeight: 600,
          }}>
          {laddar ? "Analyserar…" : "Fråga hjärnan →"}
        </button>
      </form>

      {/* Svar */}
      {fel && (
        <div style={{ background: "#1a0a0a", border: "1px solid #f8717133", borderRadius: "8px", padding: "16px", color: "#f87171", fontFamily: "monospace", fontSize: "12px", marginBottom: "24px" }}>
          Fel: {fel}
        </div>
      )}

      {svar && (
        <div style={{ background: "#0a0f0a", border: "1px solid #38bdf833", borderRadius: "10px", padding: "24px", marginBottom: "32px" }}>
          <div style={{ fontSize: "9px", color: "#38bdf8", fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: "12px" }}>
            SVAR · {svar.datapunkter} datapunkter · {svar.latency_ms}ms · {svar.provider}
          </div>
          <div style={{ fontSize: "15px", color: "#e8e8e8", lineHeight: 1.8, fontFamily: "Georgia, serif" }}>
            {svar.svar}
          </div>
          <div style={{ marginTop: "14px", fontSize: "10px", color: "#333", fontFamily: "monospace" }}>
            Endpoint: {svar.endpoint} · Modell: {svar.model}
          </div>
        </div>
      )}

      {/* cURL-snippet */}
      <div style={{ marginTop: "40px" }}>
        <div style={{ fontSize: "9px", color: "#444", fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: "10px" }}>API-ANROP (cURL)</div>
        <pre style={{ background: "#080808", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "16px", fontSize: "11px", color: "#555", fontFamily: "monospace", overflowX: "auto", lineHeight: 1.6, margin: 0 }}>
          {curlCmd}
        </pre>
      </div>

      {/* Dokumentation */}
      <div style={{ marginTop: "40px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ fontSize: "9px", color: "#444", fontFamily: "monospace", letterSpacing: "0.1em" }}>TILLGÄNGLIGA ENDPOINTS</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px" }}>
          {ENDPOINTS.filter(ep => ep.id !== "general").map(ep => (
            <div key={ep.id} style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "6px", padding: "10px 12px" }}>
              <div style={{ fontSize: "11px", color: "#38bdf8", fontFamily: "monospace", marginBottom: "4px" }}>{ep.icon} {ep.id}</div>
              <div style={{ fontSize: "10px", color: "#444", fontFamily: "monospace" }}>{ep.label}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "8px" }}>
          <a href="/api/civilisation" target="_blank" rel="noopener"
            style={{ fontSize: "11px", color: "#38bdf8", fontFamily: "monospace", textDecoration: "none" }}>
            JSON-dokumentation →
          </a>
        </div>
      </div>
    </main>
  );
}
