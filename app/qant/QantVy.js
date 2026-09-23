"use client";
import { useState } from "react";
import {
  ScatterChart, Scatter, BarChart, Bar,
  XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, LabelList,
} from "recharts";

const C = {
  bg: "#030712",
  panel: "#111827",
  border: "#1f2937",
  text: "#e5e7eb",
  dim: "#9ca3af",
  faint: "#6b7280",
  accent: "#22d3ee",
  accentDim: "#0e7490",
  pareto: "#34d399",
  ickePareto: "#4b5563",
  warnBg: "#2d1a05",
  warnBorder: "#78350f",
  warnText: "#fbbf24",
};

const SEKTION = { background: C.panel, borderRadius: "16px", padding: "24px", border: `1px solid ${C.border}`, marginBottom: "24px" };
const RUBRIK = { fontSize: "18px", fontWeight: 600, marginBottom: "4px", color: C.text };
const INGRESS = { color: C.faint, fontSize: "14px", marginBottom: "20px", lineHeight: 1.6 };
const TOOLTIP_STYLE = { contentStyle: { background: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }, labelStyle: { color: "#e5e7eb" }, itemStyle: { color: "#9ca3af" } };
const TOM = { color: C.faint, textAlign: "center", padding: "32px 0", fontSize: "14px" };

// Kända fält per arkitektur i dagens schema — allt annat (t.ex. en framtida
// latency/throughput/energy_efficiency från riktig fotonikhårdvara) renderas
// ändå generiskt, inte tyst bortfiltrerat. Se CLAUDE.md ✅134.
const KANDA_ARK_FALT = new Set(["architecture", "parameters", "mean_accuracy", "std_accuracy", "pareto"]);
const KANDA_CFG_FALT = new Set(["train_samples", "test_samples", "epochs", "planned_runs"]);

function humaniseraNyckel(k) {
  return k.replace(/_/g, " ").replace(/^./, c => c.toUpperCase());
}

function formatVarde(v) {
  if (typeof v === "number") {
    return Number.isInteger(v) ? v.toLocaleString("sv-SE") : v.toLocaleString("sv-SE", { maximumFractionDigits: 4 });
  }
  return String(v);
}

// Härleder ett läsbart namn ur ett "expNNN_beskrivning"-id utan att hårdkoda
// enskilda experimentnummer eller -namn — fungerar lika bra för exp010, exp099 osv.
function naturligtNamn(id) {
  if (!id) return "Okänt experiment";
  const m = /^exp0*(\d+)_(.+)$/i.exec(id);
  if (!m) return id;
  const [, nr, rest] = m;
  const namn = rest.replace(/_/g, " ");
  return `Exp ${nr} — ${namn.charAt(0).toUpperCase()}${namn.slice(1)}`;
}

// Experimentnummer ur samma "expNNN_..."-mönster som naturligtNamn() — den
// autentiska forskningssekvensen, inte filens timestamp. Två experiment kan
// råka få timestamps i "fel" ordning (t.ex. loggade/backfyllda tillsammans),
// vilket gjorde att Exp005 visades före Exp004 innan denna fix (CLAUDE.md ✅135).
// Returnerar null för ett id som inte matchar mönstret — då faller sorteringen
// tillbaka på timestamp för just det experimentet.
function experimentNummer(id) {
  if (!id) return null;
  const m = /^exp0*(\d+)_/i.exec(id);
  return m ? parseInt(m[1], 10) : null;
}

// Deterministisk färg ur en godtycklig sträng (dataset, arkitekturnamn) —
// nya datasetnamn i framtiden får automatiskt en stabil, distinkt färg utan
// att en hårdkodad färgkarta behöver underhållas.
function fargForNamn(namn) {
  let hash = 0;
  const s = String(namn || "");
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return `hsl(${hash % 360}, 62%, 60%)`;
}

