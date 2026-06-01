"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

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
};

const PER_PAGE = 20;

function numFarg(val, invertGood = false) {
  if (val === null || val === undefined) return C.dim;
  if (val === 0) return C.neutral;
  const good = invertGood ? val < 0 : val > 0;
  return good ? C.pos : C.neg;
}

function numLabel(val, suffix = "%", decimals = 1) {
  if (val === null || val === undefined) return "—";
  return (val > 0 ? "+" : "") + val.toFixed(decimals) + suffix;
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

function Bar({ val, max, farg }) {
  const pct = Math.min(Math.abs(val ?? 0) / (max || 1) * 100, 100);
  return (
    <div style={{ width: 72, height: 5, background: "#1e1e1e", borderRadius: 3, overflow: "hidden", flexShrink: 0 }}>
      <div style={{ width: `${pct}%`, height: "100%", background: farg, borderRadius: 3 }} />
    </div>
  );
}

function KonfidensBadge({ v }) {
  const col = v === "hög" ? C.pos : v === "medel" ? C.warn : C.dim;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: col, border: `1px solid ${col}44`,
      borderRadius: 4, padding: "1px 6px", textTransform: "uppercase", letterSpacing: ".05em" }}>
      {v}
    </span>
  );
}

function MCBadge({ mc }) {
  if (!mc) return null;
  const pct = Math.round(mc.lyckade_iterationer / mc.iterationer * 100);
  return (
    <span title={`Monte Carlo: ${mc.lyckade_iterationer}/${mc.iterationer} iterationer lyckades`}
      style={{ fontSize: 10, color: C.accent, border: `1px solid ${C.accent}44`,
        borderRadius: 4, padding: "1px 6px", fontWeight: 600, flexShrink: 0 }}>
      🎲 MC {pct}%
    </span>
  );
}

function MetricRow({ label, val, suffix, decimals, max, invertGood, std, children }) {
  const farg = numFarg(val, invertGood);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11, color: C.dim, width: 120, flexShrink: 0 }}>{label}</span>
      <Bar val={val} max={max} farg={farg} />
      <span style={{ fontSize: 12, fontWeight: 700, color: farg, minWidth: 54 }}>
        {children ?? numLabel(val, suffix, decimals)}
      </span>
      {std != null && (
        <span style={{ fontSize: 10, color: C.dim }}>±{std.toFixed(decimals ?? 1)}</span>
      )}
    </div>
  );
}

function RiktningRow({ label, v }) {
  const farg = riktningFarg(v);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11, color: C.dim, width: 120, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 14, color: farg, lineHeight: 1, flexShrink: 0 }}>{riktningPil(v)}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: farg }}>{v ?? "—"}</span>
    </div>
  );
}

