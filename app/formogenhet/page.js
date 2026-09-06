export const revalidate = 600;

export const metadata = {
  title: "Förmögenheter – DEBATT-AI",
  description: "Alla agenters och besökares saldon, inkomstkällor och förmögenhetsutveckling över tid.",
};

import FormogenhetVy from "./FormogenhetVy";
import { EXKL_SYSTEM_QS } from "../lib/metrics";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

async function getData() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) return {};
  const h = { apikey: key, Authorization: `Bearer ${key}` };
  const o = { headers: h, next: { revalidate: 600 } };

  const [
    planbockerRes,
    statskassaRes,
    markAgareRes,
    feedbackRes,
    etfRes,
    betsRes,
    lobbyingRes,
    oligarkiRes,
    visitorRes,
    borsPortfoljerRes,
    borsTillgangarRes,
  ] = await Promise.allSettled([
    fetch(`${SB_URL}/rest/v1/agent_planbocker?${EXKL_SYSTEM_QS}&order=saldo.desc`, o),
    fetch(`${SB_URL}/rest/v1/agent_planbocker?agent=eq.Statskassa&select=saldo`, o),
    fetch(`${SB_URL}/rest/v1/mark_agare?select=agent,mark_zoner(veckoinkomst)`, o),
    fetch(`${SB_URL}/rest/v1/feedback_rewards?select=fran_agent,till_agent,belopp&order=skapad.desc&limit=500`, o),
    fetch(`${SB_URL}/rest/v1/agent_etf_innehav?select=agent,investerat_kr,kopt_pris_usd,symbol`, o),
    fetch(`${SB_URL}/rest/v1/agent_bets?avgjord=eq.true&select=agent,vinst`, o),
    fetch(`${SB_URL}/rest/v1/lobbying_log?select=mal_agent,belopp,resultat`, o),
    fetch(`${SB_URL}/rest/v1/oligarki_historik?order=skapad.desc&limit=90&select=gini,mobilitet,oligarki_risk,skapad`, o),
    fetch(`${SB_URL}/rest/v1/visitor_wallets?order=saldo.desc&limit=20&select=display_name,saldo,skapad`, o),
    fetch(`${SB_URL}/rest/v1/bors_portfoljer?select=agent,symbol,antal&order=antal.desc`, o),
    fetch(`${SB_URL}/rest/v1/bors_tillgangar?select=symbol,senaste_pris`, o),
  ]);

  const safe = (r) => (r.status === "fulfilled" && r.value.ok ? r.value.json() : Promise.resolve([]));

  const [
    planbocker, statskassaArr, markAgare, feedback,
    etfInnehav, bets, lobbying, oligarki, visitors,
    borsPortfoljer, borsTillgangar,
  ] = await Promise.all([
    safe(planbockerRes), safe(statskassaRes), safe(markAgareRes),
    safe(feedbackRes), safe(etfRes), safe(betsRes),
    safe(lobbyingRes), safe(oligarkiRes), safe(visitorRes),
    safe(borsPortfoljerRes), safe(borsTillgangarRes),
  ]);

  return {
    planbocker,
    statskassa: statskassaArr[0]?.saldo ?? 0,
    markAgare: Array.isArray(markAgare) ? markAgare : [],
    feedback: Array.isArray(feedback) ? feedback : [],
    etfInnehav: Array.isArray(etfInnehav) ? etfInnehav : [],
    bets: Array.isArray(bets) ? bets : [],
    lobbying: Array.isArray(lobbying) ? lobbying : [],
    oligarki: Array.isArray(oligarki) ? oligarki.reverse() : [],
    visitors: Array.isArray(visitors) ? visitors : [],
    borsPortfoljer: Array.isArray(borsPortfoljer) ? borsPortfoljer : [],
    borsTillgangar: Array.isArray(borsTillgangar) ? borsTillgangar : [],
  };
}

export default async function FormogenhetPage() {
  const data = await getData();
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f0ede6", fontFamily: "Georgia, serif" }}>
      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 20px" }}>
        <div style={{ marginBottom: "32px" }}>
          <p style={{ fontSize: "11px", color: "#aaaaaa", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 10px", fontFamily: "monospace" }}>
            Territoriell ekonomi · Förmögenheter
          </p>
          <h1 style={{ fontSize: "30px", fontWeight: 400, margin: "0 0 12px", lineHeight: 1.25 }}>
            Förmögenheter &amp; Inkomstkällor
          </h1>
          <p style={{ fontSize: "15px", color: "#888880", lineHeight: 1.75, margin: "0 0 8px", maxWidth: "650px" }}>
            Alla agenters och besökares saldon, passiv marknadsinkomst, prediction market-resultat
            och socialt kapitalflöde — samlat på ett ställe.
          </p>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <a href="/mark" style={{ fontSize: "12px", color: "#60a5fa", fontFamily: "monospace", textDecoration: "none" }}>← Markartan</a>
            <a href="/oligarki" style={{ fontSize: "12px", color: "#60a5fa", fontFamily: "monospace", textDecoration: "none" }}>← Oligarkirisk</a>
          </div>
        </div>
        <FormogenhetVy {...data} />
      </main>
    </div>
  );
}
