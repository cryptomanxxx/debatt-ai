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

module.exports = { SYSTEM_KONTON, EXKL_SYSTEM_QS, filtreraSystemkonton, gini, toppAndel };
