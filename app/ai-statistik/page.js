import AiStatistikVy from "./AiStatistikVy";

export const revalidate = 1800;

export const metadata = {
  title: "AI-statistik – DEBATT-AI",
  description: "Statistik över plattformens AI-anrop: andel lyckade anrop, latens och fel per provider, ur ai_log.",
};

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const HEADERS = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };

const DAGAR = 7;
const SIDSTORLEK = 1000;
const MAX_SIDOR = 50;
const STATUSAR = ["ok", "rate_limited", "timeout", "error"];

// Samma 7-dagarsfönster som provider_benchmark.py → hamta_produktion_ok_rate_7d().
// PostgREST begränsar svaret till 1000 rader, så raderna hämtas i sidor.
// Sidorna följer id nedåt (keyset): rader som skrivs medan hämtningen pågår
// får högre id och kan inte flytta sidgränserna, vilket offset hade gjort.
async function hamtaRader(sedan) {
  const rader = [];
  let sistaId = null;
  for (let sida = 0; sida < MAX_SIDOR; sida++) {
    const url = `${SB_URL}/rest/v1/ai_log?select=id,ts,provider,source,status,latency_ms`
      + `&ts=gte.${encodeURIComponent(sedan)}`
      + (sistaId != null ? `&id=lt.${sistaId}` : "")
      + `&order=id.desc&limit=${SIDSTORLEK}`;
    const res = await fetch(url, { headers: HEADERS, next: { revalidate: 1800 } });
    if (!res.ok) throw new Error(`ai_log ${res.status}`);
    const batch = await res.json();
    rader.push(...batch);
    if (batch.length < SIDSTORLEK) return { rader, avkortad: false };
    sistaId = batch[batch.length - 1].id;
  }
  return { rader, avkortad: true };
}

async function hamtaRanking() {
  try {
    const res = await fetch(`${SB_URL}/rest/v1/provider_config?id=eq.current&select=ranked_order,uppdaterad`,
      { headers: HEADERS, next: { revalidate: 1800 } });
    if (!res.ok) return null;
    const [rad] = await res.json();
    return rad && Array.isArray(rad.ranked_order) ? rad : null;
  } catch { return null; }
}

const DAG_FMT = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm", year: "numeric", month: "2-digit", day: "2-digit" });
const dagNyckel = (iso) => DAG_FMT.format(new Date(iso));

function normStatus(s) {
  if (s === "ok") return "ok";
  if (s === "timeout") return "timeout";
  if (s === "rate_limited" || s === "rate_limit" || s === "error_429") return "rate_limited";
  return "error";
}

function percentil(sorterad, p) {
  if (!sorterad.length) return null;
  const i = Math.min(sorterad.length - 1, Math.floor(p * sorterad.length));
  return sorterad[i];
}

function tomStatus() { return { ok: 0, rate_limited: 0, timeout: 0, error: 0 }; }

// Alla dagar i fönstret, så att en dag helt utan anrop syns i graferna
// istället för att axeln hoppar över den.
function allaDagar(sedan) {
  const dagar = new Set();
  for (let t = new Date(sedan).getTime(); t <= Date.now(); t += 3600000) dagar.add(dagNyckel(new Date(t).toISOString()));
  dagar.add(dagNyckel(new Date().toISOString()));
  return dagar;
}

function aggregera(rader, sedan) {
  const provider = new Map();
  const kalla = new Map();
  const dagStatus = new Map();
  const dagProvider = new Map();
  const total = tomStatus();
  const allaLatens = [];

  for (const r of rader) {
    const p = r.provider || "okänd";
    const s = normStatus(r.status);
    const dag = dagNyckel(r.ts);
    total[s]++;

    if (!provider.has(p)) provider.set(p, { ...tomStatus(), latens: [] });
    const pr = provider.get(p);
    pr[s]++;
    if (s === "ok" && Number.isFinite(r.latency_ms)) { pr.latens.push(r.latency_ms); allaLatens.push(r.latency_ms); }

    const k = r.source || "okänd";
    if (!kalla.has(k)) kalla.set(k, { ...tomStatus(), provider: new Map() });
    const kr = kalla.get(k);
    kr[s]++;
    kr.provider.set(p, (kr.provider.get(p) || 0) + 1);

    if (!dagStatus.has(dag)) dagStatus.set(dag, tomStatus());
    dagStatus.get(dag)[s]++;

    const dk = `${dag}|${p}`;
    if (!dagProvider.has(dk)) dagProvider.set(dk, { ok: 0, totalt: 0 });
    const dp = dagProvider.get(dk);
    dp.totalt++;
    if (s === "ok") dp.ok++;
  }

  const summa = (o) => STATUSAR.reduce((a, s) => a + o[s], 0);

  const perProvider = [...provider.entries()].map(([namn, o]) => {
    const latens = o.latens.sort((a, b) => a - b);
    const totalt = summa(o);
    return {
      namn, totalt, ok: o.ok, rate_limited: o.rate_limited, timeout: o.timeout, error: o.error,
      okAndel: totalt ? o.ok / totalt : null,
      p50: percentil(latens, 0.5), p90: percentil(latens, 0.9),
    };
  }).sort((a, b) => b.totalt - a.totalt);

  const perKalla = [...kalla.entries()].map(([namn, o]) => {
    const totalt = summa(o);
    const [huvud] = [...o.provider.entries()].sort((a, b) => b[1] - a[1]);
    return { namn, totalt, okAndel: totalt ? o.ok / totalt : null, huvudprovider: huvud ? huvud[0] : null };
  }).sort((a, b) => b.totalt - a.totalt).slice(0, 15);

  const dagar = [...new Set([...allaDagar(sedan), ...dagStatus.keys()])].sort();
  const daglig = dagar.map(d => ({ dag: d.slice(5), ...(dagStatus.get(d) || tomStatus()) }));

  const providerNamn = perProvider.map(p => p.namn);
  const dagligOk = dagar.map(d => {
    const rad = { dag: d.slice(5) };
    for (const p of providerNamn) {
      const dp = dagProvider.get(`${d}|${p}`);
      // Under 5 anrop en dag blir andelen för brusig för att plottas.
      rad[p] = dp && dp.totalt >= 5 ? Math.round((dp.ok / dp.totalt) * 1000) / 10 : null;
    }
    return rad;
  });

  const sorteradLatens = allaLatens.sort((a, b) => a - b);
  return {
    totalt: summa(total), total,
    okAndel: summa(total) ? total.ok / summa(total) : null,
    p50: percentil(sorteradLatens, 0.5),
    perProvider, perKalla, daglig, dagligOk,
  };
}

export default async function AiStatistikPage() {
  const sedan = new Date(Date.now() - DAGAR * 86400000).toISOString();
  let data = null;
  let fel = null;
  try {
    const { rader, avkortad } = await hamtaRader(sedan);
    data = { ...aggregera(rader, sedan), avkortad, dagar: DAGAR };
  } catch (e) {
    // Vid en bakgrundsregenerering kastas felet vidare, så att ISR behåller den
    // senaste fungerande sidan istället för att cacha en felsida i 30 minuter.
    // Under next build visas felvyn, så att en tillfällig Supabase-störning
    // inte fäller hela produktionsbygget (jfr ✅134).
    if (process.env.NEXT_PHASE !== "phase-production-build") throw e;
    fel = String(e?.message || e);
  }
  const ranking = await hamtaRanking();
  return <AiStatistikVy data={data} fel={fel} ranking={ranking} />;
}
