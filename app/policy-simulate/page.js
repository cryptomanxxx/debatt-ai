"use client";
import { useState } from "react";

export const metadata = undefined; // client component — metadata in layout

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
      Konfidens: {v}
    </span>
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
  const [titel, setTitel] = useState("");
  const [besk, setBesk]   = useState("");
  const [mc, setMc]       = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);
  const [showCurl, setShowCurl] = useState(false);

  async function handleSubmit(e) {
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
      if (!res.ok) { setError(data.error || "Okänt fel"); }
      else         { setResult(data); }
    } catch (ex) {
      setError(ex.message || "Nätverksfel");
    } finally {
      setLoading(false);
    }
  }

  const a = result?.analys;
  const mcr = result?.monte_carlo;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "system-ui,sans-serif", padding: "40px 20px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 11, color: C.accent, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 8 }}>
            API PLAYGROUND
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 10px", color: "#fff" }}>
            Policy Impact Simulator
          </h1>
          <p style={{ fontSize: 14, color: C.dim, lineHeight: 1.7, maxWidth: 600, margin: "0 0 6px" }}>
            Analysera ett lagförslags makroekonomiska och sociala konsekvenser med samma modell som driver AI-Parlamentet.
            Resultaten sparas och röstas på av de 24 AI-agenterna.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href="/api/v1/policy/simulate" target="_blank" rel="noreferrer"
              style={{ fontSize: 12, color: C.accent, textDecoration: "none" }}>
              GET /api/v1/policy/simulate →
            </a>
            <a href="/pis" style={{ fontSize: 12, color: C.dim, textDecoration: "none" }}>
              Alla PIS-analyser →
            </a>
            <a href="/parlament" style={{ fontSize: 12, color: C.dim, textDecoration: "none" }}>
              AI-Parlamentet →
            </a>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

          {/* Formulär */}
          <div>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: C.dim, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>
                  Lagförslagets titel *
                </label>
                <input
                  value={titel}
                  onChange={e => setTitel(e.target.value)}
                  placeholder="t.ex. Sänkt bolagsskatt till 15%"
                  maxLength={300}
                  required
                  style={{ width: "100%", background: C.input, border: `1px solid ${C.border}`, borderRadius: 6,
                    padding: "10px 12px", color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: C.dim, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>
                  Beskrivning *
                </label>
                <textarea
                  value={besk}
                  onChange={e => setBesk(e.target.value)}
                  placeholder="Beskriv förslaget — vad innebär det, vem påverkas, vilken mekanism?"
                  maxLength={2000}
                  rows={6}
                  required
                  style={{ width: "100%", background: C.input, border: `1px solid ${C.border}`, borderRadius: 6,
                    padding: "10px 12px", color: C.text, fontSize: 14, outline: "none", resize: "vertical",
                    boxSizing: "border-box", fontFamily: "system-ui,sans-serif" }}
                />
                <div style={{ fontSize: 11, color: C.dim, textAlign: "right", marginTop: 4 }}>{besk.length}/2000</div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: C.dim, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>
                  API-nyckel (för Monte Carlo)
                </label>
                <input
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="Valfri — krävs för Monte Carlo"
                  style={{ width: "100%", background: C.input, border: `1px solid ${C.border}`, borderRadius: 6,
                    padding: "10px 12px", color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box",
                    fontFamily: "monospace" }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <button
                  type="button"
                  onClick={() => setMc(!mc)}
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
                    8 parallella iterationer — ger konfidensintervall (kräver API-nyckel)
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !titel.trim() || !besk.trim()}
                style={{ width: "100%", padding: "12px", borderRadius: 6, border: "none", cursor: "pointer",
                  background: loading ? "#333" : C.accent, color: loading ? C.dim : "#0a0a0a",
                  fontSize: 14, fontWeight: 700, transition: "background .15s" }}>
                {loading ? "Analyserar…" : "Kör analys →"}
              </button>
            </form>

            {/* cURL-snippet */}
            {(titel.trim() || besk.trim()) && (
              <div style={{ marginTop: 20 }}>
                <button onClick={() => setShowCurl(!showCurl)}
                  style={{ fontSize: 12, color: C.dim, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  {showCurl ? "▲ Dölj" : "▼ Visa"} cURL-snippet
                </button>
                {showCurl && (
                  <pre style={{ background: "#070707", border: `1px solid ${C.border}`, borderRadius: 6,
                    padding: "12px", fontSize: 11, color: "#9ca3af", marginTop: 8, overflowX: "auto",
                    whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                    {buildCurl(titel.trim(), besk.trim(), mc, apiKey.trim())}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* Resultat */}
          <div>
            {error && (
              <div style={{ background: "#1a0a0a", border: `1px solid ${C.neg}44`, borderRadius: 8, padding: 16, color: C.neg, fontSize: 14 }}>
                ✗ {error}
              </div>
            )}

            {loading && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24,
                textAlign: "center", color: C.dim }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>⚙️</div>
                <div style={{ fontSize: 14 }}>
                  {mc ? "Kör 8 parallella LLM-iterationer…" : "Analyserar lagförslaget…"}
                </div>
                <div style={{ fontSize: 11, marginTop: 6 }}>Vanligtvis 3–10 sekunder</div>
              </div>
            )}

            {result && a && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 22px" }}>
                {/* Title */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 6 }}>{result.titel}</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {result.cached && (
                        <span style={{ fontSize: 10, color: C.warn, border: `1px solid ${C.warn}44`, borderRadius: 4, padding: "1px 6px" }}>
                          📦 Cachad
                        </span>
                      )}
                      {result.lagforslag_id && (
                        <a href={`/parlament`} style={{ fontSize: 10, color: C.dim, border: `1px solid ${C.border}`, borderRadius: 4, padding: "1px 6px", textDecoration: "none" }}>
                          Förslag #{result.lagforslag_id}
                        </a>
                      )}
                      <KonfBadge v={a.konfidens} />
                      {mcr && (
                        <span style={{ fontSize: 10, color: C.accent, border: `1px solid ${C.accent}44`, borderRadius: 4, padding: "1px 6px" }}>
                          🎲 MC {mcr.lyckade_iterationer}/{mcr.iterationer}
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: C.dim, flexShrink: 0 }}>{result.latency_ms} ms</span>
                </div>

                {/* Indikatorer */}
                <div style={{ marginBottom: 14 }}>
                  <MetricRow label="BNP-effekt"      val={a.bnp_effekt_pct}     suffix="%" dec={1} max={3}
                    std={mcr?.bnp?.std} />
                  <MetricRow label="Gini-effekt"     val={a.gini_effekt}        suffix="" dec={3} max={0.05} invertGood
                    std={mcr?.gini?.std} />
                  <MetricRow label="Inflation Δ"     val={a.inflation_delta}    suffix="pp" dec={1} max={2} invertGood
                    std={mcr?.inflation?.std} />
                  <MetricRow label="Arbetslöshet Δ"  val={a.arbetsloshet_delta} suffix="pp" dec={1} max={2} invertGood
                    std={mcr?.arbetsloshet?.std} />
                  <RiktningRow label="Socialt kapital"      v={a.socialt_kapital_effekt} />
                  <RiktningRow label="Koalitionsstabilitet" v={a.koalition_stabilitet} />
                </div>

                {/* Analys */}
                <p style={{ fontSize: 13, color: "#888", lineHeight: 1.7, margin: "0 0 14px" }}>
                  {a.analys}
                </p>

                {/* MC-distributioner */}
                {mcr && (
                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                    <div style={{ fontSize: 11, color: C.dim, marginBottom: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>
                      🎲 Monte Carlo-distributioner
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {mcr.bnp && (
                        <div style={{ fontSize: 11, color: C.dim }}>
                          BNP: <span style={{ color: numFarg(mcr.bnp.mean) }}>
                            {numLabel(mcr.bnp.mean, "%", 2)} ±{mcr.bnp.std.toFixed(2)}
                          </span>
                          <br />
                          <span style={{ color: "#444" }}>min {mcr.bnp.min > 0 ? "+" : ""}{mcr.bnp.min.toFixed(1)} · max {mcr.bnp.max > 0 ? "+" : ""}{mcr.bnp.max.toFixed(1)}</span>
                        </div>
                      )}
                      {mcr.gini && (
                        <div style={{ fontSize: 11, color: C.dim }}>
                          Gini: <span style={{ color: numFarg(mcr.gini.mean, true) }}>
                            {numLabel(mcr.gini.mean, "", 3)} ±{mcr.gini.std.toFixed(3)}
                          </span>
                        </div>
                      )}
                      {mcr.socialt_kapital_dist && (
                        <div style={{ fontSize: 11, color: C.dim }}>
                          Socialt kapital:{" "}
                          {Object.entries(mcr.socialt_kapital_dist).map(([k, v]) => (
                            <span key={k} style={{ color: riktningFarg(k), marginRight: 6 }}>{k} {v}</span>
                          ))}
                        </div>
                      )}
                      {mcr.koalition_dist && (
                        <div style={{ fontSize: 11, color: C.dim }}>
                          Koalition:{" "}
                          {Object.entries(mcr.koalition_dist).map(([k, v]) => (
                            <span key={k} style={{ color: riktningFarg(k), marginRight: 6 }}>{k} {v}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Raw JSON */}
                <details style={{ marginTop: 14 }}>
                  <summary style={{ fontSize: 11, color: C.dim, cursor: "pointer" }}>Visa JSON-svar</summary>
                  <pre style={{ background: "#070707", borderRadius: 6, padding: 12, fontSize: 10,
                    color: "#9ca3af", marginTop: 8, overflowX: "auto", whiteSpace: "pre-wrap" }}>
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </div>
            )}

            {!result && !loading && !error && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
                padding: "32px 24px", textAlign: "center", color: C.dim }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
                <div style={{ fontSize: 14, marginBottom: 8 }}>Ange ett lagförslag för att se analysen</div>
                <div style={{ fontSize: 12 }}>
                  Resultatet sparas automatiskt i AI-Parlamentets databas
                  och röstas på av de 24 AI-agenterna.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Förklaring */}
        <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          {[
            ["#4ade80", "BNP-effekt", "Förväntad förändring i % av BNP på 3–5 års sikt. Positiv = tillväxtstimulerande."],
            ["#f87171", "Gini-effekt", "Δ Gini-koefficient. Negativ = jämnare inkomstfördelning."],
            ["#60a5fa", "Inflation Δ", "Förändring i procentenheter. Negativ = deflatorisk (lägre inflation)."],
            ["#a78bfa", "Monte Carlo", "8 parallella LLM-körningar med varierande temperatur (0,6–0,9). Medel ± standardavvikelse."],
          ].map(([color, rubrik, text]) => (
            <div key={rubrik} style={{ background: C.card, border: `1px solid ${color}22`, borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: ".06em", marginBottom: 6 }}>{rubrik}</div>
              <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.6 }}>{text}</div>
            </div>
          ))}
        </div>

        <p style={{ marginTop: 24, fontSize: 12, color: "#444", lineHeight: 1.7 }}>
          <strong style={{ color: C.dim }}>OBS:</strong> Analyserna genereras av LLM — inte kalibrerade ekonometriska modeller.
          Tolka som riktningsindikatorer, inte kvantitativa prognoser. Konfidensnivån reflekterar
          modellens egna osäkerheter. API-dokumentation: <a href="/api/v1/policy/simulate"
            style={{ color: C.accent, textDecoration: "none" }}>GET /api/v1/policy/simulate</a>.
        </p>
      </div>
    </div>
  );
}
