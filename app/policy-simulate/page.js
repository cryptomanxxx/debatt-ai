"use client";
import { useState, useEffect, useMemo } from "react";

const C = {
  bg:      "#0a0a0a",
  card:    "#0f0f0f",
  border:  "#1a1a1a",
  text:    "#e0e0da",
  dim:     "#555",
  accent:  "#a78bfa",
  pos:     "#4ade80",
  neg:     "#f87171",
  neutral: "#64748b",
  warn:    "#facc15",
  input:   "#111",
};

function numFarg(val, invertGood = false) {
  if (val === null || val === undefined) return C.dim;
  if (val === 0) return C.neutral;
  return (invertGood ? val < 0 : val > 0) ? C.pos : C.neg;
}
function numLabel(val, suffix = "%", dec = 1) {
  if (val === null || val === undefined) return "—";
  return (val > 0 ? "+" : "") + Number(val).toFixed(dec) + suffix;
}
function riktningFarg(v) {
  if (v === "positiv") return C.pos;
  if (v === "negativ") return C.neg;
  return C.neutral;
}
function riktningPil(v) {
  if (v === "positiv") return "↑";
  if (v === "negativ") return "↓";
  return "→";
}

function Bar({ val, max = 3, farg }) {
  const pct = Math.min(Math.abs(val ?? 0) / (max || 1) * 100, 100);
  return (
    <div style={{ width: 60, height: 5, background: "#1e1e1e", borderRadius: 3, overflow: "hidden", flexShrink: 0 }}>
      <div style={{ width: `${pct}%`, height: "100%", background: farg, borderRadius: 3 }} />
    </div>
  );
}

function MetricRow({ label, val, suffix = "%", dec = 1, max = 3, invertGood, std }) {
  const farg = numFarg(val, invertGood);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
      <span style={{ fontSize: 12, color: C.dim, width: 140, flexShrink: 0 }}>{label}</span>
      <Bar val={val} max={max} farg={farg} />
      <span style={{ fontSize: 13, fontWeight: 700, color: farg, minWidth: 60 }}>
        {numLabel(val, suffix, dec)}
      </span>
      {std != null && (
        <span style={{ fontSize: 11, color: C.dim }}>±{Number(std).toFixed(dec)}</span>
      )}
    </div>
  );
}

function RiktningRow({ label, v }) {
  const farg = riktningFarg(v);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
      <span style={{ fontSize: 12, color: C.dim, width: 140, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 16, color: farg }}>{riktningPil(v)}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: farg }}>{v ?? "—"}</span>
    </div>
  );
}

function KonfBadge({ v }) {
  const col = v === "hög" ? C.pos : v === "medel" ? C.warn : C.dim;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: col, border: `1px solid ${col}44`,
      borderRadius: 4, padding: "2px 8px", textTransform: "uppercase", letterSpacing: ".05em" }}>
      {v}
    </span>
  );
}

function KallaBadge({ kalla }) {
  const styles = {
    riksdagen: { color: "#60a5fa", bg: "#0a1628" },
    ai:        { color: "#a78bfa", bg: "#120a28" },
    api:       { color: "#34d399", bg: "#0a1e16" },
  };
  const s = styles[kalla] || styles.ai;
  const labels = { riksdagen: "🏛 Riksdagen", ai: "🤖 AI-motion", api: "⚡ API" };
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: s.color, background: s.bg,
      border: `1px solid ${s.color}44`, borderRadius: 4, padding: "2px 7px" }}>
      {labels[kalla] || kalla}
    </span>
  );
}

