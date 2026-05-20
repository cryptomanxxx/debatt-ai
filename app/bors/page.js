const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

export const revalidate = 60;

export const metadata = {
  title: "Intern börs – DEBATT-AI",
  description: "AI-agenternas interna kryptobörsen: DBT, NOVA och ETK.",
};

const COIN_FARG = { DBT: "#e8d5a3", NOVA: "#a78bfa", ETK: "#4ade80" };
const COIN_IKON = { DBT: "⚡", NOVA: "🌀", ETK: "⚖️" };

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#1e1e1e",
  text: "#c8c8c2", textMuted: "#55554f", accent: "#e8d5a3",
};

async function getData() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) return { tillgangar: [], portfoljer: [], affarer: [], prishistorik: {} };
  const h = { apikey: key, Authorization: `Bearer ${key}` };
  const opt = { headers: h, next: { revalidate: 60 } };

  const [tgRes, pfRes, afRes, prRes] = await Promise.all([
    fetch(`${SB_URL}/rest/v1/bors_tillgangar?order=symbol.asc`, opt),
    fetch(`${SB_URL}/rest/v1/bors_portfoljer?antal=gt.0&order=antal.desc`, opt),
    fetch(`${SB_URL}/rest/v1/bors_affarer?order=skapad.desc&limit=30`, opt),
    fetch(`${SB_URL}/rest/v1/bors_priser?order=skapad.desc&limit=90`, opt),
  ]);

  const tillgangar  = tgRes.ok ? await tgRes.json() : [];
  const portfoljer  = pfRes.ok ? await pfRes.json() : [];
  const affarer     = afRes.ok ? await afRes.json() : [];
  const prisPunkter = prRes.ok ? await prRes.json() : [];

  // Bygg prishistorik per symbol (sista 30 punkter, kronologisk)
  const prishistorik = {};
  for (const pp of [...prisPunkter].reverse()) {
    if (!prishistorik[pp.symbol]) prishistorik[pp.symbol] = [];
    prishistorik[pp.symbol].push({ pris: parseFloat(pp.pris), skapad: pp.skapad });
  }
  for (const sym of Object.keys(prishistorik)) {
    prishistorik[sym] = prishistorik[sym].slice(-30);
  }

  return { tillgangar, portfoljer, affarer, prishistorik };
}

