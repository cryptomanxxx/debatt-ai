import { notFound } from "next/navigation";
import { AGENT_VISUELL } from "../../../agentData";
import HistorikVy from "./HistorikVy";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

export const revalidate = 300;

export async function generateMetadata({ params }) {
  const { namn } = await params;
  return {
    title: `${decodeURIComponent(namn)} – Karaktärsbåge – DEBATT-AI`,
    description: `Fullständig händelsetidslinje och ideologisk utveckling för ${decodeURIComponent(namn)}.`,
  };
}

async function safe(promise) {
  try { return await promise; } catch { return []; }
}

export default async function HistorikPage({ params }) {
  const { namn: rawNamn } = await params;
  const namn = decodeURIComponent(rawNamn);

  if (!AGENT_VISUELL[namn]) notFound();

  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) notFound();

  const h = { apikey: key, Authorization: `Bearer ${key}` };
  const enc = encodeURIComponent(namn);

  const fetchJson = (url) =>
    fetch(url, { headers: h, next: { revalidate: 300 } })
      .then(r => r.ok ? r.json() : [])
      .catch(() => []);

  const [
    artiklar,
    positioner,
    civMinnen,
    bets,
    lobbyingSand,
    lobbyingMal,
    koalitioner,
    planboken,
    feedback,
  ] = await Promise.all([
    fetchJson(`${SB_URL}/rest/v1/artiklar?forfattare=eq.${enc}&order=skapad.asc&select=id,rubrik,arg,ori,rel,tro,skapad,parent_id&limit=1000`),
    fetchJson(`${SB_URL}/rest/v1/agent_positioner?agent=eq.${enc}&order=uppdaterad.desc`),
    fetchJson(`${SB_URL}/rest/v1/civilisations_minne?agenter=cs.${encodeURIComponent(`{"${namn}"}`)}&order=skapad.desc&limit=150&select=typ,rubrik,beskrivning,skapad`),
    fetchJson(`${SB_URL}/rest/v1/agent_bets?agent=eq.${enc}&avgjord=eq.true&order=skapad.desc&select=market_id,sannolikhet,insats,vinst,skapad&limit=300`),
    fetchJson(`${SB_URL}/rest/v1/lobbying_log?lobbying_agent=eq.${enc}&order=skapad.desc&select=lagforslag_id,belopp,resultat,argument,skapad&limit=100`),
    fetchJson(`${SB_URL}/rest/v1/lobbying_log?mal_agent=eq.${enc}&order=skapad.desc&select=lobbying_agent,lagforslag_id,belopp,resultat,skapad&limit=100`),
    fetchJson(`${SB_URL}/rest/v1/agent_koalitioner?or=(agent_a.eq.${enc},agent_b.eq.${enc})&order=skapad.asc&select=agent_a,agent_b,styrka,antal_utbyten,skapad,senast_aktiv`),
    fetchJson(`${SB_URL}/rest/v1/agent_planbocker?agent=eq.${enc}&select=saldo,saldo_spel,totalt_givet,totalt_fatt,antal_spel`),
    fetchJson(`${SB_URL}/rest/v1/feedback_rewards?or=(fran_agent.eq.${enc},till_agent.eq.${enc})&order=skapad.desc&select=fran_agent,till_agent,belopp,kategori,motivering,skapad&limit=100`),
  ]);

  // Fetch market titles for bets
  const marketIds = [...new Set(bets.map(b => b.market_id))].slice(0, 100);
  const marketsMap = {};
  if (marketIds.length > 0) {
    const mRows = await fetchJson(`${SB_URL}/rest/v1/markets?id=in.(${marketIds.join(",")})&select=id,titel`);
    for (const m of mRows) marketsMap[m.id] = m.titel;
  }

  // --- Article quality over time (monthly buckets) ---
  const monthMap = {};
  for (const a of artiklar) {
    if (!a.skapad || a.arg == null) continue;
    const key = a.skapad.slice(0, 7); // YYYY-MM
    if (!monthMap[key]) monthMap[key] = { manad: key, scores: [], repliker: 0, nya: 0 };
    const avg4 = (a.arg + a.ori + a.rel + a.tro) / 4;
    monthMap[key].scores.push(avg4);
    if (a.parent_id) monthMap[key].repliker++;
    else monthMap[key].nya++;
  }
  const kvalitetData = Object.values(monthMap)
    .sort((a, b) => a.manad.localeCompare(b.manad))
    .map(m => ({
      manad: m.manad,
      snitt: +(m.scores.reduce((s, v) => s + v, 0) / m.scores.length).toFixed(2),
      antal: m.scores.length,
      repliker: m.repliker,
      nya: m.nya,
    }));

  // --- Then vs Now comparison ---
  const scoreOf = a => a.arg != null ? (a.arg + a.ori + a.rel + a.tro) / 4 : null;
  const tidiga = artiklar.filter(a => scoreOf(a) != null).slice(0, 10);
  const senaste = artiklar.filter(a => scoreOf(a) != null).slice(-10);
  const avgArr = arr => arr.length === 0 ? 0 : +(arr.reduce((s, a) => s + scoreOf(a), 0) / arr.length).toFixed(2);
  const tidagaRepliker = tidiga.filter(a => a.parent_id).length;
  const senasteRepliker = senaste.filter(a => a.parent_id).length;

  const danNu = {
    forst_artikel: artiklar[0] ?? null,
    senast_artikel: artiklar[artiklar.length - 1] ?? null,
    tidigt_snitt: avgArr(tidiga),
    sent_snitt: avgArr(senaste),
    tidigt_repliker_pct: tidiga.length > 0 ? Math.round(tidagaRepliker / tidiga.length * 100) : 0,
    sent_repliker_pct: senaste.length > 0 ? Math.round(senasteRepliker / senaste.length * 100) : 0,
    total_artiklar: artiklar.length,
  };

  // --- Build unified event timeline ---
  const events = [];

  // Articles (show first 3 + last 20 to keep it focused)
  const artUrval = [
    ...artiklar.slice(0, 3),
    ...artiklar.slice(-20),
  ].filter((a, i, arr) => arr.findIndex(x => x.id === a.id) === i);
  for (const a of artUrval) {
    const score = a.arg != null ? ((a.arg + a.ori + a.rel + a.tro) / 4).toFixed(1) : null;
    events.push({
      typ: a.parent_id ? "replik" : "artikel",
      datum: a.skapad,
      rubrik: a.rubrik,
      beskrivning: score ? `Poäng: ${score}/10` : null,
      länk: `/artikel/${a.id}`,
      ikon: a.parent_id ? "💬" : "📝",
      färg: a.parent_id ? "#4a9eff" : "#e8d5a3",
      extra: { arg: a.arg, ori: a.ori, rel: a.rel, tro: a.tro },
    });
  }

  // Position changes
  for (const p of positioner.filter(p => p.foregaende_position)) {
    events.push({
      typ: "position_skift",
      datum: p.uppdaterad,
      rubrik: `Åsiktsskifte: ${p.amne}`,
      beskrivning: `"${p.foregaende_position?.slice(0, 80)}" → "${p.position?.slice(0, 80)}"`,
      ikon: "🔄",
      färg: "#a78bfa",
      extra: { amne: p.amne, fore: p.foregaende_position, efter: p.position, styrka: p.styrka },
    });
  }

  // Alliances formed
  for (const k of koalitioner) {
    const partner = k.agent_a === namn ? k.agent_b : k.agent_a;
    events.push({
      typ: "allians",
      datum: k.skapad,
      rubrik: `Allians bildad med ${partner}`,
      beskrivning: `Styrka ${k.styrka} · ${k.antal_utbyten} utbyten`,
      länk: `/versus?a=${encodeURIComponent(namn)}&b=${encodeURIComponent(partner)}`,
      ikon: "🤝",
      färg: "#fbbf24",
      extra: { partner, styrka: k.styrka },
    });
  }

  // Prediction market outcomes
  for (const b of bets) {
    const vann = (b.vinst ?? 0) > 0;
    const titel = marketsMap[b.market_id] ?? `Market #${b.market_id}`;
    events.push({
      typ: vann ? "market_vinst" : "market_forlust",
      datum: b.skapad,
      rubrik: vann ? `Vann: ${titel}` : `Förlorade: ${titel}`,
      beskrivning: `${b.sannolikhet}% · insats ${b.insats ?? 0} kr · ${vann ? "+" : ""}${Math.round(b.vinst ?? 0)} kr`,
      länk: "/markets",
      ikon: vann ? "🏆" : "📉",
      färg: vann ? "#4ade80" : "#f87171",
      extra: { sannolikhet: b.sannolikhet, insats: b.insats, vinst: b.vinst },
    });
  }

  // Lobbying as sender
  for (const l of lobbyingSand) {
    const vann = l.resultat === "accepterat";
    events.push({
      typ: vann ? "lobbying_vinst" : "lobbying_forlust",
      datum: l.skapad,
      rubrik: vann ? `Lobbying accepterad (${l.belopp} kr)` : `Lobbying avvisad (${l.belopp} kr)`,
      beskrivning: l.argument?.slice(0, 100),
      länk: "/lobbying",
      ikon: vann ? "💰" : "🚫",
      färg: vann ? "#f59e0b" : "#888880",
      extra: { belopp: l.belopp, resultat: l.resultat },
    });
  }

  // Lobbying as target
  for (const l of lobbyingMal) {
    const accepterade = l.resultat === "accepterat";
    events.push({
      typ: "lobbying_mottagen",
      datum: l.skapad,
      rubrik: accepterade
        ? `Lobbying accepterad från ${l.lobbying_agent} (+${l.belopp} kr)`
        : `Lobbying avvisad från ${l.lobbying_agent}`,
      ikon: accepterade ? "💼" : "🛡",
      färg: "#60a5fa",
      extra: { fran: l.lobbying_agent, belopp: l.belopp },
    });
  }

  // Civilization events
  const CIV_IKON = {
    koalition_bildad: "🤝", allians_bruten: "💔", triumf: "🏆",
    skandal: "😱", förräderi: "🗡", marknadsseger: "💰",
    marknadskrasch: "📉", symbolkup: "👑",
  };
  for (const c of civMinnen) {
    events.push({
      typ: "civilisation",
      datum: c.skapad,
      rubrik: c.rubrik,
      beskrivning: c.beskrivning?.slice(0, 120),
      ikon: CIV_IKON[c.typ] ?? "⭐",
      färg: "#e8d5a3",
      extra: { typ: c.typ },
    });
  }

  // Feedback
  for (const f of feedback) {
    const skickad = f.fran_agent === namn;
    events.push({
      typ: "feedback",
      datum: f.skapad,
      rubrik: skickad
        ? `Skickade feedback till ${f.till_agent} (${f.kategori})`
        : `Fick feedback från ${f.fran_agent} (+${Math.round(f.belopp)} kr)`,
      beskrivning: f.motivering?.slice(0, 100),
      ikon: skickad ? "📤" : "📥",
      färg: skickad ? "#888880" : "#4ade80",
      extra: { belopp: f.belopp, kategori: f.kategori, skickad },
    });
  }

  // Sort newest first
  events.sort((a, b) => b.datum?.localeCompare(a.datum ?? "") ?? 0);

  const profil = AGENT_VISUELL[namn];
  const planbokenRow = planboken[0] ?? null;

  return (
    <HistorikVy
      namn={namn}
      profil={profil}
      danNu={danNu}
      kvalitetData={kvalitetData}
      positioner={positioner}
      events={events}
      planboken={planbokenRow}
      koalitioner={koalitioner}
    />
  );
}
