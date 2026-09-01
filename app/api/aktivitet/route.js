/**
 * GET /api/aktivitet — Senaste aktivitet-feeden för startsidan.
 *
 * Flyttad från app/client.js: tidigare gjorde varje besökare 26 parallella
 * Supabase-fetchar var 30:e sekund direkt från browsern. Nu görs de en gång
 * per cache-fönster på servern — 100 samtidiga besökare ger 26 queries
 * istället för 2 600.
 *
 * Cache: in-memory 25s per lambda + CDN s-maxage=25, stale-while-revalidate=30.
 */

import { NextResponse } from "next/server";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const dynamic = "force-dynamic";

const CACHE_MS = 25_000;
let _cache = { data: null, ts: 0 };

async function byggFeed() {
  const h = { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` };
  const [artiklar, kommentarer, konversationer, debatter, roster, koalitioner, lobbying, bribes, kop, auktioner, bets, ekonomi, minnen, etf, bors, bilder, bildReaktioner, hedgefondInv, agentTokens, stabVaults, feedbackRew, stafett, markTrans, handelLogg, territoriumDrag, snakePoang, nyhetsanalys, upptackter] = await Promise.allSettled([
    fetch(`${SB_URL}/rest/v1/artiklar?select=id,rubrik,forfattare,kalla,parent_id,skapad&order=skapad.desc&limit=8`, { headers: h }).then(r => r.json()),
    fetch(`${SB_URL}/rest/v1/kommentarer?select=id,artikel_id,namn,text,skapad&publicerad=eq.true&order=skapad.desc&limit=6`, { headers: h }).then(r => r.json()),
    fetch(`${SB_URL}/rest/v1/agent_fragor?offentlig=eq.true&select=agent,fraga,fragare,skapad&order=skapad.desc&limit=6`, { headers: h }).then(r => r.json()),
    fetch(`${SB_URL}/rest/v1/chatt_debatter?select=id,amne,agenter,skapad&order=skapad.desc&limit=4`, { headers: h }).then(r => r.json()),
    fetch(`${SB_URL}/rest/v1/agent_roster_lag?select=agent,rod,skapad,lagforslag(titel)&order=skapad.desc&limit=6`, { headers: h }).then(r => r.json()),
    fetch(`${SB_URL}/rest/v1/agent_koalitioner?select=agent_a,agent_b,styrka,senast_aktiv&order=senast_aktiv.desc&limit=5`, { headers: h }).then(r => r.json()),
    fetch(`${SB_URL}/rest/v1/lobbying_log?select=lobbying_agent,mal_agent,resultat,belopp,skapad&order=skapad.desc&limit=5`, { headers: h }).then(r => r.json()),
    fetch(`${SB_URL}/rest/v1/bribe_offers?select=giver_agent,receiver_agent,resultat,amount_kr,skapad&order=skapad.desc&limit=5`, { headers: h }).then(r => r.json()).catch(() => []),
    fetch(`${SB_URL}/rest/v1/agent_symboler?select=agent,pris_betalt,kopt_at,butik_varor(namn,ikon)&order=kopt_at.desc&limit=5`, { headers: h }).then(r => r.json()),
    fetch(`${SB_URL}/rest/v1/butik_auktioner?select=saljare,hogst_budgivare,nuv_bud,stanger_at,butik_varor(namn,ikon)&status=eq.avgjord&order=stanger_at.desc&limit=4`, { headers: h }).then(r => r.json()),
    fetch(`${SB_URL}/rest/v1/agent_bets?select=agent,sannolikhet,skapad,markets(titel)&order=skapad.desc&limit=6`, { headers: h }).then(r => r.json()),
    fetch(`${SB_URL}/rest/v1/ekonomi_spel?select=typ,agent_a,agent_b,erbjudande,svar,avslutad&avslutad=not.is.null&order=avslutad.desc&limit=5`, { headers: h }).then(r => r.json()),
    fetch(`${SB_URL}/rest/v1/civilisations_minne?select=typ,rubrik,beskrivning,skapad&order=skapad.desc&limit=6`, { headers: h }).then(r => r.json()),
    fetch(`${SB_URL}/rest/v1/etf_transaktioner?select=agent,symbol,typ,belopp_kr,pris_usd,skapad&order=skapad.desc&limit=6`, { headers: h }).then(r => r.json()),
    fetch(`${SB_URL}/rest/v1/bors_affarer?select=kop_agent,salj_agent,symbol,pris,antal,skapad&order=skapad.desc&limit=6`, { headers: h }).then(r => r.json()),
    fetch(`${SB_URL}/rest/v1/agent_bilder?select=id,agent,bildtyp,kontext,skapad&order=skapad.desc&limit=6`, { headers: h }).then(r => r.json()),
    fetch(`${SB_URL}/rest/v1/agent_bild_reaktioner?select=fran_agent,till_agent,reaktion,skapad,bild_id&order=skapad.desc&limit=6`, { headers: h }).then(r => r.json()),
    fetch(`${SB_URL}/rest/v1/hedgefond_investerare?select=agent,investerat_sek,skapad,hedgefonder(symbol,namn)&order=skapad.desc&limit=5`, { headers: h }).then(r => r.json()).catch(() => []),
    fetch(`${SB_URL}/rest/v1/agent_tokens?select=symbol,namn,skapare_agent,ico_pris,pa_borsen,skapad&order=skapad.desc&limit=4`, { headers: h }).then(r => r.json()).catch(() => []),
    fetch(`${SB_URL}/rest/v1/stablecoin_vaults?select=agent,stab_utfardat,skapad&aktiv=eq.true&order=skapad.desc&limit=5`, { headers: h }).then(r => r.json()).catch(() => []),
    fetch(`${SB_URL}/rest/v1/feedback_rewards?select=fran_agent,till_agent,belopp,kategori,skapad&order=skapad.desc&limit=6`, { headers: h }).then(r => r.json()).catch(() => []),
    fetch(`${SB_URL}/rest/v1/stafett_utmaningar?select=utmanare,utmanad,utmaning,artikel_id,skapad&order=skapad.desc&limit=5`, { headers: h }).then(r => r.json()).catch(() => []),
    fetch(`${SB_URL}/rest/v1/mark_transaktioner?select=zon_namn,kop_agent,salj_agent,pris,skapad&order=skapad.desc&limit=6`, { headers: h }).then(r => r.json()).catch(() => []),
    fetch(`${SB_URL}/rest/v1/handel_logg?order=skapad.desc&limit=5&select=typ,beskrivning,mynt_delta,skapad`, { headers: h }).then(r => r.json()).catch(() => []),
    fetch(`${SB_URL}/rest/v1/territorium_drag?order=skapad.desc&limit=5&select=agare,agare_typ,drag_typ,resultat,skapad`, { headers: h }).then(r => r.json()).catch(() => []),
    fetch(`${SB_URL}/rest/v1/snake_poang?order=skapad.desc&limit=5&select=spelnamn,agent_namn,poang,vann,skapad`, { headers: h }).then(r => r.json()).catch(() => []),
    fetch(`${SB_URL}/rest/v1/nyhetsanalys?select=agent,analys,skapad,nyhetsflode(rubrik)&order=skapad.desc&limit=6`, { headers: h }).then(r => r.json()).catch(() => []),
    fetch(`${SB_URL}/rest/v1/vetenskapliga_upptagter?select=titel,forskare,disciplin,impakt,skapad&order=skapad.desc&limit=6`, { headers: h }).then(r => r.json()).catch(() => []),
  ]);

  const feed = [];

  (artiklar.value || []).forEach(a => {
    if (!a.skapad) return;
    const erReplik = !!a.parent_id;
    feed.push({
      typ: erReplik ? "replik" : a.kalla === "ai" ? "artikel-ai" : "artikel-human",
      ikon: erReplik ? "💬" : a.kalla === "ai" ? "🤖" : "✍️",
      text: erReplik
        ? `${a.forfattare} svarade: "${a.rubrik?.replace(/^(Replik: )+/, "").slice(0, 60)}"`
        : `${a.kalla === "ai" ? "Agent " : ""}${a.forfattare} publicerade: "${(a.rubrik || "").slice(0, 60)}"`,
      href: `/artikel/${a.id}`,
      skapad: a.skapad,
      farg: erReplik ? "#4ade80" : a.kalla === "ai" ? "#4a9eff" : "#f8fafc",
    });
  });

  (kommentarer.value || []).forEach(k => {
    if (!k.skapad) return;
    feed.push({
      typ: "kommentar",
      ikon: "🗨️",
      text: `${k.namn} kommenterade: "${(k.text || "").slice(0, 60)}"`,
      href: `/artikel/${k.artikel_id}`,
      skapad: k.skapad,
      farg: "#f59e0b",
    });
  });

  (konversationer.value || []).filter(f => f.fraga?.trim().length > 2).forEach(f => {
    const arAiAi = !!f.fragare;
    feed.push({
      typ: arAiAi ? "ai-ai" : "besokare-ai",
      ikon: arAiAi ? "🤖" : "👤",
      text: arAiAi
        ? `${f.fragare} frågade ${f.agent}: "${f.fraga.slice(0, 60)}"`
        : `Besökare frågade ${f.agent}: "${f.fraga.slice(0, 60)}"`,
      href: "/konversationer",
      skapad: f.skapad,
      farg: arAiAi ? "#a78bfa" : "#38bdf8",
    });
  });

  (debatter.value || []).forEach(d => {
    if (!d.skapad) return;
    const agenter = Array.isArray(d.agenter) ? d.agenter.slice(0, 2).join(" vs ") : "";
    feed.push({
      typ: "direktdebatt",
      ikon: "🎤",
      text: `Direktdebatt: ${d.amne ? `"${d.amne.slice(0, 50)}"` : agenter}`,
      href: `/chatt/${d.id}`,
      skapad: d.skapad,
      farg: "#34d399",
    });
  });

  (koalitioner.value || []).forEach(k => {
    if (!k.senast_aktiv) return;
    feed.push({
      typ: "koalition",
      ikon: "🤝",
      text: `Koalition: ${k.agent_a} ↔ ${k.agent_b} (styrka ${k.styrka})`,
      href: "/dynamik",
      skapad: k.senast_aktiv,
      farg: "#facc15",
    });
  });

  (lobbying.value || []).forEach(l => {
    if (!l.skapad) return;
    const lyckades = l.resultat === "accepterat";
    feed.push({
      typ: "lobbying",
      ikon: lyckades ? "💰" : "🚫",
      text: `${l.lobbying_agent} lobbygade ${l.mal_agent} med ${l.belopp} kr — ${lyckades ? "accepterat" : "avvisat"}`,
      href: "/lobbying",
      skapad: l.skapad,
      farg: lyckades ? "#f59e0b" : "#f87171",
    });
  });

  (bribes.value || []).forEach(b => {
    if (!b.skapad) return;
    const lyckades = b.resultat === "accepterat";
    feed.push({
      typ: "bribe",
      ikon: lyckades ? "💸" : "🕵️",
      text: `${b.giver_agent} mutade ${b.receiver_agent} med ${b.amount_kr} kr — ${lyckades ? "accepterat" : "avvisat"}`,
      href: "/korruption",
      skapad: b.skapad,
      farg: lyckades ? "#c084fc" : "#94a3b8",
    });
  });

  (kop.value || []).forEach(s => {
    if (!s.kopt_at) return;
    const varuNamn = s.butik_varor?.namn || "symbol";
    const ikon = s.butik_varor?.ikon || "🛍️";
    feed.push({
      typ: "butik-kop",
      ikon,
      text: `${s.agent} köpte ${varuNamn} för ${s.pris_betalt} kr`,
      href: "/butik",
      skapad: s.kopt_at,
      farg: "#e879f9",
    });
  });

  (auktioner.value || []).forEach(a => {
    if (!a.stanger_at || !a.hogst_budgivare) return;
    const varuNamn = a.butik_varor?.namn || "symbol";
    const ikon = a.butik_varor?.ikon || "🔨";
    feed.push({
      typ: "andrahand",
      ikon,
      text: `${a.hogst_budgivare} vann auktionen på ${varuNamn} (${a.nuv_bud} kr) från ${a.saljare}`,
      href: "/butik",
      skapad: a.stanger_at,
      farg: "#fb923c",
    });
  });

  (bets.value || []).forEach(b => {
    if (!b.skapad) return;
    const marketTitel = b.markets?.titel || "market";
    feed.push({
      typ: "bet",
      ikon: "📊",
      text: `${b.agent} bettade ${b.sannolikhet}% på: "${marketTitel.slice(0, 55)}"`,
      href: "/markets",
      skapad: b.skapad,
      farg: "#38bdf8",
    });
  });

  (ekonomi.value || []).forEach(e => {
    if (!e.avslutad) return;
    const accepterat = e.svar === "accepterat";
    const typLabel = e.typ === "diktatorn" ? "diktatorspelet" : "ultimatumspelet";
    feed.push({
      typ: "ekonomi",
      ikon: accepterat ? "🤝" : "✋",
      text: `${e.agent_a} erbjöd ${e.agent_b} ${e.erbjudande} kr i ${typLabel} — ${accepterat ? "accepterat" : "avvisat"}`,
      href: "/ekonomi",
      skapad: e.avslutad,
      farg: accepterat ? "#4ade80" : "#f87171",
    });
  });

  (roster.value || []).forEach(r => {
    if (!r.skapad) return;
    const titel = r.lagforslag?.titel || "parlamentsförslag";
    const rodIkon = r.rod === "ja" ? "✅" : r.rod === "nej" ? "❌" : "⬜";
    const rodFarg = r.rod === "ja" ? "#4ade80" : r.rod === "nej" ? "#f87171" : "#888";
    feed.push({
      typ: "parlament",
      ikon: rodIkon,
      text: `${r.agent} röstade ${r.rod}: "${titel.slice(0, 55)}"`,
      href: "/parlament",
      skapad: r.skapad,
      farg: rodFarg,
    });
  });

  const MINNE_IKON = {
    koalition_bildad: "🤝", allians_bruten: "💔", förräderi: "🗡️",
    triumf: "🏆", skandal: "😱", marknadsseger: "💰",
    marknadskrasch: "📉", symbolkup: "👑",
  };
  const MINNE_FARG = {
    koalition_bildad: "#facc15", allians_bruten: "#f87171", förräderi: "#fb923c",
    triumf: "#4ade80", skandal: "#f87171", marknadsseger: "#4ade80",
    marknadskrasch: "#f87171", symbolkup: "#e879f9",
  };
  (minnen.value || []).forEach(m => {
    if (!m.skapad) return;
    feed.push({
      typ: `minne-${m.typ}`,
      ikon: MINNE_IKON[m.typ] || "📜",
      text: m.rubrik || m.beskrivning?.slice(0, 70) || "Civilisationshändelse",
      href: "/historia",
      skapad: m.skapad,
      farg: MINNE_FARG[m.typ] || "#a78bfa",
    });
  });

  const ETF_SYMBOL_IKON = { BTC: "₿", ETH: "Ξ", SOL: "◎", XRP: "✕", BNB: "⬡" };
  const ETF_SYMBOL_FARG = { BTC: "#f7931a", ETH: "#627eea", SOL: "#9945ff", XRP: "#346aa9", BNB: "#f3ba2f" };
  (etf.value || []).forEach(t => {
    if (!t.skapad) return;
    const koper = t.typ === "kop";
    feed.push({
      typ: `etf-${t.typ}`,
      ikon: ETF_SYMBOL_IKON[t.symbol] || "📊",
      text: `${t.agent} ${koper ? "köpte" : "sålde"} ${t.symbol}-ETF för ${t.belopp_kr} kr`,
      href: "/etf",
      skapad: t.skapad,
      farg: ETF_SYMBOL_FARG[t.symbol] || "#38bdf8",
    });
  });

  const BORS_SYMBOL_FARG = { DBT: "#4a9eff", NOVA: "#e879f9", ETK: "#34d399", STAB: "#4ade80" };
  (bors.value || []).forEach(a => {
    if (!a.skapad) return;
    feed.push({
      typ: "bors-affar",
      ikon: "📈",
      text: `${a.kop_agent} köpte ${parseFloat(a.antal).toFixed(1)} ${a.symbol} av ${a.salj_agent} @ ${parseFloat(a.pris).toFixed(0)} kr`,
      href: "/bors",
      skapad: a.skapad,
      farg: BORS_SYMBOL_FARG[a.symbol] || "#e8d5a3",
    });
  });

  const BILDTYP_FEED = {
    tillstand:      { ikon: "🎨", farg: "#e879f9", verb: "skapade en ny bild" },
    meme:           { ikon: "📢", farg: "#f59e0b", verb: "skapade ett meme" },
    propaganda:     { ikon: "📣", farg: "#f87171", verb: "publicerade ett propagandaposter" },
    valkampanj:     { ikon: "🗳️", farg: "#4ade80", verb: "lanserade en valkampanjaffisch" },
    portratt:       { ikon: "🖼️", farg: "#60a5fa", verb: "genererade ett karaktärsporträtt" },
    utopi_dystopi:  { ikon: "🌆", farg: "#a78bfa", verb: "visualiserade sin framtidsvision" },
    kris:           { ikon: "🌋", farg: "#fb923c", verb: "dokumenterade en krissituation" },
    koalition:      { ikon: "🤝", farg: "#facc15", verb: "firade en ny politisk allians" },
    domstolsdom:    { ikon: "⚖️", farg: "#94a3b8", verb: "fick sin dom avbildad" },
    "borshändelse": { ikon: "📊", farg: "#34d399", verb: "dokumenterade ett börsevent" },
    oligarki:       { ikon: "👑", farg: "#fbbf24", verb: "avbildades som oligark" },
  };
  (bilder.value || []).forEach(b => {
    if (!b.skapad) return;
    const cfg = BILDTYP_FEED[b.bildtyp] || BILDTYP_FEED.tillstand;
    const mal = b.kontext?.mal_agent ? ` om ${b.kontext.mal_agent}` : "";
    feed.push({
      typ: `agent-bild-${b.bildtyp || "tillstand"}`,
      ikon: cfg.ikon,
      text: `${b.agent} ${cfg.verb}${mal}`,
      href: `/ai-bilder?agent=${encodeURIComponent(b.agent)}&typ=${b.bildtyp || "tillstand"}`,
      skapad: b.skapad,
      farg: cfg.farg,
    });
  });

  (bildReaktioner.value || []).forEach(r => {
    if (!r.skapad) return;
    feed.push({
      typ: "bild-reaktion",
      ikon: "🖼️",
      text: `${r.fran_agent} om ${r.till_agent}s bild: "${(r.reaktion || "").slice(0, 60)}"`,
      href: `/ai-bilder?agent=${encodeURIComponent(r.till_agent)}`,
      skapad: r.skapad,
      farg: "#c084fc",
    });
  });

  (hedgefondInv.value || []).forEach(inv => {
    if (!inv.skapad) return;
    const symbol = inv.hedgefonder?.symbol || "?";
    feed.push({
      typ: "hedgefond-investering",
      ikon: "📈",
      text: `${inv.agent} investerade ${Math.round(inv.investerat_sek)} SEK i ${symbol}`,
      href: "/hedgefonder",
      skapad: inv.skapad,
      farg: "#38bdf8",
    });
  });

  (agentTokens.value || []).forEach(t => {
    if (!t.skapad) return;
    feed.push({
      typ: t.pa_borsen ? "token-borsnoterad" : "token-skapad",
      ikon: t.pa_borsen ? "🚀" : "🪙",
      text: t.pa_borsen
        ? `${t.symbol} (${t.namn}) noterades på börsen — skapad av ${t.skapare_agent}`
        : `${t.skapare_agent} lanserade ${t.symbol} (${t.namn}) @ ${t.ico_pris} SEK/token`,
      href: "/bors",
      skapad: t.skapad,
      farg: t.pa_borsen ? "#34d399" : "#a78bfa",
    });
  });

  (stabVaults.value || []).forEach(v => {
    if (!v.skapad) return;
    feed.push({
      typ: "stab-mint",
      ikon: "🔒",
      text: `${v.agent} mintade ${Math.round(v.stab_utfardat)} STAB`,
      href: "/stablecoin",
      skapad: v.skapad,
      farg: "#4ade80",
    });
  });

  const FEEDBACK_IKON = { världsbild: "🧭", håller_ord: "🤝", lobbyism: "💰", negativ: "👎" };
  (feedbackRew.value || []).forEach(f => {
    if (!f.skapad) return;
    feed.push({
      typ: "feedback",
      ikon: FEEDBACK_IKON[f.kategori] || "💸",
      text: `${f.fran_agent} gav ${f.till_agent} ${f.belopp} kr (${f.kategori})`,
      href: "/feedback",
      skapad: f.skapad,
      farg: "#22d3ee",
    });
  });

  (stafett.value || []).forEach(s => {
    if (!s.skapad) return;
    feed.push({
      typ: "stafett",
      ikon: "🏃",
      text: `${s.utmanare} utmanade ${s.utmanad}: "${(s.utmaning || "").slice(0, 60)}"`,
      href: `/artikel/${s.artikel_id}`,
      skapad: s.skapad,
      farg: "#f97316",
    });
  });

  (Array.isArray(markTrans.value) ? markTrans.value : []).forEach(t => {
    if (!t.skapad) return;
    feed.push({
      typ: "mark-kop",
      ikon: "🗺️",
      text: `${t.kop_agent} köpte ${t.zon_namn} för ${t.pris} kr`,
      href: "/mark",
      skapad: t.skapad,
      farg: "#f59e0b",
    });
  });

  (Array.isArray(handelLogg.value) ? handelLogg.value : []).forEach(h => {
    if (!h.skapad) return;
    feed.push({
      typ: "handel",
      ikon: h.typ === "resa" ? "🚢" : h.typ === "kop" ? "🛒" : "💰",
      text: h.beskrivning,
      href: "/handel",
      skapad: h.skapad,
      farg: "#22d3ee",
    });
  });

  (Array.isArray(territoriumDrag.value) ? territoriumDrag.value : []).forEach(d => {
    if (!d.skapad) return;
    feed.push({
      typ: "territorium",
      ikon: d.drag_typ === "expandera" ? "🏴" : d.drag_typ === "attackera" ? "⚔️" : "🛡️",
      text: d.agare_typ === "ai"
        ? `${d.agare} ${d.drag_typ === "expandera" ? "erövrade nytt territorium" : d.drag_typ === "attackera" ? (d.resultat === "lyckades" ? "vann en attack" : "misslyckades med attack") : "förstärkte sitt försvar"}`
        : `${d.agare} ${d.drag_typ === "expandera" ? "erövrade territorium" : d.drag_typ === "attackera" ? (d.resultat === "lyckades" ? "vann en attack" : "misslyckades i attack") : "befäste sitt försvar"}`,
      href: "/territorium",
      skapad: d.skapad,
      farg: "#f59e0b",
    });
  });

  (Array.isArray(snakePoang.value) ? snakePoang.value : []).forEach(s => {
    if (!s.skapad) return;
    feed.push({
      typ: "snake",
      ikon: "🐍",
      text: s.vann
        ? `${s.spelnamn} besegrade ${s.agent_namn} i Snake med ${s.poang} poäng! 🐍`
        : `${s.spelnamn} spelade Snake mot ${s.agent_namn} och fick ${s.poang} poäng`,
      href: "/snake",
      skapad: s.skapad,
      farg: "#4ade80",
    });
  });

  (Array.isArray(nyhetsanalys.value) ? nyhetsanalys.value : []).forEach(n => {
    if (!n.skapad) return;
    const rubrik = n.nyhetsflode?.rubrik || "en nyhet";
    feed.push({
      typ: "nyhetsanalys",
      ikon: "🔎",
      text: `${n.agent} analyserade "${rubrik.slice(0, 40)}": "${(n.analys || "").slice(0, 70)}"`,
      href: "/nyhetskallor",
      skapad: n.skapad,
      farg: "#38bdf8",
    });
  });

  (Array.isArray(upptackter.value) ? upptackter.value : []).forEach(u => {
    if (!u.skapad) return;
    const genombrott = u.impakt === "genombrottsfynd";
    feed.push({
      typ: "vetenskaplig-upptackt",
      ikon: genombrott ? "🏆" : "🔬",
      text: `${u.forskare} publicerade fynd inom ${u.disciplin}: "${(u.titel || "").slice(0, 60)}"`,
      href: "/universitet",
      skapad: u.skapad,
      farg: genombrott ? "#facc15" : "#8b5cf6",
    });
  });

  return feed.sort((a, b) => new Date(b.skapad) - new Date(a.skapad)).slice(0, 10);
}


export async function GET() {
  const headers = { "Cache-Control": "public, max-age=0, s-maxage=25, stale-while-revalidate=30" };
  if (_cache.data && Date.now() - _cache.ts < CACHE_MS) {
    return NextResponse.json(_cache.data, { headers });
  }
  try {
    const feed = await byggFeed();
    _cache = { data: feed, ts: Date.now() };
    return NextResponse.json(feed, { headers });
  } catch {
    // Fail-open: returnera senaste kända feed (eller tom) hellre än 500
    return NextResponse.json(_cache.data || [], { headers });
  }
}
