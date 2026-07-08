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

/**
 * Viktad median: sortera på värde, ackumulera vikter, returnera första värdet
 * där den kumulativa vikten når halva totalvikten. Med likformiga vikter är
 * detta den vanliga medianen (nedre vid jämnt antal). Används av "Det lärande
 * kollektivet" i Visdomsspelet — expert-viktning à la multiplicative weights.
 */
function viktadMedian(poster) {
  const v = (poster || []).filter(p => Number.isFinite(p?.varde) && Number.isFinite(p?.vikt) && p.vikt > 0);
  if (!v.length) return null;
  const sorted = [...v].sort((a, b) => a.varde - b.varde);
  const total = sorted.reduce((s, p) => s + p.vikt, 0);
  const halva = total / 2;
  const EPS = total * 1e-9; // flyttalstolerans för exakt-halva-jämförelsen
  let cum = 0;
  for (let i = 0; i < sorted.length; i++) {
    cum += sorted[i].vikt;
    if (cum > halva + EPS) return sorted[i].varde;
    if (cum >= halva - EPS) {
      // Exakt halva vikten under gränsen (t.ex. likformiga vikter, jämnt antal):
      // medelvärdet av gränsvärdena — matchar Pythons statistics.median som
      // beräknar det lagrade Kollektivet-baslinjevärdet. Utan detta skiljer sig
      // det lärande kollektivet från baslinjen redan innan någon inlärning skett.
      return i + 1 < sorted.length ? (sorted[i].varde + sorted[i + 1].varde) / 2 : sorted[i].varde;
    }
  }
  return sorted[sorted.length - 1].varde;
}

/** Medelrang med tie-hantering: lika värden får genomsnittet av sina ranger. */
function _ranger(varden) {
  const idx = varden.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
  const ranger = new Array(varden.length);
  let i = 0;
  while (i < idx.length) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
    const medelRang = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) ranger[idx[k][1]] = medelRang;
    i = j + 1;
  }
  return ranger;
}

/**
 * Spearmans rangkorrelation (−1…1) — robust mot tunga svansar eftersom den
 * bara ser rangordningen, inte magnituderna. Används av diversitetsanalysen
 * i Visdomsspelet (felkorrelation mellan agentpar) och matchar PCI-mönstret
 * på korruptionssidan. Returnerar null vid < 3 par eller konstanta serier.
 */
function spearman(x, y) {
  if (!Array.isArray(x) || !Array.isArray(y) || x.length !== y.length || x.length < 3) return null;
  const rx = _ranger(x);
  const ry = _ranger(y);
  const n = x.length;
  const mx = rx.reduce((s, v) => s + v, 0) / n;
  const my = ry.reduce((s, v) => s + v, 0) / n;
  let cov = 0, vx = 0, vy = 0;
  for (let i = 0; i < n; i++) {
    const dx = rx[i] - mx, dy = ry[i] - my;
    cov += dx * dy; vx += dx * dx; vy += dy * dy;
  }
  if (vx === 0 || vy === 0) return null;
  return cov / Math.sqrt(vx * vy);
}

module.exports = { SYSTEM_KONTON, EXKL_SYSTEM_QS, filtreraSystemkonton, gini, toppAndel, bootstrapKI, viktadMedian, spearman };