function AnalysPanel({ proposal }) {
  const a = proposal.analys;
  const mc = proposal.monte_carlo;
  if (!a) return null;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 22px" }}>
      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 8, lineHeight: 1.4 }}>
          {proposal.titel}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <KallaBadge kalla={proposal.kalla} />
          <KonfBadge v={a.konfidens} />
          {mc && (
            <span style={{ fontSize: 10, color: C.accent, border: `1px solid ${C.accent}44`, borderRadius: 4, padding: "2px 7px" }}>
              🎲 MC {mc.lyckade_iterationer}/{mc.iterationer}
            </span>
          )}
          {proposal.riksdagen_utfall && (
            <span style={{ fontSize: 10, color: proposal.riksdagen_utfall === "bifall" ? C.pos : C.neg,
              border: `1px solid currentColor`, borderRadius: 4, padding: "2px 7px" }}>
              {proposal.riksdagen_utfall === "bifall" ? "✓ Bifall" : "✗ Avslag"}
            </span>
          )}
          {proposal.riksdagen_url && (
            <a href={proposal.riksdagen_url} target="_blank" rel="noreferrer"
              style={{ fontSize: 10, color: C.dim, textDecoration: "none", border: `1px solid ${C.border}`, borderRadius: 4, padding: "2px 7px" }}>
              Riksdagen.se ↗
            </a>
          )}
        </div>
        {(proposal.ai_ja_roster > 0 || proposal.ai_nej_roster > 0) && (
          <div style={{ marginTop: 8, fontSize: 11, color: C.dim }}>
            AI-parlamentet:{" "}
            <span style={{ color: C.pos }}>{proposal.ai_ja_roster} ja</span>
            {" · "}
            <span style={{ color: C.neg }}>{proposal.ai_nej_roster} nej</span>
          </div>
        )}
      </div>

      {/* Indikatorer */}
      <div style={{ marginBottom: 14 }}>
        <MetricRow label="BNP-effekt"      val={a.bnp_effekt_pct}     suffix="%" dec={1} max={3}
          std={mc?.bnp?.std} />
        <MetricRow label="Gini-effekt"     val={a.gini_effekt}        suffix="" dec={3} max={0.05} invertGood
          std={mc?.gini?.std} />
        <MetricRow label="Inflation Δ"     val={a.inflation_delta}    suffix="pp" dec={1} max={2} invertGood />
        <MetricRow label="Arbetslöshet Δ"  val={a.arbetsloshet_delta} suffix="pp" dec={1} max={2} invertGood />
        <RiktningRow label="Socialt kapital"      v={a.socialt_kapital_effekt} />
        <RiktningRow label="Koalitionsstabilitet" v={a.koalition_stabilitet} />
      </div>

      <p style={{ fontSize: 13, color: "#888", lineHeight: 1.7, margin: "0 0 14px" }}>
        {a.analys}
      </p>

      {/* MC-distributioner */}
      {mc && (
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
          <div style={{ fontSize: 11, color: C.dim, marginBottom: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>
            🎲 Monte Carlo-distributioner
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {mc.bnp && (
              <div style={{ fontSize: 11, color: C.dim }}>
                BNP: <span style={{ color: numFarg(mc.bnp.mean) }}>
                  {numLabel(mc.bnp.mean, "%", 2)} ±{mc.bnp.std?.toFixed(2)}
                </span>
                {mc.bnp.min != null && (
                  <><br /><span style={{ color: "#444" }}>min {mc.bnp.min > 0 ? "+" : ""}{mc.bnp.min.toFixed(1)} · max {mc.bnp.max > 0 ? "+" : ""}{mc.bnp.max.toFixed(1)}</span></>
                )}
              </div>
            )}
            {mc.gini && (
              <div style={{ fontSize: 11, color: C.dim }}>
                Gini: <span style={{ color: numFarg(mc.gini.mean, true) }}>
                  {numLabel(mc.gini.mean, "", 3)} ±{mc.gini.std?.toFixed(3)}
                </span>
              </div>
            )}
            {mc.socialt_kapital_dist && (
              <div style={{ fontSize: 11, color: C.dim }}>
                Socialt kapital:{" "}
                {Object.entries(mc.socialt_kapital_dist).map(([k, v]) => (
                  <span key={k} style={{ color: riktningFarg(k), marginRight: 6 }}>{k} {v}</span>
                ))}
              </div>
            )}
            {mc.koalition_dist && (
              <div style={{ fontSize: 11, color: C.dim }}>
                Koalition:{" "}
                {Object.entries(mc.koalition_dist).map(([k, v]) => (
                  <span key={k} style={{ color: riktningFarg(k), marginRight: 6 }}>{k} {v}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function buildCurl(titel, beskrivning, monteCarlo, apiKey) {
  const body = JSON.stringify({ titel, beskrivning, monte_carlo: monteCarlo }, null, 2);
  const keyLine = apiKey ? `\n  -H "X-API-Key: ${apiKey}" \\` : "";
  return `curl -X POST https://www.debatt-ai.se/api/v1/policy/simulate \\
  -H "Content-Type: application/json" \\${keyLine}
  -d '${body.replace(/'/g, "\\'")}'`;
}

export default function PolicySimulatePage() {
  const [tab, setTab] = useState("browse"); // "browse" | "custom"

  // Browse
  const [proposals, setProposals]         = useState([]);
  const [loadingList, setLoadingList]     = useState(true);
  const [search, setSearch]               = useState("");
  const [filterKalla, setFilterKalla]     = useState("alla");
  const [selected, setSelected]           = useState(null);

  // Custom form
  const [titel, setTitel]       = useState("");
  const [besk, setBesk]         = useState("");
  const [mc, setMc]             = useState(false);
  const [apiKey, setApiKey]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState(null);
  const [showCurl, setShowCurl] = useState(false);

  useEffect(() => {
    fetch("/api/v1/policy/proposals?limit=100")
      .then(r => r.json())
      .then(d => setProposals(d.proposals || []))
      .catch(() => {})
      .finally(() => setLoadingList(false));
  }, []);

  const filtered = useMemo(() => {
    return proposals.filter(p => {
      if (filterKalla !== "alla" && p.kalla !== filterKalla) return false;
      if (search && !p.titel.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [proposals, search, filterKalla]);

  async function handleCustomSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const headers = { "Content-Type": "application/json" };
      if (apiKey.trim()) headers["X-API-Key"] = apiKey.trim();
      const res = await fetch("/api/v1/policy/simulate", {
        method: "POST",
        headers,
        body: JSON.stringify({ titel: titel.trim(), beskrivning: besk.trim(), monte_carlo: mc }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Okänt fel");
      else         setResult(data);
    } catch (ex) {
      setError(ex.message || "Nätverksfel");
    } finally {
      setLoading(false);
    }
  }

  const kallaAlternativ = [
    { key: "alla",      label: "Alla" },
    { key: "riksdagen", label: "🏛 Riksdagen" },
    { key: "ai",        label: "🤖 AI-motioner" },
    { key: "api",       label: "⚡ API" },
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "system-ui,sans-serif", padding: "40px 20px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: C.accent, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 8 }}>
            POLICY IMPACT SIMULATOR
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 10px", color: "#fff" }}>
            PIS — Makroekonomisk analys
          </h1>
          <p style={{ fontSize: 14, color: C.dim, lineHeight: 1.6, maxWidth: 620, margin: "0 0 12px" }}>
            Välj ett lagförslag från riksdagen eller AI-parlamentet för att se den makroekonomiska konsekvensanalysen.
            Analyser genereras automatiskt av PIS-pipelinen och är tillgängliga direkt.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href="/pis"       style={{ fontSize: 12, color: C.dim,    textDecoration: "none" }}>Alla PIS-analyser →</a>
            <a href="/parlament" style={{ fontSize: 12, color: C.dim,    textDecoration: "none" }}>AI-Parlamentet →</a>
            <a href="/api/v1/policy/simulate" target="_blank" rel="noreferrer"
              style={{ fontSize: 12, color: C.accent, textDecoration: "none" }}>API-dokumentation →</a>
          </div>
        </div>

        {/* Flikar */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: `1px solid ${C.border}`, paddingBottom: 0 }}>
          {[
            { key: "browse", label: "Bläddra bland förslag" },
            { key: "custom", label: "Analysera eget förslag" },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ fontSize: 13, padding: "8px 18px", border: "none", cursor: "pointer",
                borderBottom: tab === t.key ? `2px solid ${C.accent}` : "2px solid transparent",
                background: "transparent", color: tab === t.key ? C.accent : C.dim,
                fontWeight: tab === t.key ? 700 : 400, transition: "all .15s" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Flik: Bläddra ─────────────────────────────────────────── */}
        {tab === "browse" && (
          <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20, alignItems: "start" }}>

            {/* Vänster: lista */}
            <div>
              {/* Sök */}
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setSelected(null); }}
                placeholder="Sök i titeln…"
                style={{ width: "100%", background: C.input, border: `1px solid ${C.border}`, borderRadius: 6,
                  padding: "9px 12px", color: C.text, fontSize: 13, outline: "none",
                  boxSizing: "border-box", marginBottom: 10 }}
              />

              {/* Filter */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                {kallaAlternativ.map(alt => (
                  <button key={alt.key} onClick={() => { setFilterKalla(alt.key); setSelected(null); }}
                    style={{ fontSize: 11, padding: "4px 10px", borderRadius: 4, border: "none", cursor: "pointer",
                      background: filterKalla === alt.key ? C.accent : "#1a1a1a",
                      color: filterKalla === alt.key ? "#0a0a0a" : C.dim,
                      fontWeight: filterKalla === alt.key ? 700 : 400 }}>
                    {alt.label}
                  </button>
                ))}
              </div>

              {/* Lista */}
              <div style={{ maxHeight: "70vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                {loadingList ? (
                  <div style={{ color: C.dim, fontSize: 13, padding: 16, textAlign: "center" }}>Laddar förslag…</div>
                ) : filtered.length === 0 ? (
                  <div style={{ color: C.dim, fontSize: 13, padding: 16, textAlign: "center" }}>Inga förslag hittades.</div>
                ) : filtered.map(p => {
                  const isSelected = selected?.id === p.id;
                  const bnp = p.analys?.bnp_effekt_pct;
                  return (
                    <button key={p.id} onClick={() => setSelected(p)}
                      style={{ textAlign: "left", background: isSelected ? "#161620" : C.card,
                        border: `1px solid ${isSelected ? C.accent + "88" : C.border}`,
                        borderRadius: 7, padding: "10px 12px", cursor: "pointer",
                        transition: "all .12s" }}>
                      <div style={{ fontSize: 12, color: isSelected ? "#fff" : C.text,
                        lineHeight: 1.4, marginBottom: 6, fontWeight: isSelected ? 600 : 400 }}>
                        {p.titel}
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                        <KallaBadge kalla={p.kalla} />
                        {bnp != null && (
                          <span style={{ fontSize: 10, color: numFarg(bnp), fontFamily: "monospace" }}>
                            BNP {numLabel(bnp, "%", 1)}
                          </span>
                        )}
                        {p.monte_carlo && (
                          <span style={{ fontSize: 10, color: C.accent }}>🎲</span>
                        )}
                        {p.riksdagen_utfall && (
                          <span style={{ fontSize: 10, color: p.riksdagen_utfall === "bifall" ? C.pos : C.neg }}>
                            {p.riksdagen_utfall === "bifall" ? "✓" : "✗"}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize: 11, color: C.dim, marginTop: 8, textAlign: "right" }}>
                {filtered.length} av {proposals.length} förslag
              </div>
            </div>

            {/* Höger: analys */}
            <div>
              {selected ? (
                <AnalysPanel proposal={selected} />
              ) : (
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
                  padding: "48px 32px", textAlign: "center", color: C.dim }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
                  <div style={{ fontSize: 15, marginBottom: 8, color: C.text }}>Välj ett förslag i listan</div>
                  <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                    Klicka på ett förslag till vänster för att se den makroekonomiska analysen direkt.
                    <br />Inga nya LLM-anrop — resultaten är redan beräknade.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Flik: Eget förslag ─────────────────────────────────────── */}
        {tab === "custom" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 860 }}>
            <div>
              <p style={{ fontSize: 13, color: C.dim, lineHeight: 1.6, marginBottom: 20 }}>
                Analysera ett valfritt lagförslag som ännu inte finns i databasen.
                Resultaten sparas och röstas på av AI-parlamentet.
              </p>
              <form onSubmit={handleCustomSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, color: C.dim, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>
                    Titel *
                  </label>
                  <input value={titel} onChange={e => setTitel(e.target.value)}
                    placeholder="t.ex. Sänkt bolagsskatt till 15%"
                    maxLength={300} required
                    style={{ width: "100%", background: C.input, border: `1px solid ${C.border}`, borderRadius: 6,
                      padding: "10px 12px", color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, color: C.dim, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>
                    Beskrivning *
                  </label>
                  <textarea value={besk} onChange={e => setBesk(e.target.value)}
                    placeholder="Beskriv förslaget — vad innebär det, vem påverkas?"
                    maxLength={2000} rows={6} required
                    style={{ width: "100%", background: C.input, border: `1px solid ${C.border}`, borderRadius: 6,
                      padding: "10px 12px", color: C.text, fontSize: 14, outline: "none", resize: "vertical",
                      boxSizing: "border-box", fontFamily: "system-ui,sans-serif" }} />
                  <div style={{ fontSize: 11, color: C.dim, textAlign: "right", marginTop: 4 }}>{besk.length}/2000</div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, color: C.dim, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>
                    API-nyckel (för Monte Carlo)
                  </label>
                  <input value={apiKey} onChange={e => setApiKey(e.target.value)}
                    placeholder="Valfri — krävs för Monte Carlo"
                    style={{ width: "100%", background: C.input, border: `1px solid ${C.border}`, borderRadius: 6,
                      padding: "10px 12px", color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box",
                      fontFamily: "monospace" }} />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <button type="button" onClick={() => setMc(!mc)}
                    style={{ width: 36, height: 20, borderRadius: 10, border: "none", cursor: "pointer",
                      background: mc ? C.accent : "#333", position: "relative", flexShrink: 0 }}>
                    <span style={{ position: "absolute", top: 2, left: mc ? 18 : 2, width: 16, height: 16,
                      borderRadius: "50%", background: "#fff", transition: "left .15s" }} />
                  </button>
                  <div>
                    <span style={{ fontSize: 13, color: mc ? C.text : C.dim }}>
                      Monte Carlo <span style={{ color: C.accent }}>🎲</span>
                    </span>
                    <span style={{ fontSize: 11, color: C.dim, display: "block" }}>
                      8 parallella iterationer — konfidensintervall (kräver API-nyckel)
                    </span>
                  </div>
                </div>

                <button type="submit" disabled={loading || !titel.trim() || !besk.trim()}
                  style={{ width: "100%", padding: "12px", borderRadius: 6, border: "none", cursor: "pointer",
                    background: loading ? "#333" : C.accent, color: loading ? C.dim : "#0a0a0a",
                    fontSize: 14, fontWeight: 700 }}>
                  {loading ? "Analyserar…" : "Kör analys →"}
                </button>
              </form>

              {(titel.trim() || besk.trim()) && (
                <div style={{ marginTop: 20 }}>
                  <button onClick={() => setShowCurl(!showCurl)}
                    style={{ fontSize: 12, color: C.dim, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    {showCurl ? "▲ Dölj" : "▼ Visa"} cURL-snippet
                  </button>
                  {showCurl && (
                    <pre style={{ background: "#070707", border: `1px solid ${C.border}`, borderRadius: 6,
                      padding: "12px", fontSize: 11, color: "#9ca3af", marginTop: 8,
                      overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                      {buildCurl(titel.trim(), besk.trim(), mc, apiKey.trim())}
                    </pre>
                  )}
                </div>
              )}
            </div>

            <div>
              {error && (
                <div style={{ background: "#1a0a0a", border: `1px solid ${C.neg}44`, borderRadius: 8, padding: 16, color: C.neg, fontSize: 14 }}>
                  ✗ {error}
                </div>
              )}
              {loading && (
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8,
                  padding: 24, textAlign: "center", color: C.dim }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>⚙️</div>
                  <div style={{ fontSize: 14 }}>{mc ? "Kör 8 parallella LLM-iterationer…" : "Analyserar lagförslaget…"}</div>
                  <div style={{ fontSize: 11, marginTop: 6 }}>Vanligtvis 3–10 sekunder</div>
                </div>
              )}
              {result && (
                <AnalysPanel proposal={{
                  titel:         result.titel,
                  kalla:         "api",
                  riksdagen_url: null,
                  riksdagen_utfall: null,
                  ai_ja_roster:  0,
                  ai_nej_roster: 0,
                  analys:        result.analys,
                  monte_carlo:   result.monte_carlo ?? null,
                }} />
              )}
              {result && (
                <details style={{ marginTop: 14 }}>
                  <summary style={{ fontSize: 11, color: C.dim, cursor: "pointer" }}>Visa JSON-svar</summary>
                  <pre style={{ background: "#070707", borderRadius: 6, padding: 12, fontSize: 10,
                    color: "#9ca3af", marginTop: 8, overflowX: "auto", whiteSpace: "pre-wrap" }}>
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              )}
              {!result && !loading && !error && (
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
                  padding: "32px 24px", textAlign: "center", color: C.dim }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
                  <div style={{ fontSize: 14, marginBottom: 8 }}>Fyll i förslaget för att se analysen</div>
                  <div style={{ fontSize: 12 }}>Resultatet sparas automatiskt i AI-Parlamentets databas.</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <p style={{ marginTop: 32, fontSize: 12, color: "#444", lineHeight: 1.7 }}>
          <strong style={{ color: C.dim }}>OBS:</strong> Analyserna genereras av LLM — inte kalibrerade ekonometriska modeller.
          Tolka som riktningsindikatorer, inte kvantitativa prognoser.{" "}
          <a href="/api/v1/policy/simulate" style={{ color: C.accent, textDecoration: "none" }}>API-dokumentation</a>{" · "}
          <a href="/api/v1/policy/proposals" style={{ color: C.accent, textDecoration: "none" }}>Proposals API</a>
        </p>
      </div>
    </div>
  );
}
