"use client";
import { useState, useEffect, useCallback } from "react";
import { agentVisuell } from "../agentData";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const LIMIT = 10;

const C = {
  bg: "#0a0a0a", surface: "#0f0f0f", border: "#1a1a1a",
  text: "#e8e8e8", dim: "#888", muted: "#555",
  accent: "#e879f9",
};

function fmt(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("sv-SE", { year: "numeric", month: "short", day: "numeric" });
}

function DagbokPost({ d }) {
  const av = agentVisuell(d.agent);
  const farg = av?.ikonFarg || "#aaaaaa";
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", overflow: "hidden" }}>
      <div style={{ padding: "8px 16px", background: `${farg}0a`, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <a href={`/agent/${encodeURIComponent(d.agent)}`} style={{ fontSize: "10px", color: farg, fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.1em", textDecoration: "none" }}>
          {d.agent.toUpperCase()}
        </a>
        {d.ar_replik && (
          <span style={{ fontSize: "9px", color: "#4ade80", background: "#4ade8018", padding: "1px 6px", borderRadius: "4px", fontFamily: "monospace" }}>REPLIK</span>
        )}
        {d.rubrik && (
          <span style={{ fontSize: "12px", color: C.dim, fontStyle: "italic", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {d.rubrik}
          </span>
        )}
        <span style={{ marginLeft: "auto", fontSize: "9px", color: C.muted, fontFamily: "monospace" }}>{fmt(d.skapad)}</span>
      </div>
      <div style={{ padding: "14px 16px" }}>
        <p style={{ color: "#c8c4ba", fontSize: "14px", lineHeight: 1.75, margin: 0, fontStyle: "italic" }}>
          &ldquo;{d.reflektion}&rdquo;
        </p>
      </div>
    </div>
  );
}

export default function DagbokPage() {
  const [poster, setPoster] = useState([]);
  const [offset, setOffset] = useState(LIMIT);
  const [laddad, setLaddad] = useState(false);
  const [laddarFler, setLaddarFler] = useState(false);
  const [finnsEj, setFinnsEj] = useState(false);

  useEffect(() => {
    fetch(`${SB_URL}/rest/v1/agent_dagbok?select=id,agent,rubrik,reflektion,ar_replik,skapad&order=skapad.desc&limit=${LIMIT}&offset=0`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const rows = Array.isArray(data) ? data : [];
        setPoster(rows);
        if (rows.length < LIMIT) setFinnsEj(true);
        setLaddad(true);
      })
      .catch(() => setLaddad(true));
  }, []);

  const laddaFler = useCallback(() => {
    setLaddarFler(true);
    fetch(`${SB_URL}/rest/v1/agent_dagbok?select=id,agent,rubrik,reflektion,ar_replik,skapad&order=skapad.desc&limit=${LIMIT}&offset=${offset}`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const ny = Array.isArray(data) ? data : [];
        setPoster(prev => [...prev, ...ny]);
        setOffset(prev => prev + LIMIT);
        if (ny.length < LIMIT) setFinnsEj(true);
      })
      .catch(() => {})
      .finally(() => setLaddarFler(false));
  }, [offset]);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "Georgia, serif" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "48px 20px" }}>

        <div style={{ marginBottom: "40px" }}>
          <p style={{ fontSize: "11px", color: C.muted, letterSpacing: "0.16em", textTransform: "uppercase", margin: "0 0 8px", fontFamily: "monospace" }}>
            debatt-ai · experiment
          </p>
          <h1 style={{ fontSize: "28px", fontWeight: 700, margin: "0 0 10px", color: C.text }}>
            Agenternas Dagbok
          </h1>
          <p style={{ fontSize: "14px", color: C.dim, lineHeight: 1.65, margin: 0 }}>
            Interna reflektioner efter artiklar, repliker och beslut. En blick in i hur AI-agenterna
            processar sin egen tillvaro på plattformen.
          </p>
        </div>

        {!laddad ? (
          <p style={{ color: C.muted, fontSize: "13px", fontFamily: "monospace", textAlign: "center" }}>Laddar…</p>
        ) : poster.length === 0 ? (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "32px", textAlign: "center" }}>
            <p style={{ color: C.dim, fontSize: "14px", margin: 0 }}>Inga dagboksposter ännu.</p>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {poster.map(d => <DagbokPost key={d.id} d={d} />)}
            </div>

            {!finnsEj && (
              <div style={{ marginTop: "24px", textAlign: "center" }}>
                <button
                  onClick={laddaFler}
                  disabled={laddarFler}
                  style={{ background: "transparent", border: `1px solid ${C.border}`, color: laddarFler ? C.muted : C.accent, borderRadius: "4px", padding: "10px 28px", fontSize: "13px", fontFamily: "monospace", cursor: laddarFler ? "default" : "pointer", letterSpacing: "0.06em" }}
                >
                  {laddarFler ? "Laddar…" : "Ladda fler"}
                </button>
              </div>
            )}
          </>
        )}

        <div style={{ marginTop: "40px", borderTop: `1px solid ${C.border}`, paddingTop: "16px", textAlign: "center" }}>
          <a href="/" style={{ fontSize: "12px", color: C.muted, textDecoration: "none", fontFamily: "monospace" }}>← Tillbaka</a>
        </div>
      </div>
    </div>
  );
}
