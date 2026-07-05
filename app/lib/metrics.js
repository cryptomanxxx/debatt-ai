/**
 * metrics.js — gemensam källa för ekonomiska nyckeltal.
 *
 * Skriven som CommonJS så att både Next.js-sidor (via import) och fristående
 * Node-skript i agents/ (via require) kan använda samma implementation.
 *
 * Historik: Gini beräknades tidigare på fyra ställen oberoende av varandra
 * (oligarki, ekonomi, /api/v1/state, economy-observer) med olika filtrering
 * av systemkonton — vilket gav 0.862 i en rapport och 0.339 på /oligarki
 * samma dag. All Gini/topp-N-beräkning ska gå via denna modul.
 */

// Systemkonton i agent_planbocker som aldrig ska ingå i förmögenhetsstatistik.
const SYSTEM_KONTON = ["Statskassa", "Börskassan"];

// Färdig query-fragment för Supabase REST. Percent-enkodad — Node's https
// accepterar inte rå "ö" i request-path (HPE_INVALID_URL).
const EXKL_SYSTEM_QS = "agent=neq.Statskassa&agent=neq.B%C3%B6rskassan";

/** Filtrerar bort systemkonton ur en lista med rader (default-nyckel: agent). */
function filtreraSystemkonton(rows, key = "agent") {
  const sys = new Set(SYSTEM_KONTON);
  return (rows || []).filter(r => !sys.has(r?.[key]));
}

/**
 * Gini-koefficient 0–1 (0 = perfekt jämlikhet). Negativa saldon klampas
 * till 0 innan beräkning. Returnerar oavrundat värde — avrunda vid visning.
 */
function gini(values) {
  const v = (values || []).map(x => Math.max(0, Number(x) || 0));
  const n = v.length;
  if (n === 0) return 0;
  const sorted = [...v].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  if (sum === 0) return 0;
  let g = 0;
  for (let i = 0; i < n; i++) g += (2 * (i + 1) - n - 1) * sorted[i];
  return Math.max(0, Math.min(1, g / (n * sum)));
}

/** Andel (0–1) av total förmögenhet som de N rikaste innehar. */
function toppAndel(values, n = 3) {
  const v = (values || []).map(x => Math.max(0, Number(x) || 0));
  const sum = v.reduce((a, b) => a + b, 0);
  if (sum === 0) return 0;
  const sorted = [...v].sort((a, b) => b - a);
  return sorted.slice(0, n).reduce((a, b) => a + b, 0) / sum;
}

/** Seedad PRNG (mulberry32) — deterministisk så att bootstrap-intervall
 *  är stabila mellan sidladdningar istället för att fladdra per render. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Bootstrap-konfidensintervall (percentilmetoden) för medelvärdet av `varden`.
 * Parat per observation: varje värde är redan en per-observation-differens/kvot,
 * så omsampling av hela observationer bevarar parningen.
 *
 * Returnerar { lag, hog, n } eller null om färre än 5 värden.
 */
function bootstrapKI(varden, { iterationer = 2000, alfa = 0.05, seed = 42 } = {}) {
  const v = (varden || []).filter(x => Number.isFinite(x));
  const n = v.length;
  if (n < 5) return null;
  const rand = mulberry32(seed);
  const medel = arr => arr.reduce((s, x) => s + x, 0) / arr.length;
  const stickprov = new Array(iterationer);
  for (let i = 0; i < iterationer; i++) {
    let s = 0;
    for (let j = 0; j < n; j++) s += v[(rand() * n) | 0];
    stickprov[i] = s / n;
  }
  stickprov.sort((a, b) => a - b);
  const lo = stickprov[Math.floor((alfa / 2) * iterationer)];
  const hi = stickprov[Math.ceil((1 - alfa / 2) * iterationer) - 1];
  return { lag: lo, hog: hi, n };
}

module.exports = { SYSTEM_KONTON, EXKL_SYSTEM_QS, filtreraSystemkonton, gini, toppAndel, bootstrapKI };