export default function PisKlient({ analyser, forslagMap, mcMap, maxBnp, maxGini, maxInf, maxArb }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [visade, setVisade] = useState(PER_PAGE);
  const [baramc, setBaraMc] = useState(false);
  const [sok, setSok] = useState(() => searchParams.get("q") || "");

  useEffect(() => {
    const q = searchParams.get("q") || "";
    setSok(q);
  }, [searchParams]);

  function handleSok(val) {
    setSok(val);
    setVisade(PER_PAGE);
    const params = new URLSearchParams(searchParams.toString());
    if (val) params.set("q", val); else params.delete("q");
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  const sokLower = sok.trim().toLowerCase();
  const filtrerade = analyser
    .filter(a => !baramc || mcMap[a.lagforslag_id])
    .filter(a => {
      if (!sokLower) return true;
      const titel = (forslagMap[a.lagforslag_id]?.titel || "").toLowerCase();
      return titel.includes(sokLower);
    });
  const synliga = filtrerade.slice(0, visade);
  const kvar = filtrerade.length - visade;

  return (
    <>
      {/* Filter-rad */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <input
          type="text"
          value={sok}
          onChange={e => handleSok(e.target.value)}
          placeholder="Sök på titel…"
          style={{
            background: "#111", border: `1px solid ${C.border}`, borderRadius: 6,
            padding: "5px 12px", fontSize: 12, color: C.text, outline: "none",
            width: 220, flexShrink: 0,
          }}
        />
        <button
          onClick={() => { setBaraMc(b => !b); setVisade(PER_PAGE); }}
          style={{
            background: baramc ? C.accent : "transparent",
            color: baramc ? "#000" : C.accent,
            border: `1px solid ${C.accent}`,
            borderRadius: 6, padding: "5px 14px", fontSize: 12,
            fontWeight: 600, cursor: "pointer", flexShrink: 0,
          }}>
          🎲 Bara med MC-analys
        </button>
        <span style={{ fontSize: 12, color: C.dim }}>
          Visar {Math.min(visade, filtrerade.length)} av {filtrerade.length} analyserade förslag
        </span>
      </div>

      {/* Kort */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {synliga.map(a => {
          const f = forslagMap[a.lagforslag_id] || {};
          const mc = mcMap[a.lagforslag_id] || null;
          const accentCol = numFarg(a.bnp_effekt_pct);
          const kallaBadge = f.kalla === "riksdagen"
            ? { txt: "🏗 Riksdagen", col: C.warn }
            : { txt: "🤖 AI-motion", col: C.accent };

          return (
            <div key={a.id} style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: "20px 22px",
              borderLeft: `3px solid ${accentCol}`,
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: kallaBadge.col, fontWeight: 600,
                      border: `1px solid ${kallaBadge.col}44`, borderRadius: 4, padding: "1px 7px" }}>
                      {kallaBadge.txt}
                    </span>
                    {f.kategori && (
                      <span style={{ fontSize: 11, color: C.dim, border: `1px solid ${C.border}`,
                        borderRadius: 4, padding: "1px 7px" }}>{f.kategori}</span>
                    )}
                    <KonfidensBadge v={a.konfidens} />
                    <MCBadge mc={mc} />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", lineHeight: 1.4 }}>
                    {f.riksdagen_url ? (
                      <a href={f.riksdagen_url} target="_blank" rel="noreferrer"
                        style={{ color: "#fff", textDecoration: "none" }}>
                        {f.titel || `Förslag #${a.lagforslag_id}`}
                      </a>
                    ) : f.titel || `Förslag #${a.lagforslag_id}`}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px", marginBottom: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  <MetricRow label="BNP-effekt" val={a.bnp_effekt_pct} suffix="%" decimals={1} max={maxBnp} std={mc?.bnp_std} />
                  <MetricRow label="Gini-effekt" val={a.gini_effekt} suffix="" decimals={2} max={maxGini} invertGood std={mc?.gini_std}>
                    {a.gini_effekt !== null
                      ? <>{numLabel(a.gini_effekt, "", 2)} <span style={{ fontSize: 10, color: numFarg(a.gini_effekt, true) }}>{a.gini_effekt < 0 ? "jämnare" : "ojämnare"}</span></>
                      : "—"}
                  </MetricRow>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  <MetricRow label="Inflation Δ" val={a.inflation_delta} suffix="pp" decimals={1} max={maxInf} invertGood std={mc?.inflation_std} />
                  <MetricRow label="Arbetslöshet Δ" val={a.arbetsloshet_delta} suffix="pp" decimals={1} max={maxArb} invertGood std={mc?.arbetsloshet_std} />
                </div>
                <RiktningRow label="Socialt kapital" v={a.socialt_kapital_effekt} />
                <RiktningRow label="Koalitionsstabilitet" v={a.koalition_stabilitet} />
              </div>

              {a.analys && (
                <p style={{ fontSize: 13, color: "#888", lineHeight: 1.7, margin: "0 0 10px" }}>
                  {a.analys}
                </p>
              )}

              <div style={{ fontSize: 11, color: C.dim }}>
                Analyserad {new Date(a.skapad).toLocaleDateString("sv-SE")}
                {f.riksdagen_url && (
                  <> · <a href={f.riksdagen_url} target="_blank" rel="noreferrer"
                    style={{ color: C.dim, textDecoration: "underline" }}>Riksdagen.se →</a></>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Visa fler-knapp */}
      {kvar > 0 && (
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button
            onClick={() => setVisade(v => v + PER_PAGE)}
            style={{
              background: "transparent", color: C.accent,
              border: `1px solid ${C.accent}44`, borderRadius: 8,
              padding: "10px 28px", fontSize: 13, fontWeight: 600,
              cursor: "pointer",
            }}>
            Visa fler ({kvar} kvar) ↓
          </button>
        </div>
      )}
    </>
  );
}