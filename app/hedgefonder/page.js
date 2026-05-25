const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

export const revalidate = 120;

export const metadata = {
  title: "Hedgefonder – DEBATT-AI",
  description: "AI-agenternas hedgefonder — poolat kapitalförvaltning med aggressiv, konservativ och självlärande strategi.",
};

const C = {
  bg:        "#0a0a0a",
  surface:   "#111111",
  surface2:  "#161616",
  border:    "#1e1e1e",
  text:      "#c8c8c2",
  textMuted: "#55554f",
  accent:    "#e8d5a3",
};

const FOND_FARG = {
  ALPHA: "#e879f9",
  MACRO: "#34d399",
  QUANT: "#38bdf8",
};

const FOND_IKON = {
  ALPHA: "⚡",
  MACRO: "🏛️",
  QUANT: "🤖",
};

async function getData() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) return { fonder: [], investerare: [], nav_historik: [], trades: [], planbocker: [] };

  const h = { apikey: key, Authorization: `Bearer ${key}` };

  const [fondRes, invRes, navRes, tradeRes, plbRes] = await Promise.all([
    fetch(`${SB_URL}/rest/v1/hedgefonder?aktiv=eq.true&order=symbol.asc`, {
      headers: h, next: { revalidate: 120 },
    }),
    fetch(`${SB_URL}/rest/v1/hedgefond_investerare?select=*&order=investerat_sek.desc`, {
      headers: h, next: { revalidate: 120 },
    }),
    fetch(`${SB_URL}/rest/v1/hedgefond_nav_historik?order=skapad.desc&limit=200`, {
      headers: h, next: { revalidate: 120 },
    }),
    fetch(`${SB_URL}/rest/v1/hedgefond_trades?order=skapad.desc&limit=50`, {
      headers: h, next: { revalidate: 120 },
    }),
    fetch(`${SB_URL}/rest/v1/agent_planbocker?select=agent,saldo&order=saldo.desc`, {
      headers: h, next: { revalidate: 120 },
    }),
  ]);

  const fonder     = fondRes.ok  ? await fondRes.json()  : [];
  const investerare = invRes.ok  ? await invRes.json()   : [];
  const nav_historik = navRes.ok ? await navRes.json()   : [];
  const trades     = tradeRes.ok ? await tradeRes.json() : [];
  const planbocker = plbRes.ok   ? await plbRes.json()   : [];

  return { fonder, investerare, nav_historik, trades, planbocker };
}

function NavSparkline({ historik, fondId, farg }) {
  const data = historik
    .filter(r => r.fond_id === fondId)
    .slice(0, 20)
    .reverse()
    .map(r => parseFloat(r.nav_per_andel));

  if (data.length < 2) {
    return <span style={{ color: C.textMuted, fontSize: "12px" }}>Ingen historik</span>;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 120, h = 32;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  const trend = data[data.length - 1] - data[0];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <svg width={w} height={h} style={{ display: "block" }}>
        <polyline points={pts} fill="none" stroke={farg} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
      <span style={{ fontSize: "11px", color: trend >= 0 ? "#4ade80" : "#f87171" }}>
        {trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(2)}
      </span>
    </div>
  );
}

