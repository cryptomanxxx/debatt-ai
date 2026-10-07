"use client";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const C = {
  bg: "#0a0a0f", panel: "#111118", border: "#1f1f2a",
  text: "#e5e7eb", dim: "#9ca3af", faint: "#6b7280", grid: "#1f1f2a", accent: "#4a9eff",
};

// Statusfärger är reserverade för status och visas alltid med etikett.
const STATUS = [
  { key: "ok", label: "OK", farg: "#0ca30c" },
  { key: "rate_limited", label: "Rate limit (429)", farg: "#fab219" },
  { key: "timeout", label: "Timeout", farg: "#ec835a" },
  { key: "error", label: "Fel", farg: "#d03b3b" },
];

// Fast färg per provider (följer providern, aldrig dess placering i rankingen).
// Validerad mot sajtens mörka bakgrund med dataviz-validatorn. Okända
// providers blir grå.
const PROVIDER_FARG = {
  groq: "#3987e5", deepseek: "#d95926", mistral: "#199e70",
  cloudflare: "#d55181", gemini: "#008300", openrouter: "#9085e9",
};
const providerFarg = (p) => PROVIDER_FARG[p] || "#6b7280";

const SEKTION = { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 20px 16px", marginBottom: 20 };
const RUBRIK = { color: C.text, fontSize: 17, fontWeight: 600, margin: "0 0 4px" };
const INGRESS = { color: C.faint, fontSize: 13, lineHeight: 1.6, margin: "0 0 16px" };
const TOOLTIP = {
  contentStyle: { background: "#16161f", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 },
  labelStyle: { color: C.text }, itemStyle: { color: C.dim },
};
const TH = { textAlign: "left", color: C.faint, fontWeight: 500, padding: "6px 8px", borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" };
const TD = { color: C.dim, padding: "7px 8px", borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" };

// Legendtext i neutral färg; färgen bärs av markeringen bredvid.
const legendText = (v) => <span style={{ color: C.dim }}>{v}</span>;
// itemSorter null: Recharts 3 sorterar annars legenden alfabetiskt.
const LEGEND = { wrapperStyle: { fontSize: 12 }, formatter: legendText, itemSorter: null };

const pct = (x) => (x == null ? "–" : `${(x * 100).toFixed(1)} %`);
const ms = (x) => (x == null ? "–" : x >= 1000 ? `${(x / 1000).toFixed(1)} s` : `${Math.round(x)} ms`);
const tal = (x) => (x == null ? "–" : x.toLocaleString("sv-SE"));

function Pill({ etikett, varde }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 16px", minWidth: 120, flex: "1 1 120px" }}>
      <div style={{ color: C.faint, fontSize: 12 }}>{etikett}</div>
      <div style={{ color: C.text, fontSize: 22, fontWeight: 600, marginTop: 2 }}>{varde}</div>
    </div>
  );
}

function ProviderNamn({ namn }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.text }}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: providerFarg(namn), flexShrink: 0 }} />
      {namn}
    </span>
  );
}

