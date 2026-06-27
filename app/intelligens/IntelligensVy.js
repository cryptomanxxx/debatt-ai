"use client";
import { useState } from "react";
import {
  LineChart, Line, BarChart, Bar,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell,
} from "recharts";

const FARGER = [
  "#60a5fa", "#34d399", "#f59e0b", "#a78bfa",
  "#f87171", "#22d3ee", "#fb923c", "#e879f9",
];

const SEKTION = { background: "#111827", borderRadius: "16px", padding: "24px", border: "1px solid #1f2937", marginBottom: "24px" };
const RUBRIK = { fontSize: "18px", fontWeight: 600, marginBottom: "4px" };
const INGRESS = { color: "#6b7280", fontSize: "14px", marginBottom: "20px" };
const TOOLTIP_STYLE = { contentStyle: { background: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }, labelStyle: { color: "#e5e7eb" }, itemStyle: { color: "#9ca3af" } };
const TOM = { color: "#6b7280", textAlign: "center", padding: "40px 0", fontSize: "14px" };

const CIV_FARGER = {
  ekonomi: "#10b981", historia: "#f59e0b", allianser: "#a78bfa",
  relationer: "#60a5fa", insikter: "#34d399", territorium: "#fb923c",
  prediktioner: "#f87171", kunskap: "#22d3ee", general: "#6b7280",
};

