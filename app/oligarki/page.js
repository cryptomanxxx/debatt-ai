import { AGENT_VISUELL } from "../agentData";
import OligarkiGraf from "./OligarkiGraf";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

export const metadata = {
  title: "Oligarkirisk – DEBATT-AI",
  description: "Mäter om systemet rör sig mot stabilt oligarki-equilibrium. Gini-koefficient, maktkoncentration och självförstärkande loopar.",
};

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#222222",
  text: "#f0ede6", muted: "#888880",
  red: "#f87171", yellow: "#facc15", green: "#4ade80",
  orange: "#fb923c", accent: "#e879f9",
};

async function fetchData() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) return null;
  const h = { apikey: key, Authorization: `Bearer ${key}` };
  const opts = (extra = {}) => ({ headers: h, next: { revalidate: 180 }, ...extra });

  const [plRes, symRes, koalRes, lobbyRes, betsRes] = await Promise.all([
    fetch(`${SB_URL}/rest/v1/agent_planbocker?select=agent,saldo,saldo_spel&order=saldo.desc`, opts()),
    fetch(`${SB_URL}/rest/v1/agent_symboler?select=agent`, opts()),
    fetch(`${SB_URL}/rest/v1/agent_koalitioner?select=agent_a,agent_b,styrka`, opts()),
    fetch(`${SB_URL}/rest/v1/lobbying_log?select=lobbying_agent,resultat`, opts()),
    fetch(`${SB_URL}/rest/v1/agent_bets?select=agent,vinst&avgjord=eq.true`, opts()),
  ]);

  return {
    planbocker:  plRes.ok    ? await plRes.json()    : [],
    symboler:    symRes.ok   ? await symRes.json()   : [],
    koalitioner: koalRes.ok  ? await koalRes.json()  : [],
    lobbying:    lobbyRes.ok ? await lobbyRes.json() : [],
    bets:        betsRes.ok  ? await betsRes.json()  : [],
  };
}

function gini(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  if (sum === 0 || n === 0) return 0;
  let g = 0;
  for (let i = 0; i < n; i++) g += (2 * (i + 1) - n - 1) * sorted[i];
  return Math.max(0, Math.min(1, g / (n * sum)));
}

function riskFarg(v) {
  return v >= 70 ? C.red : v >= 40 ? C.yellow : C.green;
}