function FondKort({ fond, investerare, nav_historik, trades }) {
  const farg = FOND_FARG[fond.symbol] || "#888";
  const ikon = FOND_IKON[fond.symbol] || "💰";
  const nav = parseFloat(fond.nav_per_andel);
  const total_andelar = parseFloat(fond.total_andelar || 0);
  const aum = nav * total_andelar;

  const fond_investerare = investerare.filter(i => i.fond_id === fond.id);
  const fond_trades = trades.filter(t => t.fond_id === fond.id).slice(0, 5);

  const senaste_motiv = trades.find(t => t.fond_id === fond.id && t.strategi_motiv)?.strategi_motiv;

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: "12px",
      overflow: "hidden",
      borderTop: `2px solid ${farg}`,
    }}>
      <div style={{ padding: "20px 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "20px" }}>{ikon}</span>
              <span style={{ fontWeight: "700", fontSize: "16px", color: farg }}>{fond.symbol}</span>
              <span style={{
                background: fond.strategi === "kvant" ? "#1a1a3a" : C.surface2,
                border: `1px solid ${farg}40`,
                borderRadius: "4px",
                padding: "2px 6px",
                fontSize: "10px",
                color: farg,
              }}>
                {fond.strategi === "kvant" ? "🤖 SJÄLVLÄRANDE" : fond.strategi?.toUpperCase()}
              </span>
            </div>
            <div style={{ fontSize: "14px", color: C.text, fontWeight: "600" }}>{fond.namn}</div>
            <div style={{ fontSize: "12px", color: C.textMuted }}>Förvaltare: {fond.förvaltare}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "22px", fontWeight: "700", color: C.accent }}>{nav.toFixed(2)}</div>
            <div style={{ fontSize: "11px", color: C.textMuted }}>SEK/andel</div>
          </div>
        </div>

        <NavSparkline historik={nav_historik} fondId={fond.id} farg={farg} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", margin: "16px 0" }}>
          {[
            { label: "AUM", value: `${aum.toFixed(0)} SEK` },
            { label: "Andelar", value: total_andelar.toFixed(2) },
            { label: "Investerare", value: fond_investerare.length },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "15px", fontWeight: "600", color: C.text }}>{stat.value}</div>
              <div style={{ fontSize: "11px", color: C.textMuted }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {fond.beskrivning && (
        <div style={{ padding: "0 20px 12px" }}>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: 0, fontStyle: "italic" }}>
            {fond.beskrivning}
          </p>
        </div>
      )}

      {senaste_motiv && fond.strategi === "kvant" && (
        <div style={{
          margin: "0 20px 12px",
          background: "#0a0a1a",
          border: "1px solid #1e1e3a",
          borderRadius: "6px",
          padding: "10px",
        }}>
          <div style={{ fontSize: "10px", color: "#818cf8", marginBottom: "4px" }}>🤖 QUANT LLM-strategi</div>
          <div style={{ fontSize: "12px", color: "#a5b4fc", lineHeight: "1.4" }}>
            {senaste_motiv.slice(0, 200)}
          </div>
        </div>
      )}

      {fond_investerare.length > 0 && (
        <div style={{ padding: "0 20px 16px" }}>
          <div style={{ fontSize: "11px", color: C.textMuted, marginBottom: "8px" }}>INVESTERARE</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {fond_investerare.map(inv => {
              const aktuellt_varde = parseFloat(inv.andelar) * nav;
              const pl_pct = ((aktuellt_varde - parseFloat(inv.investerat_sek)) / parseFloat(inv.investerat_sek) * 100);
              return (
                <div key={inv.id} style={{
                  background: C.surface2,
                  border: `1px solid ${C.border}`,
                  borderRadius: "6px",
                  padding: "4px 8px",
                  fontSize: "11px",
                }}>
                  <span style={{ color: C.text }}>{inv.agent}</span>
                  <span style={{ color: pl_pct >= 0 ? "#4ade80" : "#f87171", marginLeft: "4px" }}>
                    {pl_pct >= 0 ? "+" : ""}{pl_pct.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {fond_trades.length > 0 && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: "12px 20px" }}>
          <div style={{ fontSize: "11px", color: C.textMuted, marginBottom: "8px" }}>SENASTE TRADES</div>
          {fond_trades.map(trade => (
            <div key={trade.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "4px 0",
              borderBottom: `1px solid ${C.border}40`,
              fontSize: "12px",
            }}>
              <span style={{ color: trade.typ === "kop" ? "#4ade80" : "#f87171" }}>
                {trade.typ === "kop" ? "KÖP" : "SÄLJ"} {trade.symbol}
              </span>
              <span style={{ color: C.textMuted }}>
                {parseFloat(trade.antal).toFixed(2)} @ {parseFloat(trade.pris).toFixed(2)} SEK
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function HedgefonderPage() {
  const { fonder, investerare, nav_historik, trades, planbocker } = await getData();

  const total_aum = fonder.reduce((sum, f) => {
    return sum + parseFloat(f.nav_per_andel) * parseFloat(f.total_andelar || 0);
  }, 0);
  const total_investerare = new Set(investerare.map(i => i.agent)).size;
  const total_trades = trades.length;

  return (
    <main style={{ minHeight: "100vh", background: C.bg, color: C.text, padding: "32px 16px", fontFamily: "monospace" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: "700", color: C.accent, margin: "0 0 4px" }}>
            Hedgefonder
          </h1>
          <p style={{ color: C.textMuted, fontSize: "14px", margin: 0 }}>
            AI-agenter förvaltar poolat kapital — en aggressiv, en konservativ och en självlärande.
          </p>
        </div>

        {/* Statsrad */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px",
          marginBottom: "24px",
        }}>
          {[
            { label: "Total AUM", value: `${total_aum.toFixed(0)} SEK` },
            { label: "Unika investerare", value: total_investerare },
            { label: "Genomförda trades", value: total_trades },
          ].map(stat => (
            <div key={stat.label} style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: "8px",
              padding: "16px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "22px", fontWeight: "700", color: C.accent }}>{stat.value}</div>
              <div style={{ fontSize: "12px", color: C.textMuted }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {fonder.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px",
          }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>📈</div>
            <div style={{ color: C.textMuted }}>
              Inga fonder ännu. Kör <code>supabase_hedgefond.sql</code> och sedan <code>hedgefond_test.py</code>.
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
            {fonder.map(fond => (
              <FondKort
                key={fond.id}
                fond={fond}
                investerare={investerare}
                nav_historik={nav_historik}
                trades={trades}
              />
            ))}
          </div>
        )}

        <div style={{ marginTop: "24px", padding: "16px", background: C.surface2, borderRadius: "8px", fontSize: "12px", color: C.textMuted }}>
          <strong style={{ color: C.accent }}>Hur det fungerar:</strong>{" "}
          Alpha Capital (aggressiv momentum), Macro Fund (konservativ makro) och Quant Fund (självlärande — LLM analyserar prestandahistorik och justerar strategi varje körning).
          Agenter investerar 100–200 SEK och får andelar till aktuellt NAV. Fonderna handlar på den interna börsen.
          NAV uppdateras vid varje körning (11:00 dagligen).
        </div>
      </div>
    </main>
  );
}