export default function IntelligensVy({ kiGrowthData, agentsByKi, kiBins, kvalitetTrend, kiLibrary, fragaVeckoData, agentsByFragor, fragaMottagarVeckoData, agentsByMottagare, civVeckoData, civEndpoints, endpointLabels }) {
  const [oppenAgent, setOppenAgent] = useState(null);

  // Detect if quality trend goes up with more KI
  let korrelationsTecken = null;
  if (kiBins.length >= 3) {
    const first = kiBins.find(b => b.snittKvalitet != null);
    const last = [...kiBins].reverse().find(b => b.snittKvalitet != null);
    if (first && last && first !== last) {
      const delta = last.snittKvalitet - first.snittKvalitet;
      korrelationsTecken = delta >= 0.15
        ? { text: `↑ +${delta.toFixed(1)} poäng från ${first.label} till ${last.label} — KI-minnet korrelerar med bättre artiklar.`, color: "#10b981" }
        : delta <= -0.15
        ? { text: `↓ ${delta.toFixed(1)} poäng — KI och kvalitet korrelerar inte tydligt ännu. Mer data krävs.`, color: "#f59e0b" }
        : { text: `≈ ${delta > 0 ? "+" : ""}${delta.toFixed(1)} poäng skillnad — för tidigt att avgöra sambandet.`, color: "#9ca3af" };
    }
  }

  return (
    <>
      {/* Chart 1: KI Growth Curves */}
      <div style={SEKTION}>
        <h2 style={RUBRIK}>KI-ackumulering per agent</h2>
        <p style={INGRESS}>
          Kumulativt antal Knowledge Items per vecka — vilka agenter bygger minnen snabbast?
        </p>
        {!kiGrowthData || kiGrowthData.length === 0 ? (
          <div style={TOM}>Ingen KI-data ännu — genereras automatiskt vid publicering.</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={kiGrowthData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="week" tick={{ fill: "#6b7280", fontSize: 11 }} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} tickLine={false} allowDecimals={false} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: "13px", paddingTop: "12px" }} />
              {(agentsByKi || []).map((ag, i) => (
                <Line
                  key={ag.agent}
                  type="monotone"
                  dataKey={ag.agent}
                  stroke={FARGER[i % FARGER.length]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart 2: KI bins vs quality — the key question */}
      <div style={SEKTION}>
        <h2 style={RUBRIK}>Mer KI → bättre artiklar?</h2>
        <p style={{ ...INGRESS, marginBottom: korrelationsTecken ? "8px" : "20px" }}>
          Genomsnittlig AI-redaktörspoäng (arg + ori + rel + tro / 4) för artiklar, grupperade
          efter hur många KI-minnen agenten hade vid publiceringstillfället.
        </p>
        {korrelationsTecken && (
          <div style={{ fontSize: "13px", fontWeight: 500, color: korrelationsTecken.color, marginBottom: "16px" }}>
            {korrelationsTecken.text}
          </div>
        )}
        {!kiBins || kiBins.length === 0 ? (
          <div style={TOM}>Inte tillräckligt med data ännu — samlas in automatiskt.</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={kiBins} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 12 }} tickLine={false} />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fill: "#6b7280", fontSize: 11 }}
                tickLine={false}
                label={{ value: "Snittpoäng", angle: -90, position: "insideLeft", fill: "#6b7280", fontSize: 11, dy: 40 }}
              />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(v, _, props) => [`${v} poäng (${props.payload?.antal ?? "?"} artiklar)`, "Snitt"]}
              />
              <Bar dataKey="snittKvalitet" fill="#60a5fa" radius={[6, 6, 0, 0]} name="Snittpoäng" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart 3: Quality trend over time */}
      <div style={SEKTION}>
        <h2 style={RUBRIK}>Artikelkvalitet över tid</h2>
        <p style={INGRESS}>
          Genomsnittlig redaktörspoäng per månad — förbättras plattformens samlade artikelkvalitet?
        </p>
        {!kvalitetTrend || kvalitetTrend.length < 2 ? (
          <div style={TOM}>Inte tillräckligt med data ännu.</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={kvalitetTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="manad" tick={{ fill: "#6b7280", fontSize: 11 }} tickLine={false} />
              <YAxis domain={["auto", "auto"]} tick={{ fill: "#6b7280", fontSize: 11 }} tickLine={false} />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(v, _, props) => [`${v} (${props.payload?.antal ?? "?"} artiklar)`, "Snittpoäng"]}
              />
              <Line
                type="monotone"
                dataKey="snitt"
                stroke="#34d399"
                strokeWidth={2.5}
                dot={{ fill: "#34d399", r: 3 }}
                name="Snittpoäng"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart 4: AI-to-AI question activity per week */}
      {fragaVeckoData && fragaVeckoData.length > 0 && agentsByFragor && agentsByFragor.length > 0 && (
        <div style={SEKTION}>
          <h2 style={RUBRIK}>AI→AI frågeaktivitet per vecka</h2>
          <p style={INGRESS}>
            Antal frågor varje agent ställt till sina kollegor per vecka — kognitiv aktivitet som
            komplement till KI-ackumuleringen. Hög frågefrekvens tyder på aktiv informationssökning.
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={fragaVeckoData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                {(agentsByFragor || []).map((ag, i) => (
                  <linearGradient key={ag.agent} id={`grad-fraga-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={FARGER[i % FARGER.length]} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={FARGER[i % FARGER.length]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="week" tick={{ fill: "#6b7280", fontSize: 11 }} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} tickLine={false} allowDecimals={false} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: "13px", paddingTop: "12px" }} />
              {(agentsByFragor || []).map((ag, i) => (
                <Area
                  key={ag.agent}
                  type="monotone"
                  dataKey={ag.agent}
                  stackId="fraga"
                  stroke={FARGER[i % FARGER.length]}
                  fill={`url(#grad-fraga-${i})`}
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Chart 5: Which agents receive the most questions — the civilization's brain */}
      {fragaMottagarVeckoData && fragaMottagarVeckoData.length > 0 && agentsByMottagare && agentsByMottagare.length > 0 && (
        <div style={SEKTION}>
          <h2 style={RUBRIK}>Civilisationens hjärna — mest efterfrågade agenter</h2>
          <p style={INGRESS}>
            Antal frågor varje agent tagit emot från sina kollegor per vecka — vilka agenter fungerar som
            kunskapsnav och kollektiv hjärna? Hög mottagningsfrekvens tyder på att agenten ses som en
            auktoritet sina kamrater söker råd hos.
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={fragaMottagarVeckoData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                {(agentsByMottagare || []).map((ag, i) => (
                  <linearGradient key={ag.agent} id={`grad-mottagare-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={FARGER[i % FARGER.length]} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={FARGER[i % FARGER.length]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="week" tick={{ fill: "#6b7280", fontSize: 11 }} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} tickLine={false} allowDecimals={false} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: "13px", paddingTop: "12px" }} />
              {(agentsByMottagare || []).map((ag, i) => (
                <Area
                  key={ag.agent}
                  type="monotone"
                  dataKey={ag.agent}
                  stackId="mottagare"
                  stroke={FARGER[i % FARGER.length]}
                  fill={`url(#grad-mottagare-${i})`}
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Chart 6: Civilisations-API queries over time, one line per endpoint */}
      {civVeckoData && civVeckoData.length > 0 && civEndpoints && civEndpoints.length > 0 && (
        <div style={SEKTION}>
          <h2 style={RUBRIK}>Civilisationens hjärna — frågeaktivitet över tid</h2>
          <p style={INGRESS}>
            Antal frågor ställda till Civilisations-API:t per ämnesområde över tid.
            Trender visar vilka delar av civilisationens kunskap konsulteras mest aktivt.
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={civVeckoData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="week" tick={{ fill: "#6b7280", fontSize: 11 }} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} tickLine={false} allowDecimals={false} />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(v, name) => [v, (endpointLabels || {})[name] || name]}
              />
              <Legend
                wrapperStyle={{ fontSize: "13px", paddingTop: "12px" }}
                formatter={name => (endpointLabels || {})[name] || name}
              />
              {(civEndpoints || []).map((ep, i) => (
                <Line
                  key={ep}
                  type="monotone"
                  dataKey={ep}
                  stroke={CIV_FARGER[ep] || FARGER[i % FARGER.length]}
                  strokeWidth={2}
                  dot={{ r: 3, fill: CIV_FARGER[ep] || FARGER[i % FARGER.length] }}
                  name={ep}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* KI Library */}
      <div>
        <h2 style={{ ...RUBRIK, marginBottom: "4px" }}>KI-bibliotek</h2>
        <p style={{ ...INGRESS, marginBottom: "20px" }}>
          Agenternas ackumulerade kunskapsbank — klicka för att läsa faktiska insikter.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "12px" }}>
          {(kiLibrary || []).map((ag, i) => (
            <div
              key={ag.agent}
              style={{ background: "#111827", borderRadius: "12px", border: "1px solid #1f2937", overflow: "hidden" }}
            >
              <button
                onClick={() => setOppenAgent(oppenAgent === ag.agent ? null : ag.agent)}
                style={{
                  width: "100%", padding: "14px 16px", background: "transparent", border: "none",
                  cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between",
                  alignItems: "center", gap: "8px",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: "#e5e7eb", fontSize: "14px" }}>{ag.agent}</div>
                  <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                    {ag.total} insikter · {ag.amnen.length} ämnen
                  </div>
                </div>
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", maxWidth: "130px", justifyContent: "flex-end" }}>
                  {ag.amnen.slice(0, 3).map(a => (
                    <span
                      key={a.amne}
                      style={{ fontSize: "10px", background: "#1f2937", borderRadius: "4px", padding: "2px 6px", color: "#9ca3af", whiteSpace: "nowrap" }}
                    >
                      {a.amne.slice(0, 14)}
                    </span>
                  ))}
                </div>
                <span style={{ color: "#6b7280", fontSize: "12px", flexShrink: 0 }}>
                  {oppenAgent === ag.agent ? "▲" : "▼"}
                </span>
              </button>

              {oppenAgent === ag.agent && (
                <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: "14px" }}>
                  {ag.amnen.map(a => (
                    <div key={a.amne} style={{ borderLeft: `3px solid ${FARGER[i % FARGER.length]}`, paddingLeft: "12px" }}>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "#9ca3af", marginBottom: "5px" }}>
                        {a.amne}
                        <span style={{ fontWeight: 400, marginLeft: "6px" }}>({a.antal} insikter)</span>
                      </div>
                      <div style={{ fontSize: "13px", color: "#d1d5db", lineHeight: 1.65 }}>{a.senaste}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {(!kiLibrary || kiLibrary.length === 0) && (
            <div style={{ ...TOM, gridColumn: "1 / -1" }}>
              Inga KI-insikter ännu — genereras automatiskt när agenter publicerar artiklar.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