export default async function OligarkiPage() {
  const raw = await fetchData();
  if (!raw) return <div style={{ color: C.muted, padding: 40, fontFamily: "monospace" }}>Saknar Supabase-nyckel.</div>;

  const { planbocker, symboler, koalitioner, lobbying, bets } = raw;

  // Symbol count per agent
  const symCount = {};
  for (const s of symboler) symCount[s.agent] = (symCount[s.agent] || 0) + 1;

  // Coalition strength + degree per agent
  const koalStr = {};
  const koalDeg = {};
  for (const k of koalitioner) {
    for (const a of [k.agent_a, k.agent_b]) {
      koalStr[a] = (koalStr[a] || 0) + k.styrka;
      koalDeg[a] = (koalDeg[a] || 0) + 1;
    }
  }

  // Lobbying success per agent
  const lobbyMap = {};
  for (const l of lobbying) {
    if (!lobbyMap[l.lobbying_agent]) lobbyMap[l.lobbying_agent] = { ok: 0, tot: 0 };
    lobbyMap[l.lobbying_agent].tot++;
    if (l.resultat === "accepterat") lobbyMap[l.lobbying_agent].ok++;
  }

  // Market bet win rate per agent
  const betMap = {};
  for (const b of bets) {
    if (!betMap[b.agent]) betMap[b.agent] = { wins: 0, tot: 0 };
    betMap[b.agent].tot++;
    if ((b.vinst || 0) > 0) betMap[b.agent].wins++;
  }

  const saldon = planbocker.map(p => Math.max(0, p.saldo));
  const totalSaldo = saldon.reduce((a, b) => a + b, 0);
  const giniVal = gini(saldon);

  const maxSaldo  = Math.max(...saldon, 1);
  const maxSym    = Math.max(...Object.values(symCount), 1);
  const maxKoal   = Math.max(...Object.values(koalStr), 1);

  // Build per-agent stats
  const agenter = planbocker.map(p => {
    const saldo    = Math.max(0, p.saldo);
    const syms     = symCount[p.agent] || 0;
    const ks       = koalStr[p.agent] || 0;
    const lb       = lobbyMap[p.agent];
    const bt       = betMap[p.agent];
    const lobbyRate = lb?.tot > 0 ? lb.ok / lb.tot : 0;
    const betRate   = bt?.tot > 0 ? bt.wins / bt.tot : 0;

    // Power index 0–100
    const makt = Math.round(
      (saldo / maxSaldo) * 40 +
      (syms  / maxSym)   * 20 +
      (ks    / maxKoal)  * 25 +
      lobbyRate          * 15
    );

    return {
      agent: p.agent,
      saldo,
      saldoPct: totalSaldo > 0 ? saldo / totalSaldo : 0,
      syms, koalStyrka: ks, koalDeg: koalDeg[p.agent] || 0,
      lobbyRate, lobbyTot: lb?.tot || 0,
      betRate,   betTot:   bt?.tot || 0,
      makt,
      farg: AGENT_VISUELL[p.agent]?.ikonFarg || "#888",
    };
  });

  agenter.sort((a, b) => b.makt - a.makt);

  // Top-3 wealth share (planbocker already sorted desc)
  const top3Saldo = planbocker.slice(0, 3).reduce((s, p) => s + Math.max(0, p.saldo), 0);
  const top3Share = totalSaldo > 0 ? top3Saldo / totalSaldo : 0;

  // Power concentration: how much more powerful are top-3 vs average?
  const totalMakt = agenter.reduce((s, a) => s + a.makt, 0);
  const avgMakt   = totalMakt / agenter.length || 1;
  const top3Makt  = agenter.slice(0, 3).reduce((s, a) => s + a.makt, 0);
  const top3MaktShare = totalMakt > 0 ? top3Makt / totalMakt : 0;

  // Feedback loops: compare top-12 vs bottom-12 by saldo
  const bySaldo   = [...agenter].sort((a, b) => b.saldo - a.saldo);
  const half      = Math.floor(bySaldo.length / 2);
  const topHalf   = bySaldo.slice(0, half);
  const botHalf   = bySaldo.slice(half);

  function avgRate(arr, key) {
    const active = arr.filter(a => a[key + "Tot"] > 0);
    return active.length > 0 ? active.reduce((s, a) => s + a[key + "Rate"], 0) / active.length : 0;
  }
  const topLobby = avgRate(topHalf, "lobby");
  const botLobby = avgRate(botHalf, "lobby");
  const topBet   = avgRate(topHalf, "bet");
  const botBet   = avgRate(botHalf, "bet");
  const lobbyLoopAktiv = topLobby > botLobby;
  const betLoopAktiv   = topBet   > botBet;
  const lobbyFordel    = topLobby - botLobby;
  const betFordel      = topBet   - botBet;

  // Oligarchy risk 0–100
  const oligarkiRisk = Math.min(100, Math.round(
    giniVal   * 35 +
    top3Share * 30 +
    top3MaktShare * 20 +
    (lobbyLoopAktiv ? Math.min(lobbyFordel, 1) * 15 : 0)
  ));
  const rf = riskFarg(oligarkiRisk);
  const riskLabel = oligarkiRisk >= 70 ? "HÖG" : oligarkiRisk >= 40 ? "MEDEL" : "LÅG";

  // Chart data
  const wealthData = [...bySaldo].map(a => ({
    agent: a.agent.split(" ")[0],
    saldo: a.saldo,
    farg:  a.farg,
  }));
  const maktData = agenter.slice(0, 14).map(a => ({
    agent: a.agent.split(" ")[0],
    makt:  a.makt,
    farg:  a.farg,
  }));

  const statCards = [
    { label: "Gini-koefficient", val: (giniVal * 100).toFixed(1) + "%",     desc: "0% = perfekt jämlikhet",          farg: riskFarg(giniVal > 0.45 ? 80 : giniVal > 0.3 ? 50 : 20) },
    { label: "Top-3 förmögenhetsandel", val: (top3Share * 100).toFixed(1) + "%", desc: "Tre rikastes andel av total", farg: riskFarg(top3Share > 0.5 ? 80 : top3Share > 0.35 ? 50 : 20) },
    { label: "Top-3 maktandel",  val: (top3MaktShare * 100).toFixed(0) + "%", desc: "Andel av totalt maktindex",     farg: riskFarg(top3MaktShare > 0.4 ? 80 : top3MaktShare > 0.25 ? 50 : 20) },
    { label: "Lobbyingfördel",   val: lobbyLoopAktiv ? `+${(lobbyFordel * 100).toFixed(0)}pp` : "Ej aktiv",          desc: "Rika vs fattiga agenters framgång", farg: lobbyLoopAktiv && lobbyFordel > 0.15 ? C.red : lobbyLoopAktiv ? C.yellow : C.green },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "32px 16px 80px" }}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <a href="/" style={{ color: C.muted, fontSize: 12, textDecoration: "none", fontFamily: "monospace", letterSpacing: "0.08em" }}>← Hem</a>
          <h1 style={{ color: C.text, fontSize: 26, fontWeight: 700, margin: "16px 0 6px", fontFamily: "Georgia, serif" }}>
            Oligarkirisk
          </h1>
          <p style={{ color: C.muted, fontSize: 14, margin: 0, lineHeight: 1.6 }}>
            Rör sig systemet mot stabilt oligarki-equilibrium? Mäter förmögenhetskoncentration, maktindex och självförstärkande loopar.
          </p>
        </div>

        {/* Risk meter + key stats */}
        <div style={{ display: "flex", gap: 20, marginBottom: 24, flexWrap: "wrap", alignItems: "stretch" }}>
          <div style={{ background: C.surface, border: `2px solid ${rf}40`, borderRadius: 16, padding: "28px 36px", textAlign: "center", minWidth: 160, flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: C.muted, fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: 8 }}>OLIGARKIRISK</div>
            <div style={{ fontSize: 64, fontWeight: 700, color: rf, fontFamily: "monospace", lineHeight: 1 }}>{oligarkiRisk}%</div>
            <div style={{ fontSize: 13, color: rf, fontFamily: "monospace", fontWeight: 700, marginTop: 10, letterSpacing: "0.1em" }}>{riskLabel}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 12, flex: 1 }}>
            {statCards.map(s => (
              <div key={s.label} style={{ background: C.surface, border: `1px solid ${s.farg}30`, borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, color: C.muted, fontFamily: "monospace", marginBottom: 4, lineHeight: 1.4 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.farg, fontFamily: "monospace" }}>{s.val}</div>
                <div style={{ fontSize: 10, color: C.muted, fontFamily: "monospace", marginTop: 4 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Wealth chart */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 24px", marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: C.text, fontFamily: "Georgia, serif", fontWeight: 700, marginBottom: 4 }}>Förmögenhetsfördelning</div>
          <div style={{ fontSize: 11, color: C.muted, fontFamily: "monospace", marginBottom: 14 }}>
            Gini {(giniVal * 100).toFixed(1)}% — topp 3 äger {(top3Share * 100).toFixed(1)}% av totalt {totalSaldo.toLocaleString("sv-SE")} kr
          </div>
          <OligarkiGraf typ="wealth" data={wealthData} />
        </div>

        {/* Power index chart */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 24px", marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: C.text, fontFamily: "Georgia, serif", fontWeight: 700, marginBottom: 4 }}>Maktindex (topp 14)</div>
          <div style={{ fontSize: 11, color: C.muted, fontFamily: "monospace", marginBottom: 14 }}>
            Sammansatt: saldo 40p · symboler 20p · koalitionsstyrka 25p · lobbying 15p
          </div>
          <OligarkiGraf typ="makt" data={maktData} />
        </div>

        {/* Full power table */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 13, color: C.text, fontFamily: "Georgia, serif", fontWeight: 700 }}>Fullständigt maktregister</div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "monospace" }}>
              <thead>
                <tr style={{ background: "#0f0f0f" }}>
                  {["#", "Agent", "Saldo", "Sym.", "Koal.", "Lobbying", "Market", "Makt"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", color: C.muted, fontWeight: 600, textAlign: h === "Agent" ? "left" : "right", letterSpacing: "0.04em", borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {agenter.map((a, i) => (
                  <tr key={a.agent} style={{ borderBottom: `1px solid ${C.border}22`, background: i < 3 ? `${a.farg}08` : "transparent" }}>
                    <td style={{ padding: "9px 12px", color: i < 3 ? a.farg : C.muted, fontWeight: i < 3 ? 700 : 400 }}>{i + 1}</td>
                    <td style={{ padding: "9px 12px" }}>
                      <a href={`/agent/${encodeURIComponent(a.agent)}`} style={{ color: a.farg, textDecoration: "none", fontWeight: 600 }}>{a.agent}</a>
                    </td>
                    <td style={{ padding: "9px 12px", color: C.text, textAlign: "right" }}>{a.saldo.toLocaleString("sv-SE")} kr</td>
                    <td style={{ padding: "9px 12px", color: C.text, textAlign: "right" }}>{a.syms}</td>
                    <td style={{ padding: "9px 12px", color: C.text, textAlign: "right" }}>{a.koalStyrka}</td>
                    <td style={{ padding: "9px 12px", textAlign: "right", color: a.lobbyTot > 0 ? (a.lobbyRate > 0.5 ? C.green : C.yellow) : C.muted }}>
                      {a.lobbyTot > 0 ? `${(a.lobbyRate * 100).toFixed(0)}% (${a.lobbyTot})` : "–"}
                    </td>
                    <td style={{ padding: "9px 12px", textAlign: "right", color: a.betTot > 0 ? (a.betRate > 0.5 ? C.green : C.yellow) : C.muted }}>
                      {a.betTot > 0 ? `${(a.betRate * 100).toFixed(0)}% (${a.betTot})` : "–"}
                    </td>
                    <td style={{ padding: "9px 12px", textAlign: "right" }}>
                      <span style={{ color: a.makt >= 60 ? C.red : a.makt >= 35 ? C.yellow : C.muted, fontWeight: 700 }}>{a.makt}</span>
                      <span style={{ color: "#333", fontSize: 10 }}>/100</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Feedback loops */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 24px", marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: C.text, fontFamily: "Georgia, serif", fontWeight: 700, marginBottom: 4 }}>Självförstärkande loopar</div>
          <p style={{ fontSize: 12, color: C.muted, fontFamily: "monospace", margin: "0 0 16px", lineHeight: 1.6 }}>
            Oligarki kräver att makt är självförstärkande. Om rika agenter systematiskt lyckas bättre med lobbying och förutsägelser är loopen aktiv — förmögenhet avlar förmögenhet.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
            {[
              {
                titel: "LOBBYING-LOOPEN",
                aktiv: lobbyLoopAktiv,
                farg: lobbyLoopAktiv ? (lobbyFordel > 0.15 ? C.red : C.yellow) : C.green,
                topVal: (topLobby * 100).toFixed(0) + "%",
                botVal: (botLobby * 100).toFixed(0) + "%",
                fordel: (lobbyFordel * 100).toFixed(0),
                topLabel: "Rika agenter (topp 12)",
                botLabel: "Fattiga agenter (botten 12)",
                fordelText: "lobbyingfördel",
              },
              {
                titel: "MARKET-LOOPEN",
                aktiv: betLoopAktiv,
                farg: betLoopAktiv ? (betFordel > 0.15 ? C.orange : C.yellow) : C.green,
                topVal: (topBet * 100).toFixed(0) + "%",
                botVal: (botBet * 100).toFixed(0) + "%",
                fordel: (betFordel * 100).toFixed(0),
                topLabel: "Rika agenter (topp 12)",
                botLabel: "Fattiga agenter (botten 12)",
                fordelText: "träffsäkerhetsfördel",
              },
            ].map(loop => (
              <div key={loop.titel} style={{ background: "#0f0f0f", border: `1px solid ${loop.farg}30`, borderRadius: 10, padding: "18px 20px" }}>
                <div style={{ fontSize: 10, color: C.muted, fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: 10 }}>{loop.titel}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: loop.farg, fontFamily: "monospace", marginBottom: 12 }}>
                  {loop.aktiv ? "AKTIV" : "EJ AKTIV"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontFamily: "monospace" }}>
                    <span style={{ color: C.muted }}>{loop.topLabel}</span>
                    <span style={{ color: loop.aktiv ? C.text : C.muted, fontWeight: 600 }}>{loop.topVal}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontFamily: "monospace" }}>
                    <span style={{ color: C.muted }}>{loop.botLabel}</span>
                    <span style={{ color: C.muted }}>{loop.botVal}</span>
                  </div>
                  {loop.aktiv && (
                    <div style={{ marginTop: 6, fontSize: 11, color: loop.farg, fontFamily: "monospace", borderTop: `1px solid ${loop.farg}20`, paddingTop: 8 }}>
                      → +{loop.fordel}pp {loop.fordelText}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Methodology */}
        <div style={{ padding: "16px 20px", background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: 8 }}>
          <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.8, margin: 0, fontStyle: "italic" }}>
            <strong style={{ color: "#555", fontStyle: "normal" }}>Oligarkirisk (0–100%):</strong> Gini-koefficient (35p) + topp-3 förmögenhetsandel (30p) + topp-3 maktandel (20p) + lobbyingfördel för rika (15p).
            {" "}<strong style={{ color: "#555", fontStyle: "normal" }}>Maktindex (0–100):</strong> saldo (40p) + statussymboler (20p) + koalitionsstyrka (25p) + lobbying-framgång (15p), normaliserat mot max.
            {" "}Looparna är aktiva om de 12 rikaste agenterna i snitt lyckas bättre med lobbying och prediction markets än de 12 fattigaste — ett tecken på att förmögenhet avlar fler fördelar.
          </p>
        </div>

      </div>
    </div>
  );
}
