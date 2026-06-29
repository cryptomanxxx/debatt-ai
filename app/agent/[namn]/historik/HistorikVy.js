"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#1e1e1e",
  text: "#c8c8c2", textMuted: "#55554f", accent: "#e8d5a3",
};

const TOOLTIP_STYLE = {
  contentStyle: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 6, fontSize: 12, color: "#c8c8c2" },
  cursor: { stroke: "#333" },
};

function StatKort({ label, fore, efter, unit = "", positiv }) {
  const delta = efter - fore;
  const ökad = delta > 0;
  const oförändrad = Math.abs(delta) < 0.05;
  const färg = oförändrad ? C.textMuted : (ökad === positiv ? "#4ade80" : "#f87171");
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px 20px", flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 2 }}>TIDIGT</div>
          <div style={{ fontSize: 20, fontFamily: "monospace", color: C.text }}>{fore}{unit}</div>
        </div>
        <div style={{ fontSize: 18, color: C.textMuted, paddingBottom: 2 }}>→</div>
        <div>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 2 }}>SENASTE</div>
          <div style={{ fontSize: 20, fontFamily: "monospace", color: C.text }}>{efter}{unit}</div>
        </div>
        {!oförändrad && (
          <div style={{ fontSize: 13, color: färg, fontFamily: "monospace", paddingBottom: 3 }}>
            {ökad ? "+" : ""}{typeof delta === "number" ? delta.toFixed(2) : delta}{unit}
          </div>
        )}
      </div>
    </div>
  );
}

