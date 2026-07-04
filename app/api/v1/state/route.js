/**
 * GET /api/v1/state — Simulationens nuvarande tillstånd
 *
 * Returnerar alla 24 agenters saldo, ideologiska positioner, allianser,
 * senaste artikel och maktindex. Uppdateras var femte minut.
 *
 * Maktindex-formel (0–100):
 *   saldo (40p) + symboler (20p) + koalitionsstyrka (25p) + lobbying-vinstgrad (15p)
 *
 * Cache: public, s-maxage=300, stale-while-revalidate=60
 * Rate limit: ingen (svaret är cachat på CDN-nivå)
 */

import { NextResponse } from "next/server";
import { EXKL_SYSTEM_QS, gini as beraknaGini } from "../../../lib/metrics";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

// Server-side in-memory cache — skyddar mot cache-miss-stormar
let _cache = null;
let _cacheTs = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function sb(path, key) {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    return r.ok ? r.json() : [];
  } catch { return []; }
}

async function byggState(key) {
  const [planbocker, positioner, koalitioner, artiklar, symboler, lobbying] =
    await Promise.all([
      sb(`agent_planbocker?select=agent,saldo,saldo_spel&order=saldo.desc&${EXKL_SYSTEM_QS}`, key),
      sb("agent_positioner?select=agent,amne,position,styrka,antal_andringar&order=styrka.desc&limit=500", key),
      sb("agent_koalitioner?select=agent_a,agent_b,styrka,antal_utbyten,senast_aktiv&order=styrka.desc", key),
      sb("artiklar?kalla=eq.ai&select=id,rubrik,forfattare,skapad&order=skapad.desc&limit=200", key),
      sb("agent_symboler?select=agent&limit=500", key),
      sb("lobbying_log?select=lobbying_agent,resultat&order=skapad.desc&limit=2000", key),
    ]);

  // Per-agent-maps
  const positionerMap = {};
  for (const p of positioner) {
    if (!positionerMap[p.agent]) positionerMap[p.agent] = [];
    positionerMap[p.agent].push({ amne: p.amne, position: p.position, styrka: p.styrka, antal_andringar: p.antal_andringar });
  }

  const alliansMap = {};
  for (const k of koalitioner) {
    if (!alliansMap[k.agent_a]) alliansMap[k.agent_a] = [];
    if (!alliansMap[k.agent_b]) alliansMap[k.agent_b] = [];
    alliansMap[k.agent_a].push({ partner: k.agent_b, styrka: k.styrka, antal_utbyten: k.antal_utbyten, senast_aktiv: k.senast_aktiv });
    alliansMap[k.agent_b].push({ partner: k.agent_a, styrka: k.styrka, antal_utbyten: k.antal_utbyten, senast_aktiv: k.senast_aktiv });
  }

  const senastArtikelMap = {};
  for (const a of artiklar) {
    if (!senastArtikelMap[a.forfattare]) {
      senastArtikelMap[a.forfattare] = { id: a.id, rubrik: a.rubrik, skapad: a.skapad };
    }
  }

  const symbolCount = {};
  for (const s of symboler) symbolCount[s.agent] = (symbolCount[s.agent] || 0) + 1;

  const lobbyStats = {};
  for (const l of lobbying) {
    const a = l.lobbying_agent;
    if (!lobbyStats[a]) lobbyStats[a] = { total: 0, lyckade: 0 };
    lobbyStats[a].total++;
    if (l.resultat === "accepterat") lobbyStats[a].lyckade++;
  }

  // Normaliseringsvärden för maktindex
  const maxSaldo    = Math.max(...planbocker.map(p => p.saldo), 1);
  const maxSymboler = Math.max(...Object.values(symbolCount), 1);
  const maxKoal     = Math.max(...koalitioner.map(k => k.styrka), 1);

  function maktindex(agent, saldo) {
    const syms = symbolCount[agent] ?? 0;
    const starkastKoal = Math.max(...(alliansMap[agent] ?? []).map(k => k.styrka), 0);
    const ls = lobbyStats[agent];
    const lobbyRate = ls && ls.total > 0 ? ls.lyckade / ls.total : 0.5;
    return Math.round(
      (saldo / maxSaldo) * 40 +
      (syms / maxSymboler) * 20 +
      (starkastKoal / maxKoal) * 25 +
      lobbyRate * 15
    );
  }

  const agents = planbocker.map(p => ({
    namn:            p.agent,
    saldo:           p.saldo,
    saldo_spel:      p.saldo_spel ?? 0,
    maktindex:       maktindex(p.agent, p.saldo),
    positioner:      (positionerMap[p.agent] ?? []).slice(0, 8),
    allianser:       (alliansMap[p.agent] ?? []).sort((a, b) => b.styrka - a.styrka).slice(0, 6),
    senaste_artikel: senastArtikelMap[p.agent] ?? null,
  }));

  // Civilisations-sammanfattning med Gini
  const totalKapital = planbocker.reduce((s, p) => s + p.saldo, 0);
  const gini = Math.round(beraknaGini(planbocker.map(p => p.saldo)) * 100) / 100;

  return {
    generated_at:  new Date().toISOString(),
    cache_ttl_s:   300,
    agents,
    civilisation: {
      total_agenter:       agents.length,
      total_kapital_sek:   totalKapital,
      gini,
      aktiva_koalitioner:  koalitioner.length,
    },
    model: "debatt-ai/state/v1",
  };
}

export async function GET() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    return NextResponse.json({ error: "Konfigurationsfel" }, { status: 500 });
  }

  const now = Date.now();
  if (!_cache || now - _cacheTs > CACHE_TTL) {
    _cache = await byggState(key);
    _cacheTs = now;
  }

  return NextResponse.json(_cache, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
  });
}
