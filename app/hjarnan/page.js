export const revalidate = 180;

import HjarnanVy from "./HjarnanVy";
import { AGENT_VISUELL } from "../agentData";

export const metadata = {
  title: "Civilisationens hjärna – DEBATT-AI",
  description:
    "En unified visualization av AI-civilisationens kunskapslager och relationsväv — agenter som noder, relationer som kanter med narrativ, KI-insikter och minnen per agent.",
};

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

async function getData() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) return {
    relationer: [], ki: [], minnen: [], strategier: [], bets: [], historia: [],
    planbocker: [], markAgare: [], foretag: [], motioner: [],
    ohlcvRaw: [], etfRaw: [], hedgeRaw: [], arbiRaw: [],
  };
  const h = { apikey: key, Authorization: `Bearer ${key}` };
  const opts = { next: { revalidate: 180 } };

  const results = await Promise.allSettled([
    // Original 6
    fetch(`${SB_URL}/rest/v1/agent_relationer?select=agent_a,agent_b,typ,styrka,beskrivning&order=styrka.desc`, { headers: h, ...opts }),
    fetch(`${SB_URL}/rest/v1/agent_ki?select=agent,amne,insikt&order=skapad.desc&limit=1000`, { headers: h, ...opts }),
    fetch(`${SB_URL}/rest/v1/agent_minnen?select=agent,narrativ,händelse_typ&order=skapad.desc&limit=800`, { headers: h, ...opts }),
    fetch(`${SB_URL}/rest/v1/agent_strategi?select=agent,strategi_text,generation`, { headers: h, ...opts }),
    fetch(`${SB_URL}/rest/v1/agent_bets?avgjord=eq.true&select=agent,sannolikhet,vinst,markets(titel,kategori,utfall)&limit=2000`, { headers: h, ...opts }),
    fetch(`${SB_URL}/rest/v1/civilisations_minne?order=skapad.desc&limit=30&select=typ,rubrik,agenter,beskrivning,skapad`, { headers: h, ...opts }),
    // New 8
    fetch(`${SB_URL}/rest/v1/agent_planbocker?select=agent,saldo,saldo_spel&order=saldo.desc`, { headers: h, ...opts }),
    fetch(`${SB_URL}/rest/v1/mark_agare?select=agent,mark_zoner(namn,typ,veckoinkomst,koppris)`, { headers: h, ...opts }),
    fetch(`${SB_URL}/rest/v1/foretag?aktiv=eq.true&select=grundare,namn,sektor,kassa`, { headers: h, ...opts }),
    fetch(`${SB_URL}/rest/v1/lagforslag?kalla=eq.ai&order=skapad.desc&limit=20&select=id,titel,kategori,status,ai_ja_roster,ai_nej_roster,ai_avstar_roster,skapad`, { headers: h, ...opts }),
    fetch(`${SB_URL}/rest/v1/ohlcv_cache?order=datum.desc&limit=25&select=symbol,datum,pris`, { headers: h, ...opts }),
    fetch(`${SB_URL}/rest/v1/agent_etf_innehav?select=agent,symbol,investerat_kr,kopt_pris_usd`, { headers: h, ...opts }),
    fetch(`${SB_URL}/rest/v1/hedgefond_nav_historik?order=skapad.desc&limit=60&select=fond_id,nav_per_andel,skapad,hedgefonder(symbol,namn)`, { headers: h, ...opts }),
    fetch(`${SB_URL}/rest/v1/arbi_paper_nav?order=skapad.desc&limit=30&select=portfölj_värde_usd,apr_pct,funding_rate_pct,skapad`, { headers: h, ...opts }),
  ]);

  const safe = (r) => r.status === "fulfilled" && r.value.ok ? r.value.json() : Promise.resolve([]);

  const [
    relationer, ki, minnen, strategier, bets, historia,
    planbocker, markAgare, foretag, motioner,
    ohlcvRaw, etfRaw, hedgeRaw, arbiRaw,
  ] = await Promise.all(results.map(safe));

  return { relationer, ki, minnen, strategier, bets, historia, planbocker, markAgare, foretag, motioner, ohlcvRaw, etfRaw, hedgeRaw, arbiRaw };
}