function fmtDatum(iso) {
  if (!iso) return "–";
  try {
    return new Date(iso).toLocaleString("sv-SE", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function fmtPct(frac, dec = 1) {
  if (typeof frac !== "number") return "–";
  return `${(frac * 100).toFixed(dec)}%`;
}

function StatPill({ label, v, sub }) {
  return (
    <div style={{ background: "#0d1117", borderRadius: "12px", padding: "16px", border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: "22px", fontWeight: 700, color: C.text }}>{v}</div>
      {sub && <div style={{ fontSize: "12px", color: C.accent, marginTop: "2px" }}>{sub}</div>}
      <div style={{ fontSize: "13px", color: C.faint, marginTop: "4px" }}>{label}</div>
    </div>
  );
}

export default function QantVy({ data, repoUrl, dashboardUrl }) {
  const [oppetExp, setOppetExp] = useState(null);

  if (!data) {
    return (
      <main style={{ minHeight: "100vh", background: C.bg, color: "#fff", padding: "24px", maxWidth: "1100px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "12px" }}>🔬 Q.ANT Research Lab</h1>
        <div style={{ ...SEKTION, textAlign: "center", color: C.faint }}>
          <p style={{ marginBottom: "12px" }}>Forskningsdatan kunde inte hämtas just nu.</p>
          <p style={{ fontSize: "13px" }}>
            Källan är{" "}
            <a href={dashboardUrl} target="_blank" rel="noopener noreferrer" style={{ color: C.accent }}>
              research-dashboard.json
            </a>{" "}
            i forskningsrepot. Prova igen om en stund — sidan uppdateras automatiskt när filen är nåbar igen.
          </p>
        </div>
      </main>
    );
  }

  const project = data.project || {};
  const status = data.status || {};
  const experiments = Array.isArray(data.experiments) ? data.experiments : [];
  const featured = data.featured_comparison || {};
  const arkitekturer = Array.isArray(featured.architectures) ? featured.architectures : [];
  const forskningsloop = Array.isArray(data.research_loop) ? data.research_loop : [];
  const provenance = data.provenance || {};

  // Sorterar efter forskningssekvensens experimentnummer (Exp001 → Exp002 → …),
  // inte filens timestamp — de två kan divergera (se experimentNummer() ovan).
  // Faller tillbaka på timestamp bara om ett id inte matchar expNNN_-mönstret.
  const sorteradeExp = [...experiments].sort((a, b) => {
    const na = experimentNummer(a.id);
    const nb = experimentNummer(b.id);
    if (na !== null && nb !== null) return na - nb;
    if (na !== null) return -1;
    if (nb !== null) return 1;
    return (a.timestamp_utc || "").localeCompare(b.timestamp_utc || "");
  });

  const tidslinjeData = sorteradeExp.map((e, i) => ({
    id: e.id,
    namn: `#${i + 1}`,
    fulltNamn: naturligtNamn(e.id),
    dataset: e.dataset,
    paretoCount: Array.isArray(e.pareto_front) ? e.pareto_front.length : 0,
  }));

  const antalParetoArk = arkitekturer.filter(a => a.pareto).length;
  const extraArkFalt = [...new Set(arkitekturer.flatMap(a => Object.keys(a).filter(k => !KANDA_ARK_FALT.has(k))))];

  const parametrar = arkitekturer.map(a => a.parameters).filter(v => typeof v === "number");
  const accuracies = arkitekturer.map(a => a.mean_accuracy).filter(v => typeof v === "number");
  const yMin = accuracies.length ? Math.min(...accuracies) : 0;
  const yMax = accuracies.length ? Math.max(...accuracies) : 1;
  const yPad = Math.max((yMax - yMin) * 0.15, 0.01);

  return (
    <main style={{ minHeight: "100vh", background: C.bg, color: "#fff", padding: "24px", maxWidth: "1100px", margin: "0 auto" }}>
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "8px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0 }}>🔬 {project.name || "Q.ANT Research Lab"}</h1>
          <a href={repoUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: C.accent, fontFamily: "monospace", textDecoration: "none", whiteSpace: "nowrap" }}>
            📂 Forskningsrepo →
          </a>
        </div>
        <p style={{ color: C.dim, maxWidth: "700px", lineHeight: 1.7, fontSize: "15px" }}>
          {project.description || "Öppen arkitekturforskning med Q.ANT Native Computing Toolkit."}
        </p>
        {dashboardUrl && (
          <p style={{ color: C.faint, fontSize: "11px", fontFamily: "monospace", marginTop: "6px" }}>
            Data hämtad direkt ur repots publika datalager — inga interna kö-, förslags- eller analysfiler läses av den här sidan.
          </p>
        )}
      </div>

      {/* Vetenskaplig disclaimer — visas verbatim ur JSON:en, aldrig omskriven eller nedtonad */}
      {project.backend_disclaimer && (
        <div style={{ background: C.warnBg, border: `1px solid ${C.warnBorder}`, borderRadius: "12px", padding: "16px 20px", marginBottom: "24px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
          <span style={{ fontSize: "20px", lineHeight: 1 }}>⚠️</span>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: C.warnText, letterSpacing: "0.03em", marginBottom: "4px", textTransform: "uppercase" }}>
              Vetenskaplig disclaimer
            </div>
            <div style={{ fontSize: "14px", color: "#fde68a", lineHeight: 1.6 }}>{project.backend_disclaimer}</div>
          </div>
        </div>
      )}

      {/* Status */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        <StatPill label="Genomförda experiment" v={status.completed_experiments ?? experiments.length} />
        <StatPill label="Senaste experiment" v={naturligtNamn(status.latest_completed_experiment)} />
        <StatPill label="Aktuell backend" v={<code style={{ fontFamily: "monospace" }}>{project.current_backend || "–"}</code>} />
        <StatPill label="Arkitekturer på Paretofronten" v={`${antalParetoArk} / ${arkitekturer.length}`} sub={featured.dataset ? `i ${featured.dataset}` : null} />
      </div>

      {status.current_research_direction && (
        <div style={{ ...SEKTION, marginBottom: "24px" }}>
          <div style={{ fontSize: "12px", color: C.faint, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
            Aktuell forskningsriktning
          </div>
          <div style={{ fontSize: "15px", color: C.text, lineHeight: 1.6 }}>{status.current_research_direction}</div>
        </div>
      )}

      {/* Forskningsloopen */}
      {forskningsloop.length > 0 && (
        <div style={SEKTION}>
          <h2 style={RUBRIK}>Forskningsloopen</h2>
          <p style={INGRESS}>
            Varje ny idé testas som en falsifierbar hypotes innan den får köra ett skarpt experiment —
            en människa godkänner alltid steget mellan hypotes och körning.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px" }}>
            {forskningsloop.map((steg, i) => (
              <span key={`${steg}-${i}`} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{
                  background: "#0d1117", border: `1px solid ${C.border}`, borderRadius: "999px",
                  padding: "8px 14px", fontSize: "13px", color: C.text, whiteSpace: "nowrap",
                }}>
                  {String(steg).charAt(0).toUpperCase() + String(steg).slice(1)}
                </span>
                {i < forskningsloop.length - 1 && <span style={{ color: C.faint }}>→</span>}
              </span>
            ))}
            <span style={{ color: C.faint, fontSize: "12px" }}>↻</span>
          </div>
        </div>
      )}

      {/* Experimenthistorik / tidslinje */}
      <div style={SEKTION}>
        <h2 style={RUBRIK}>Experimenthistorik</h2>
        <p style={INGRESS}>
          Antal arkitekturer på Paretofronten per experiment, i forskningssekvensens ordning (Exp001 → Exp002 → …). Klicka ett experiment
          för att se dataset, konfiguration och vilka arkitekturer som låg på fronten.
        </p>
        {tidslinjeData.length === 0 ? (
          <div style={TOM}>Inga experiment publicerade ännu.</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={tidslinjeData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="namn" tick={{ fill: C.faint, fontSize: 11 }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: C.faint, fontSize: 11 }} tickLine={false} />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(v, _n, props) => [`${v} arkitekturer`, props.payload.fulltNamn]}
                labelFormatter={() => ""}
              />
              <Bar dataKey="paretoCount" radius={[4, 4, 0, 0]}>
                {tidslinjeData.map(d => (
                  <Cell key={d.id} fill={fargForNamn(d.dataset)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {sorteradeExp.map((exp, i) => {
            const oppen = oppetExp === exp.id;
            const paretoFront = Array.isArray(exp.pareto_front) ? exp.pareto_front : [];
            const cfg = exp.configuration || {};
            return (
              <div key={exp.id || i} style={{ background: "#0d1117", borderRadius: "10px", border: `1px solid ${C.border}`, overflow: "hidden" }}>
                <button
                  onClick={() => setOppetExp(oppen ? null : exp.id)}
                  style={{
                    width: "100%", padding: "12px 16px", background: "transparent", border: "none",
                    cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between",
                    alignItems: "center", gap: "10px", color: "inherit",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                    <span style={{ fontSize: "11px", color: C.faint, fontFamily: "monospace", flexShrink: 0 }}>#{i + 1}</span>
                    <span style={{ fontWeight: 600, fontSize: "14px", color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {naturligtNamn(exp.id)}
                    </span>
                    <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "999px", background: fargForNamn(exp.dataset) + "33", color: fargForNamn(exp.dataset), whiteSpace: "nowrap" }}>
                      {exp.dataset || "okänt dataset"}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                    <span style={{ fontSize: "12px", color: C.faint }}>{fmtDatum(exp.timestamp_utc)}</span>
                    <span style={{ fontSize: "12px", color: paretoFront.length ? C.pareto : C.faint }}>{paretoFront.length} på fronten</span>
                    <span style={{ color: C.faint, fontSize: "11px" }}>{oppen ? "▲" : "▼"}</span>
                  </div>
                </button>
                {oppen && (
                  <div style={{ padding: "0 16px 16px", fontSize: "13px", color: C.dim }}>
                    {exp.backend && (
                      <div style={{ marginBottom: "8px" }}>
                        Backend: <code style={{ color: C.text }}>{exp.backend}</code>
                      </div>
                    )}
                    {Object.keys(cfg).length > 0 && (
                      <div style={{ marginBottom: "8px" }}>
                        <div style={{ fontSize: "11px", color: C.faint, marginBottom: "4px" }}>Konfiguration</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          {Object.entries(cfg).map(([k, v]) => (
                            <span key={k} style={{ background: "#1f2937", borderRadius: "6px", padding: "3px 8px", fontSize: "12px", color: KANDA_CFG_FALT.has(k) ? C.dim : C.accent }}>
                              {humaniseraNyckel(k)}: {formatVarde(v)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {paretoFront.length > 0 ? (
                      <div>
                        <div style={{ fontSize: "11px", color: C.faint, marginBottom: "4px" }}>Arkitekturer på Paretofronten</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          {paretoFront.map(namn => (
                            <span key={namn} style={{ background: "#052e1f", border: `1px solid ${C.pareto}55`, color: C.pareto, borderRadius: "6px", padding: "3px 8px", fontSize: "12px", fontFamily: "monospace" }}>
                              {namn}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: "12px", color: C.faint }}>Ingen Paretofront registrerad för det här experimentet.</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Accuracy vs parametrar + Paretofront */}
      <div style={SEKTION}>
        <h2 style={RUBRIK}>Nuvarande jämförelse — accuracy kontra antal parametrar</h2>
        <p style={INGRESS}>
          {featured.experiment_id ? (
            <>Senaste fullständiga arkitekturjämförelsen: <strong style={{ color: C.text }}>{naturligtNamn(featured.experiment_id)}</strong>{featured.dataset ? <> på <strong style={{ color: C.text }}>{featured.dataset}</strong></> : null}. </>
          ) : null}
          Grönt markerar arkitekturer på Paretofronten — ingen annan testad arkitektur slår dem på både
          accuracy och parameterantal samtidigt. Uppdateras automatiskt när ett nytt experiment blir det
          senaste med en fullständig sammanfattning.
        </p>

        {arkitekturer.length === 0 ? (
          <div style={TOM}>Ingen arkitekturjämförelse publicerad ännu.</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart margin={{ top: 20, right: 24, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis
                  type="number"
                  dataKey="parameters"
                  name="Parametrar"
                  domain={["dataMin", "dataMax"]}
                  tick={{ fill: C.faint, fontSize: 11 }}
                  tickLine={false}
                  tickFormatter={v => v.toLocaleString("sv-SE")}
                  label={{ value: "Parametrar", position: "insideBottom", offset: -4, fill: C.faint, fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="mean_accuracy"
                  name="Accuracy"
                  domain={[yMin - yPad, yMax + yPad]}
                  tick={{ fill: C.faint, fontSize: 11 }}
                  tickLine={false}
                  tickFormatter={v => fmtPct(v, 0)}
                />
                <ZAxis range={[80, 80]} />
                <Tooltip
                  {...TOOLTIP_STYLE}
                  cursor={{ strokeDasharray: "3 3" }}
                  formatter={(v, name) => name === "mean_accuracy" ? [fmtPct(v, 2), "Snittresultat"] : name === "parameters" ? [v.toLocaleString("sv-SE"), "Parametrar"] : [v, name]}
                  labelFormatter={() => ""}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const p = payload[0].payload;
                    return (
                      <div style={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "8px", padding: "10px 12px" }}>
                        <div style={{ fontWeight: 700, color: C.text, marginBottom: "4px", fontFamily: "monospace" }}>{p.architecture}</div>
                        <div style={{ color: C.dim, fontSize: "12px" }}>Parametrar: {p.parameters?.toLocaleString("sv-SE")}</div>
                        <div style={{ color: C.dim, fontSize: "12px" }}>
                          Snittresultat: {fmtPct(p.mean_accuracy, 2)}{typeof p.std_accuracy === "number" ? ` ± ${(p.std_accuracy * 100).toFixed(2)}` : ""}
                        </div>
                        <div style={{ color: p.pareto ? C.pareto : C.faint, fontSize: "12px", marginTop: "2px" }}>
                          {p.pareto ? "På Paretofronten" : "Inte på Paretofronten"}
                        </div>
                      </div>
                    );
                  }}
                />
                <Scatter data={arkitekturer.filter(a => !a.pareto)} fill={C.ickePareto}>
                  <LabelList dataKey="architecture" position="top" style={{ fill: C.faint, fontSize: 10, fontFamily: "monospace" }} />
                </Scatter>
                <Scatter data={arkitekturer.filter(a => a.pareto)} fill={C.pareto}>
                  <LabelList dataKey="architecture" position="top" style={{ fill: C.pareto, fontSize: 10, fontFamily: "monospace" }} />
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>

            <div style={{ overflowX: "auto", marginTop: "20px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.faint, textAlign: "left" }}>
                    <th style={{ padding: "8px 10px" }}>Arkitektur</th>
                    <th style={{ padding: "8px 10px" }}>Parametrar</th>
                    <th style={{ padding: "8px 10px" }}>Snittresultat</th>
                    <th style={{ padding: "8px 10px" }}>Std.avv</th>
                    {extraArkFalt.map(k => (
                      <th key={k} style={{ padding: "8px 10px" }}>{humaniseraNyckel(k)}</th>
                    ))}
                    <th style={{ padding: "8px 10px" }}>Pareto</th>
                  </tr>
                </thead>
                <tbody>
                  {[...arkitekturer].sort((a, b) => (a.parameters || 0) - (b.parameters || 0)).map(a => (
                    <tr key={a.architecture} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: "8px 10px", fontFamily: "monospace", color: C.text }}>{a.architecture}</td>
                      <td style={{ padding: "8px 10px", color: C.dim }}>{typeof a.parameters === "number" ? a.parameters.toLocaleString("sv-SE") : "–"}</td>
                      <td style={{ padding: "8px 10px", color: C.text }}>{fmtPct(a.mean_accuracy, 2)}</td>
                      <td style={{ padding: "8px 10px", color: C.faint }}>{typeof a.std_accuracy === "number" ? `± ${(a.std_accuracy * 100).toFixed(2)}` : "–"}</td>
                      {extraArkFalt.map(k => (
                        <td key={k} style={{ padding: "8px 10px", color: C.accent }}>{k in a ? formatVarde(a[k]) : "–"}</td>
                      ))}
                      <td style={{ padding: "8px 10px" }}>
                        {a.pareto ? (
                          <span style={{ color: C.pareto, fontWeight: 600 }}>✓ Pareto</span>
                        ) : (
                          <span style={{ color: C.faint }}>–</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Provenance */}
      <div style={{ fontSize: "12px", color: C.faint, textAlign: "center", lineHeight: 1.7, padding: "8px 0 24px" }}>
        {provenance.source && <div>{provenance.source}</div>}
        {provenance.note && <div>{provenance.note}</div>}
        {data.generated_at_utc && <div style={{ marginTop: "4px" }}>Senast genererad: {fmtDatum(data.generated_at_utc)}</div>}
        <div style={{ marginTop: "8px" }}>
          <a href={repoUrl} target="_blank" rel="noopener noreferrer" style={{ color: C.accent, textDecoration: "none" }}>
            Läs mer i forskningsrepot →
          </a>
        </div>
      </div>
    </main>
  );
}