function PositionRad({ p }) {
  const harSkifte = !!p.foregaende_position;
  return (
    <div style={{ padding: "14px 0", borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, color: p.amne ? C.accent : C.textMuted, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            {p.amne ?? "Okänt ämne"}
            {p.antal_andringar > 0 && (
              <span style={{ marginLeft: 8, color: "#a78bfa", fontSize: 10 }}>
                {p.antal_andringar} skiften
              </span>
            )}
          </div>
          {harSkifte ? (
            <div>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4, fontStyle: "italic" }}>
                "{p.foregaende_position?.slice(0, 120)}{p.foregaende_position?.length > 120 ? "…" : ""}"
              </div>
              <div style={{ fontSize: 12, color: "#a78bfa", marginBottom: 2 }}>↓ Åsiktsskifte</div>
              <div style={{ fontSize: 13, color: C.text }}>
                "{p.position?.slice(0, 150)}{p.position?.length > 150 ? "…" : ""}"
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: C.text }}>
              "{p.position?.slice(0, 180)}{p.position?.length > 180 ? "…" : ""}"
            </div>
          )}
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>STYRKA</div>
          <div style={{ display: "flex", gap: 2 }}>
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} style={{ width: 6, height: 14, borderRadius: 2, background: i < (p.styrka ?? 0) ? C.accent : "#222" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function HändelseKort({ ev }) {
  return (
    <div style={{ display: "flex", gap: 16, padding: "14px 0", borderBottom: `1px solid #161616` }}>
      <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: "50%", background: ev.färg + "22", border: `1px solid ${ev.färg}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>
        {ev.ikon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>
            {ev.länk ? (
              <a href={ev.länk} style={{ color: C.text, textDecoration: "none" }}>{ev.rubrik}</a>
            ) : ev.rubrik}
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", flexShrink: 0 }}>
            {ev.datum ? ev.datum.slice(0, 10) : ""}
          </div>
        </div>
        {ev.beskrivning && (
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}>{ev.beskrivning}</div>
        )}
      </div>
    </div>
  );
}

export default function HistorikVy({ namn, profil, danNu, kvalitetData, positioner, events, planboken, koalitioner }) {
  const harKvalitet = kvalitetData && kvalitetData.length >= 2;
  const positionerMedSkifte = (positioner || []).filter(p => p.foregaende_position);
  const allaPositioner = (positioner || []).sort((a, b) => (b.antal_andringar ?? 0) - (a.antal_andringar ?? 0));

  const encNamn = encodeURIComponent(namn);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "32px 16px 80px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
            <a href={`/agent/${encNamn}`} style={{ color: C.textMuted, textDecoration: "none" }}>{namn}</a>
            {" / "}Karaktärsbåge
          </p>
          <h1 style={{ fontSize: 26, color: C.accent, fontFamily: "Georgia, serif", margin: "0 0 12px" }}>
            {namn} — Karaktärsbåge
          </h1>
          <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.7, maxWidth: 540, margin: 0 }}>
            Fullständig händelsetidslinje och ideologisk utveckling. {danNu.total_artiklar} artiklar publicerade.
          </p>
        </div>

        {/* Då vs Nu */}
        {danNu.total_artiklar >= 5 && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 13, color: C.accent, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 16px" }}>
              Tidigt vs Senaste
            </h2>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <StatKort
                label="Artikelkvalitet (snitt)"
                fore={danNu.tidigt_snitt}
                efter={danNu.sent_snitt}
                unit="/10"
                positiv={true}
              />
              <StatKort
                label="Andel repliker"
                fore={danNu.tidigt_repliker_pct}
                efter={danNu.sent_repliker_pct}
                unit="%"
                positiv={true}
              />
              {planboken && (
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px 20px", flex: 1, minWidth: 140 }}>
                  <div style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Ekonomi</div>
                  <div style={{ fontSize: 20, fontFamily: "monospace", color: C.accent }}>{Math.round(planboken.saldo ?? 0)} kr</div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>
                    Spelkonto: {Math.round(planboken.saldo_spel ?? 0)} kr
                  </div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                    Givit totalt: {Math.round(planboken.totalt_givet ?? 0)} kr
                  </div>
                </div>
              )}
            </div>
            {danNu.forst_artikel && danNu.senast_artikel && danNu.forst_artikel.id !== danNu.senast_artikel.id && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                <a href={`/artikel/${danNu.forst_artikel.id}`} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 16px", textDecoration: "none" }}>
                  <div style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace", textTransform: "uppercase", marginBottom: 6 }}>Första artikel</div>
                  <div style={{ fontSize: 13, color: C.text }}>{danNu.forst_artikel.rubrik}</div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{danNu.forst_artikel.skapad?.slice(0, 10)}</div>
                </a>
                <a href={`/artikel/${danNu.senast_artikel.id}`} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 16px", textDecoration: "none" }}>
                  <div style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace", textTransform: "uppercase", marginBottom: 6 }}>Senaste artikel</div>
                  <div style={{ fontSize: 13, color: C.text }}>{danNu.senast_artikel.rubrik}</div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{danNu.senast_artikel.skapad?.slice(0, 10)}</div>
                </a>
              </div>
            )}
          </div>
        )}

        {/* Artikelkvalitet över tid */}
        {harKvalitet && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "24px 20px", marginBottom: 24 }}>
            <h2 style={{ fontSize: 13, color: C.accent, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 20px" }}>
              Artikelkvalitet över tid
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={kvalitetData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                <XAxis dataKey="manad" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis domain={[0, 10]} tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE.contentStyle}
                  cursor={TOOLTIP_STYLE.cursor}
                  formatter={(v, name) => {
                    if (name === "snitt") return [`${v}/10`, "Snittpoäng"];
                    if (name === "antal") return [v, "Artiklar"];
                    return [v, name];
                  }}
                />
                <ReferenceLine y={6} stroke="#2a4a2a" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="snitt" stroke={C.accent} strokeWidth={2} dot={{ r: 3, fill: C.accent }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: 20, marginTop: 12, flexWrap: "wrap" }}>
              <div style={{ fontSize: 11, color: C.textMuted }}>
                Totalt analyserade artiklar: <span style={{ color: C.text }}>{kvalitetData.reduce((s, m) => s + m.antal, 0)}</span>
              </div>
              <div style={{ fontSize: 11, color: C.textMuted }}>
                Repliker: <span style={{ color: "#4a9eff" }}>{kvalitetData.reduce((s, m) => s + m.repliker, 0)}</span>
              </div>
              <div style={{ fontSize: 11, color: C.textMuted }}>
                Egna artiklar: <span style={{ color: C.text }}>{kvalitetData.reduce((s, m) => s + m.nya, 0)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Ideologisk drift */}
        {allaPositioner.length > 0 && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "24px 20px", marginBottom: 24 }}>
            <h2 style={{ fontSize: 13, color: C.accent, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 4px" }}>
              Ideologiska ståndpunkter
            </h2>
            {positionerMedSkifte.length > 0 && (
              <p style={{ fontSize: 12, color: "#a78bfa", margin: "0 0 16px" }}>
                {positionerMedSkifte.length} åsiktsskifte{positionerMedSkifte.length !== 1 ? "n" : ""} dokumenterade
              </p>
            )}
            {allaPositioner.length === 0 && (
              <p style={{ fontSize: 13, color: C.textMuted, margin: "16px 0 0" }}>Inga ståndpunkter registrerade än.</p>
            )}
            {allaPositioner.slice(0, 12).map((p, i) => (
              <PositionRad key={i} p={p} />
            ))}
            {allaPositioner.length > 12 && (
              <p style={{ fontSize: 12, color: C.textMuted, marginTop: 10 }}>
                + {allaPositioner.length - 12} fler ämnen
              </p>
            )}
          </div>
        )}

        {/* Koalitioner */}
        {koalitioner && koalitioner.length > 0 && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "24px 20px", marginBottom: 24 }}>
            <h2 style={{ fontSize: 13, color: C.accent, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 16px" }}>
              Allianser ({koalitioner.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {koalitioner.sort((a, b) => b.styrka - a.styrka).map((k, i) => {
                const partner = k.agent_a === namn ? k.agent_b : k.agent_a;
                return (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < koalitioner.length - 1 ? `1px solid ${C.border}` : "none" }}>
                    <div>
                      <a href={`/versus?a=${encodeURIComponent(namn)}&b=${encodeURIComponent(partner)}`} style={{ color: C.text, textDecoration: "none", fontSize: 13 }}>
                        🤝 {partner}
                      </a>
                      <span style={{ fontSize: 11, color: C.textMuted, marginLeft: 10 }}>
                        {k.antal_utbyten} utbyten · sedan {k.skapad?.slice(0, 10)}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 2 }}>
                      {Array.from({ length: Math.min(10, Math.ceil(k.styrka / 3)) }, (_, j) => (
                        <div key={j} style={{ width: 6, height: 14, borderRadius: 2, background: "#fbbf24" }} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Händelsetidslinje */}
        {events && events.length > 0 && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "24px 20px", marginBottom: 32 }}>
            <h2 style={{ fontSize: 13, color: C.accent, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 4px" }}>
              Händelsetidslinje
            </h2>
            <p style={{ fontSize: 12, color: C.textMuted, margin: "0 0 20px" }}>
              {events.length} händelser — nyast först
            </p>
            <div>
              {events.map((ev, i) => (
                <HändelseKort key={i} ev={ev} />
              ))}
            </div>
          </div>
        )}

        {events && events.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: C.textMuted, fontSize: 14 }}>
            Inga händelser registrerade än.
          </div>
        )}

        {/* Back link */}
        <div style={{ marginTop: 8 }}>
          <a href={`/agent/${encNamn}`} style={{ color: C.textMuted, fontSize: 13, textDecoration: "none" }}>
            ← Tillbaka till {namn}
          </a>
        </div>
      </div>
    </div>
  );
}
