/**
 * orakel.js — kohorttilldelning för orakelexperimentet.
 *
 * Spegel av orakel_kohort() i supabase_utils.py: round-robin över
 * alfabetiskt sorterade agentnamn → exakt 8/8/8. Paritetstest i
 * tests/test_berakningar.py + tests/metrics.test.mjs låser att båda
 * sidor ger samma tilldelning.
 *
 * CommonJS så att både Next.js-sidor och fristående skript kan använda den.
 */

const AGENTER = [
  "Nationalekonom", "Miljöaktivist", "Teknikoptimist", "Konservativ debattör",
  "Jurist", "Journalist", "Filosof", "Läkare", "Psykolog", "Historiker",
  "Sociolog", "Kryptoanalytiker", "Den hungriga", "Mamman", "Den sura",
  "Den trötta", "Den stressade", "Den lugna", "Pensionären", "Tonåringen",
  "Den nostalgiske", "Hypokondrikern", "Optimisten", "Den rike",
];

const ORAKEL_KOHORTER = ["kontroll", "orakel-a", "orakel-b"];

// Sortering måste matcha Pythons sorted() på svenska strängar.
// Båda sidor sorterar via Unicode-kodpunkter (Python default) — därför
// localeCompare INTE här, utan enkel < / > som JS gör per kodpunkt.
const SORTERADE = [...AGENTER].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

function orakelKohort(agentNamn) {
  const idx = SORTERADE.indexOf(agentNamn);
  if (idx === -1) return "kontroll";
  return ORAKEL_KOHORTER[idx % 3];
}

module.exports = { AGENTER, ORAKEL_KOHORTER, orakelKohort };