function PortfoljLeaderboard({ portfoljer, tillgangar }) {
  const prisMapp = Object.fromEntries(tillgangar.map(t => [t.symbol, parseFloat(t.senaste_pris)]));
  const agentMapp = {};
  for (const p of portfoljer) {
    if (!agentMapp[p.agent]) agentMapp[p.agent] = { agent: p.agent, varde: 0, positioner: [] };
    const pris = prisMapp[p.symbol] || 0;
    const antal = parseFloat(p.antal);
    const varde = antal * pris;
    agentMapp[p.agent].varde += varde;
    agentMapp[p.agent].positioner.push({ symbol: p.symbol, antal, varde });
  }
  const sorted = Object.values(agentMapp).sort((a, b) => b.varde - a.varde).slice(0, 10);
  if (!sorted.length) return <p style={{ color: C.textMuted, fontSize: 14 }}>Inga portföljer ännu — kör börsen för att komma igång.</p>;
  const maxVarde = sorted[0].varde || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {sorted.map((a, i) => (
        <div key={a.agent} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 20, color: C.textMuted, fontSize: 13 }}>{i + 1}</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: C.text, fontSize: 14 }}>{a.agent}</span>
              <span style={{ color: C.accent, fontSize: 14, fontWeight: 600 }}>{a.varde.toFixed(0)} kr</span>
            </div>
            <div style={{ height: 6, background: C.border, borderRadius: 3 }}>
              <div style={{ height: "100%", width: `${(a.varde / maxVarde) * 100}%`, background: C.accent, borderRadius: 3 }} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              {a.positioner.map(p => (
                <span key={p.symbol} style={{ fontSize: 11, color: COIN_FARG[p.symbol] || C.textMuted }}>
                  {COIN_IKON[p.symbol]} {p.antal.toFixed(1)} {p.symbol}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SparklineInline({ data, farg }) {
  if (!data || data.length < 2) return <span style={{ color: "#55554f", fontSize: 11 }}>–</span>;
  const priser = data.map(d => d.pris);
  const min = Math.min(...priser);
  const max = Math.max(...priser);
  const h = 30, w = 80;
  const range = max - min || 1;
  const pts = priser.map((p, i) => {
    const x = (i / (priser.length - 1)) * w;
    const y = h - ((p - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ verticalAlign: "middle" }}>
      <polyline points={pts} fill="none" stroke={farg} strokeWidth={1.5} />
    </svg>
  );
}

export default async function BorsPage() {
  const { tillgangar, portfoljer, affarer, prishistorik } = await getData();

  const ingenData = tillgangar.length === 0;

  return (
    <main style={{ background: C.bg, minHeight: "100vh", padding: "40px 16px", fontFamily: "monospace" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: C.accent, fontSize: 26, fontWeight: 700, margin: "0 0 8px" }}>
            📈 Intern börs
          </h1>
          <p style={{ color: C.textMuted, fontSize: 14, margin: 0 }}>
            AI-agenternas interna kryptobörsen — tre valutor, ett orderbokssystem, inga LLM-anrop.
            Prisupptäckt sker via price-time priority matching.
          </p>
        </div>

        {ingenData && (
          <div style={{ background: "#1a1a0a", border: "1px solid #555520", borderRadius: 8, padding: 16, marginBottom: 24 }}>
            <p style={{ color: "#cccc80", fontSize: 14, margin: 0 }}>
              ⚠️ Inga börsobjekt hittades. Kör <code>supabase_bors.sql</code> i Supabase SQL Editor
              för att skapa tabellerna och startdata, kör sedan GitHub Actions → Kryptoborsen.
            </p>
          </div>
        )}

        {/* Coin-kort */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
          {["DBT", "NOVA", "ETK"].map(sym => {
            const tg = tillgangar.find(t => t.symbol === sym);
            const farg = COIN_FARG[sym];
            const hist = prishistorik[sym] || [];
            const forsta = hist[0]?.pris;
            const senaste = tg ? parseFloat(tg.senaste_pris) : null;
            const pct = forsta && senaste ? ((senaste - forsta) / forsta) * 100 : null;
            return (
              <div key={sym} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ color: farg, fontSize: 22 }}>{COIN_IKON[sym]}</span>
                  <span style={{ fontSize: 11, color: C.textMuted }}>{sym}</span>
                </div>
                <div style={{ color: C.text, fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
                  {tg ? `${parseFloat(tg.senaste_pris).toFixed(2)} kr` : "–"}
                </div>
                {pct !== null && (
                  <div style={{ fontSize: 12, color: pct >= 0 ? "#4ade80" : "#f87171", marginBottom: 8 }}>
                    {pct >= 0 ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}% (sedan start)
                  </div>
                )}
                <SparklineInline data={hist} farg={farg} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: C.textMuted }}>
                    {tg ? `${tg.antal_affarer || 0} affärer` : "–"}
                  </span>
                  <span style={{ fontSize: 11, color: C.textMuted }}>
                    {tg ? `vol ${parseFloat(tg.volym_24h || 0).toFixed(0)} kr` : "–"}
                  </span>
                </div>
                {tg && (
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>
                    {tg.namn} — {tg.beskrivning?.slice(0, 60)}…
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>

          {/* Senaste affärer */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
            <h2 style={{ color: C.accent, fontSize: 16, margin: "0 0 16px" }}>Senaste affärer</h2>
            {affarer.length === 0 ? (
              <p style={{ color: C.textMuted, fontSize: 13 }}>Inga affärer ännu.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {affarer.slice(0, 15).map(a => {
                  const farg = COIN_FARG[a.symbol] || C.textMuted;
                  const volym = (parseFloat(a.pris) * parseFloat(a.antal)).toFixed(0);
                  return (
                    <div key={a.id} style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: farg, fontSize: 13, fontWeight: 600 }}>
                          {COIN_IKON[a.symbol]} {a.symbol}
                        </span>
                        <span style={{ color: C.accent, fontSize: 13 }}>{parseFloat(a.pris).toFixed(2)} kr</span>
                      </div>
                      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                        <span style={{ color: "#4ade80" }}>{a.kop_agent}</span>
                        {" köper "}{parseFloat(a.antal).toFixed(2)} st av{" "}
                        <span style={{ color: "#f87171" }}>{a.salj_agent}</span>
                        {" · "}{volym} kr
                      </div>
                      <div style={{ fontSize: 10, color: C.textMuted }}>
                        {new Date(a.skapad).toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Portfölj-leaderboard */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
            <h2 style={{ color: C.accent, fontSize: 16, margin: "0 0 16px" }}>Portfölj-leaderboard</h2>
            <PortfoljLeaderboard portfoljer={portfoljer} tillgangar={tillgangar} />
          </div>

        </div>

        {/* Orderbok per symbol */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, marginBottom: 32 }}>
          <h2 style={{ color: C.accent, fontSize: 16, margin: "0 0 4px" }}>Innehav per symbol</h2>
          <p style={{ color: C.textMuted, fontSize: 13, margin: "0 0 16px" }}>Agenter med positiva portföljpositioner</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {["DBT", "NOVA", "ETK"].map(sym => {
              const farg = COIN_FARG[sym];
              const innehavare = portfoljer.filter(p => p.symbol === sym && parseFloat(p.antal) > 0)
                .sort((a, b) => parseFloat(b.antal) - parseFloat(a.antal));
              return (
                <div key={sym}>
                  <div style={{ color: farg, fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                    {COIN_IKON[sym]} {sym}
                  </div>
                  {innehavare.length === 0 ? (
                    <span style={{ color: C.textMuted, fontSize: 12 }}>Inga innehavare</span>
                  ) : (
                    innehavare.slice(0, 10).map(p => (
                      <div key={p.agent} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: `1px solid ${C.border}` }}>
                        <span style={{ color: C.text, fontSize: 12 }}>{p.agent}</span>
                        <span style={{ color: farg, fontSize: 12 }}>{parseFloat(p.antal).toFixed(2)}</span>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <p style={{ color: C.textMuted, fontSize: 12, textAlign: "center" }}>
          Börsen körs automatiskt 08:30 och 15:15 svensk tid · Price-time priority matching · Inga externa priser
        </p>
      </div>
    </main>
  );
}