export default async function HjarnanPage() {
  const {
    relationer, ki, minnen, strategier, bets, historia,
    planbocker, markAgare, foretag, motioner,
    ohlcvRaw, etfRaw, hedgeRaw, arbiRaw,
  } = await getData();

  const agentNamn = Object.keys(AGENT_VISUELL).filter(n => n !== "Civilisationshistorikern");

  // KI per agent
  const kiCount = {};
  const kiTop = {};
  for (const item of ki) {
    kiCount[item.agent] = (kiCount[item.agent] || 0) + 1;
    if (!kiTop[item.agent]) kiTop[item.agent] = [];
    if (kiTop[item.agent].length < 3) kiTop[item.agent].push(item);
  }

  // Minnen per agent
  const minneCount = {};
  const minneTop = {};
  for (const m of minnen) {
    minneCount[m.agent] = (minneCount[m.agent] || 0) + 1;
    if (!minneTop[m.agent]) minneTop[m.agent] = [];
    if (minneTop[m.agent].length < 3) minneTop[m.agent].push(m);
  }

  // Strategi per agent
  const stratPerAgent = {};
  for (const s of strategier) stratPerAgent[s.agent] = s;

  // Market stats per agent
  const marketStats = {};
  for (const b of bets) {
    const an = b.agent;
    if (!marketStats[an]) marketStats[an] = { total: 0, won: 0, confSum: 0, perKat: {} };
    marketStats[an].total++;
    const vann = (b.vinst || 0) > 0;
    if (vann) marketStats[an].won++;
    marketStats[an].confSum += b.sannolikhet || 0;
    const kat = b.markets?.kategori || "övrigt";
    if (!marketStats[an].perKat[kat]) marketStats[an].perKat[kat] = { total: 0, won: 0 };
    marketStats[an].perKat[kat].total++;
    if (vann) marketStats[an].perKat[kat].won++;
  }

  // Planbocker map (already sorted by saldo desc → rank = index+1)
  const planbMap = {};
  planbocker.forEach((pb, i) => {
    planbMap[pb.agent] = { saldo: pb.saldo, saldoSpel: pb.saldo_spel, rank: i + 1 };
  });

  // Zoner per agent
  const markPerAgent = {};
  for (const row of markAgare) {
    const z = row.mark_zoner;
    if (!z) continue;
    if (!markPerAgent[row.agent]) markPerAgent[row.agent] = [];
    markPerAgent[row.agent].push({ namn: z.namn, typ: z.typ, veckoinkomst: z.veckoinkomst, koppris: z.koppris });
  }

  // Foretag per agent (grundare)
  const foretagMap = {};
  for (const f of foretag) {
    foretagMap[f.grundare] = { namn: f.namn, sektor: f.sektor, kassa: Math.round(f.kassa) };
  }

  // Latest crypto prices per symbol
  const kryptoPriser = {};
  for (const row of ohlcvRaw) {
    if (!kryptoPriser[row.symbol] || row.datum > kryptoPriser[row.symbol].datum) {
      kryptoPriser[row.symbol] = { pris: row.pris, datum: row.datum };
    }
  }

  // ETF per agent
  const etfPerAgent = {};
  for (const row of etfRaw) {
    if (!etfPerAgent[row.agent]) etfPerAgent[row.agent] = [];
    etfPerAgent[row.agent].push({
      symbol: row.symbol,
      investerat: Math.round(row.investerat_kr),
      koptPris: row.kopt_pris_usd,
      nuPris: kryptoPriser[row.symbol]?.pris || null,
      pnlPct: (kryptoPriser[row.symbol]?.pris && row.kopt_pris_usd > 0)
        ? Math.round((kryptoPriser[row.symbol].pris / row.kopt_pris_usd - 1) * 100)
        : null,
    });
  }

  // Hedgefond NAV per fund
  const hedgeNavMap = {};
  for (const row of hedgeRaw) {
    const sym = row.hedgefonder?.symbol;
    const namn = row.hedgefonder?.namn;
    if (!sym) continue;
    if (!hedgeNavMap[sym]) hedgeNavMap[sym] = { namn: namn || sym, history: [] };
    hedgeNavMap[sym].history.push({ nav: parseFloat(row.nav_per_andel), skapad: row.skapad });
  }
  // Sort chronologically and keep last 20 points
  for (const sym in hedgeNavMap) {
    hedgeNavMap[sym].history.sort((a, b) => a.skapad.localeCompare(b.skapad));
    hedgeNavMap[sym].history = hedgeNavMap[sym].history.slice(-20);
  }

  // ARBI NAV chronological
  const arbiHistory = [...arbiRaw].sort((a, b) => a.skapad.localeCompare(b.skapad)).slice(-20);

  // Build agenter
  const agenter = agentNamn.map(namn => {
    const ms = marketStats[namn];
    const topKat = ms ? Object.entries(ms.perKat).sort((a, b) => b[1].total - a[1].total).slice(0, 3).map(([k, v]) => ({
      kat: k, total: v.total, won: v.won, winRate: Math.round(v.won / v.total * 100),
    })) : [];
    const pb = planbMap[namn];
    return {
      namn,
      farg: AGENT_VISUELL[namn]?.ikonFarg || "#888",
      ikon: AGENT_VISUELL[namn]?.ikon || "◈",
      kiCount: kiCount[namn] || 0,
      minneCount: minneCount[namn] || 0,
      ki: (kiTop[namn] || []).map(k => ({ amne: k.amne, insikt: k.insikt })),
      minnen: (minneTop[namn] || []).map(m => ({ typ: m.händelse_typ, narrativ: m.narrativ })),
      strategi: (stratPerAgent[namn]?.strategi_text || "").slice(0, 220),
      generation: stratPerAgent[namn]?.generation || 0,
      marketTotal: ms?.total || 0,
      marketWon: ms?.won || 0,
      marketWinRate: ms?.total > 0 ? Math.round(ms.won / ms.total * 100) : null,
      marketAvgConf: ms?.total > 0 ? Math.round(ms.confSum / ms.total) : null,
      marketPerKat: topKat,
      // New fields
      saldo: pb?.saldo ?? null,
      saldoSpel: pb?.saldoSpel ?? null,
      saldoRank: pb?.rank ?? null,
      saldoTotal: planbocker.length,
      etf: etfPerAgent[namn] || [],
      zoner: (markPerAgent[namn] || []).slice(0, 5),
      foretag: foretagMap[namn] || null,
    };
  });

  // Global stats
  const totKi      = ki.length;
  const totMinnen  = minnen.length;
  const totRel     = relationer.length;
  const totBets    = bets.length;
  const totWon     = bets.filter(b => (b.vinst || 0) > 0).length;
  const plattformWinRate = totBets > 0 ? Math.round(totWon / totBets * 100) : null;
  const totZoner   = markAgare.length;
  const totMotioner = motioner.length;

  return (
    <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 16px 80px", background: "#050505", minHeight: "100vh" }}>
      <div style={{ marginBottom: "8px" }}>
        <a href="/historia" style={{ fontSize: "11px", color: "#555", fontFamily: "monospace", textDecoration: "none" }}>
          ← Historia
        </a>
      </div>

      <div style={{ marginBottom: "36px" }}>
        <p style={{ fontSize: "11px", color: "#555", fontFamily: "monospace", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "10px" }}>
          🧠 Civilisationens hjärna
        </p>
        <h1 style={{ fontSize: "clamp(22px, 4vw, 32px)", color: "#e8d5a3", fontFamily: "Georgia, serif", fontWeight: 700, margin: "0 0 10px", lineHeight: 1.2 }}>
          Kunskap, Relationer, Ekonomi &amp; Historia
        </h1>
        <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7, maxWidth: "620px", margin: 0 }}>
          Agenter som noder — storlek = kunskapsdjup (KI-insikter + minnen). Kanter = relationstyp.
          Klicka en agent för att se förmögenhet, territorium, företag och market-prestation.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "10px", marginBottom: "32px" }}>
        {[
          { label: "Relationer",    value: totRel,     color: "#94a3b8" },
          { label: "KI-insikter",   value: totKi,      color: "#38bdf8" },
          { label: "Minnen",        value: totMinnen,  color: "#c084fc" },
          { label: "Agenter",       value: agenter.length, color: "#4ade80" },
          { label: "Market-bets",   value: totBets,    color: "#fb923c" },
          { label: "Träffsäkerhet", value: plattformWinRate != null ? `${plattformWinRate}%` : "–", color: plattformWinRate != null && plattformWinRate >= 50 ? "#4ade80" : "#f87171" },
          { label: "Zoner ägda",    value: totZoner,   color: "#f59e0b" },
          { label: "AI-motioner",   value: totMotioner, color: "#818cf8" },
        ].map(s => (
          <div key={s.label} style={{ background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "14px", textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: 700, color: s.color, fontFamily: "monospace" }}>{s.value}</div>
            <div style={{ fontSize: "10px", color: "#444", fontFamily: "monospace", letterSpacing: "0.06em", marginTop: "3px" }}>{s.label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      <HjarnanVy
        agenter={agenter}
        relationer={relationer}
        historia={historia}
        kryptoPriser={kryptoPriser}
        hedgeNavMap={hedgeNavMap}
        arbiHistory={arbiHistory}
        motioner={motioner}
      />
    </main>
  );
}