export default function AiStatistikVy({ data, fel, ranking }) {
  if (!data) {
    return (
      <main style={{ background: C.bg, minHeight: "100vh", padding: "40px 16px", color: C.text }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h1 style={{ fontSize: 28 }}>AI-statistik</h1>
          <p style={{ color: C.dim }}>Statistiken kunde inte hämtas just nu{fel ? ` (${fel})` : ""}. Försök igen om en stund.</p>
        </div>
      </main>
    );
  }

  const { totalt, total, okAndel, p50, perProvider, perKalla, daglig, dagligOk, dagligAnrop = [], avkortad, dagar } = data;

  // Providers i fallback-kedjan som inte gjort något anrop under perioden
  // läggs till med noll, så att alla providers i kedjan syns i tabellen.
  const rankade = ranking?.ranked_order || [];
  const medAnrop = new Set(perProvider.map(p => p.namn));
  const allaProviders = [
    ...perProvider,
    ...rankade.filter(p => !medAnrop.has(p)).map(namn => ({
      namn, totalt: 0, ok: 0, rate_limited: 0, timeout: 0, error: 0, okAndel: null, p50: null, p90: null,
    })),
  ];
  // Staplarnas ordning följer fallback-kedjan, övriga providers sist.
  const ordnade = [
    ...rankade.filter(p => medAnrop.has(p)),
    ...perProvider.map(p => p.namn).filter(p => !rankade.includes(p)),
  ];

  const linjeProviders = perProvider.filter(p => p.totalt >= 20).map(p => p.namn);
  const ejILinje = allaProviders.filter(p => p.totalt < 20);
  const latensData = perProvider.filter(p => p.p50 != null).map(p => ({ namn: p.namn, p50: p.p50, p90: p.p90 }));
  const ejILatens = allaProviders.filter(p => p.p50 == null);
  const fattigaNamn = (lista) => lista.map(p => `${p.namn} (${tal(p.totalt)} anrop)`).join(", ");

  return (
    <main style={{ background: C.bg, minHeight: "100vh", padding: "40px 16px", color: C.text }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <h1 style={{ fontSize: 30, margin: "0 0 8px" }}>AI-statistik</h1>
        <p style={{ color: C.dim, fontSize: 14, lineHeight: 1.7, margin: "0 0 8px" }}>
          Varje AI-anrop plattformen gör loggas i tabellen <code>ai_log</code>: vilken provider som svarade,
          om anropet lyckades och hur lång tid det tog. Samma data styr den dagliga rankingen av
          fallback-kedjan i <code>provider_benchmark.py</code>. Siffrorna gäller de senaste {dagar} dagarna.
        </p>
        <p style={{ color: C.faint, fontSize: 13, lineHeight: 1.6, margin: "0 0 24px" }}>
          Sedan 7 oktober 2026 loggar alla skript. Innan dess saknades flera dagliga körningar, så äldre
          dagar kan ge en skev bild.{avkortad ? " Visar de senaste 50 000 anropen." : ""}
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          <Pill etikett={`AI-anrop (${dagar} d)`} varde={tal(totalt)} />
          <Pill etikett="Lyckade" varde={pct(okAndel)} />
          <Pill etikett="Median-latens (lyckade)" varde={ms(p50)} />
          <Pill etikett="Rate limit (429)" varde={tal(total.rate_limited)} />
          <Pill etikett="Providers" varde={tal(perProvider.length)} />
        </div>

        {ranking && (
          <section style={SEKTION}>
            <h2 style={RUBRIK}>Aktuell fallback-ordning</h2>
            <p style={INGRESS}>
              Ordningen som Python-skripten och de flesta API-routes provar providers i, satt av den dagliga benchmarken.
              En provider längre ned anropas bara när alla ovanför den misslyckas i samma anrop, så den kan få få
              eller inga anrop även när den fungerar. Placeringen säger alltså inget om hur mycket den används.
            </p>
            <ol style={{ display: "flex", flexWrap: "wrap", gap: 8, listStyle: "none", padding: 0, margin: 0 }}>
              {ranking.ranked_order.map((p, i) => (
                <li key={p} style={{ border: `1px solid ${C.border}`, borderRadius: 999, padding: "4px 12px", fontSize: 13 }}>
                  <span style={{ color: C.faint, marginRight: 6 }}>{i + 1}.</span><ProviderNamn namn={p} />
                </li>
              ))}
            </ol>
          </section>
        )}

        <section style={SEKTION}>
          <h2 style={RUBRIK}>Anrop per dag</h2>
          <p style={INGRESS}>Alla AI-anrop per dag, uppdelade på utfall.</p>
          {daglig.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={daglig} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid stroke={C.grid} vertical={false} />
                <XAxis dataKey="dag" tick={{ fill: C.faint, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.faint, fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP} cursor={{ fill: "#ffffff08" }} />
                <Legend {...LEGEND} />
                {STATUS.map((s, i) => (
                  <Bar key={s.key} dataKey={s.key} name={s.label} stackId="a" fill={s.farg}
                    stroke={C.panel} strokeWidth={1}
                    radius={i === STATUS.length - 1 ? [4, 4, 0, 0] : 0} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : <p style={{ color: C.faint }}>Inga anrop loggade ännu.</p>}
        </section>

        <section style={SEKTION}>
          <h2 style={RUBRIK}>Anrop per provider och dag</h2>
          <p style={INGRESS}>
            Hur många anrop varje provider tog emot per dag, i fallback-kedjans ordning. Providers med få anrop
            blir tunna staplar; hovra för exakta tal eller se tabellen Per provider.
          </p>
          {ordnade.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dagligAnrop} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid stroke={C.grid} vertical={false} />
                <XAxis dataKey="dag" tick={{ fill: C.faint, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.faint, fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP} cursor={{ fill: "#ffffff08" }} />
                <Legend {...LEGEND} />
                {ordnade.map((p, i) => (
                  <Bar key={p} dataKey={p} name={p} stackId="p" fill={providerFarg(p)}
                    stroke={C.panel} strokeWidth={1}
                    radius={i === ordnade.length - 1 ? [4, 4, 0, 0] : 0} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : <p style={{ color: C.faint }}>Inga anrop loggade ännu.</p>}
        </section>

        <section style={SEKTION}>
          <h2 style={RUBRIK}>Andel lyckade anrop per provider och dag</h2>
          <p style={INGRESS}>Providers med minst 20 anrop under perioden. En dag med färre än 5 anrop för en provider visas som en lucka.</p>
          {linjeProviders.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dagligOk} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid stroke={C.grid} vertical={false} />
                <XAxis dataKey="dag" tick={{ fill: C.faint, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} unit=" %" tick={{ fill: C.faint, fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP} formatter={(v) => (v == null ? "–" : `${v} %`)} />
                <Legend {...LEGEND} />
                {linjeProviders.map(p => (
                  <Line key={p} type="linear" dataKey={p} name={p} stroke={providerFarg(p)} strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 0, fill: providerFarg(p) }} connectNulls={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : <p style={{ color: C.faint }}>För lite data ännu.</p>}
          {ejILinje.length > 0 && (
            <p style={{ color: C.faint, fontSize: 12, margin: "10px 0 0" }}>Visas inte (under 20 anrop): {fattigaNamn(ejILinje)}.</p>
          )}
        </section>

        <section style={SEKTION}>
          <h2 style={RUBRIK}>Latens per provider</h2>
          <p style={INGRESS}>Svarstid för lyckade anrop: median (p50) och de 10 % långsammaste (p90).</p>
          {latensData.length ? (
            <ResponsiveContainer width="100%" height={Math.max(160, latensData.length * 44)}>
              <BarChart data={latensData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }} barGap={2}>
                <CartesianGrid stroke={C.grid} horizontal={false} />
                <XAxis type="number" tickFormatter={ms} tick={{ fill: C.faint, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="namn" width={90} tick={{ fill: C.dim, fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP} cursor={{ fill: "#ffffff08" }} formatter={(v) => ms(v)} />
                <Legend {...LEGEND} />
                <Bar dataKey="p50" name="Median (p50)" fill="#3987e5" radius={[0, 4, 4, 0]} />
                <Bar dataKey="p90" name="p90" fill="#86b6ef" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p style={{ color: C.faint }}>Ingen latensdata ännu.</p>}
          {ejILatens.length > 0 && (
            <p style={{ color: C.faint, fontSize: 12, margin: "10px 0 0" }}>Inga lyckade anrop att mäta: {fattigaNamn(ejILatens)}.</p>
          )}
        </section>

        <section style={SEKTION}>
          <h2 style={RUBRIK}>Per provider</h2>
          <p style={INGRESS}>Alla utfall per provider under perioden, inklusive providers i fallback-kedjan som inte anropats alls.</p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr>
                <th style={TH}>Provider</th><th style={TH}>Anrop</th><th style={TH}>Lyckade</th>
                <th style={TH}>429</th><th style={TH}>Timeout</th><th style={TH}>Fel</th>
                <th style={TH}>p50</th><th style={TH}>p90</th>
              </tr></thead>
              <tbody>
                {allaProviders.map(p => (
                  <tr key={p.namn}>
                    <td style={TD}><ProviderNamn namn={p.namn} /></td>
                    <td style={TD}>{tal(p.totalt)}</td><td style={TD}>{pct(p.okAndel)}</td>
                    <td style={TD}>{tal(p.rate_limited)}</td><td style={TD}>{tal(p.timeout)}</td><td style={TD}>{tal(p.error)}</td>
                    <td style={TD}>{ms(p.p50)}</td><td style={TD}>{ms(p.p90)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={SEKTION}>
          <h2 style={RUBRIK}>Mest aktiva källor</h2>
          <p style={INGRESS}>De 15 skript och routes som gjort flest AI-anrop (fältet <code>source</code>).</p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr>
                <th style={TH}>Källa</th><th style={TH}>Anrop</th><th style={TH}>Lyckade</th><th style={TH}>Vanligaste provider</th>
              </tr></thead>
              <tbody>
                {perKalla.map(k => (
                  <tr key={k.namn}>
                    <td style={{ ...TD, color: C.text }}>{k.namn}</td>
                    <td style={TD}>{tal(k.totalt)}</td><td style={TD}>{pct(k.okAndel)}</td>
                    <td style={TD}>{k.huvudprovider ? <ProviderNamn namn={k.huvudprovider} /> : "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
