/**
 * Smoke-tester för app/lib/metrics.js — den kanoniska källan för Gini,
 * topp-N-andel och systemkontofiltrering.
 *
 * Körs med Nodes inbyggda testrunner (inga beroenden):
 *   node --test tests/*.test.mjs
 *
 * Testfallen speglar tests/test_berakningar.py — båda språken ska ge
 * identiska svar på identisk indata.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { SYSTEM_KONTON, EXKL_SYSTEM_QS, gini, toppAndel, filtreraSystemkonton, bootstrapKI, viktadMedian } =
  require("../app/lib/metrics.js");

const approx = (a, b, eps = 1e-9) =>
  assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

// ── Gini ────────────────────────────────────────────────────────────

test("gini: tom lista → 0", () => {
  assert.equal(gini([]), 0);
});

test("gini: perfekt jämlikhet → 0", () => {
  assert.equal(gini([100, 100, 100, 100]), 0);
});

test("gini: en har allt → (n-1)/n", () => {
  approx(gini([0, 0, 0, 1000]), 0.75);
});

test("gini: negativa saldon klampas till 0", () => {
  approx(gini([-500, 0, 0, 1000]), 0.75);
});

test("gini: paritet med Python-testfallen", () => {
  approx(gini([100, 200, 300, 400]), 0.25);
});

test("gini: Börskassan-scenariot (buggen 2026-07-04)", () => {
  const agenter = Array.from({ length: 24 }, () => 700);
  assert.equal(gini(agenter), 0);
  assert.ok(gini([...agenter, 100_000]) > 0.8); // så uppstod 0.862-felet
});

// ── toppAndel ───────────────────────────────────────────────────────

test("toppAndel: topp-3 av känd fördelning", () => {
  approx(toppAndel([500, 300, 100, 50, 50], 3), 0.9);
});

test("toppAndel: tom lista → 0", () => {
  assert.equal(toppAndel([], 3), 0);
});

// ── Systemkonton ────────────────────────────────────────────────────

test("filtreraSystemkonton: tar bort Statskassa och Börskassan", () => {
  const rader = [{ agent: "Filosof" }, { agent: "Börskassan" }, { agent: "Statskassa" }];
  const kvar = filtreraSystemkonton(rader);
  assert.deepEqual(kvar.map(r => r.agent), ["Filosof"]);
});

test("SYSTEM_KONTON innehåller båda systemkontona", () => {
  assert.deepEqual([...SYSTEM_KONTON].sort(), ["Börskassan", "Statskassa"]);
});

test("EXKL_SYSTEM_QS är ren ASCII (rå ö ger HPE_INVALID_URL i Node)", () => {
  assert.ok(/^[\x00-\x7F]*$/.test(EXKL_SYSTEM_QS));
  assert.ok(EXKL_SYSTEM_QS.includes("B%C3%B6rskassan"));
});

// ── Orakelexperimentet: kohorttilldelning (paritet med Python) ──────

const { orakelKohort, AGENTER: ORAKEL_AGENTER } = require("../app/lib/orakel.js");

// Samma förväntningstabell som i tests/test_berakningar.py — ändra alltid båda.
const ORAKEL_FORVANTAT = {
  "Mamman": "kontroll", "Den rike": "kontroll", "Optimisten": "kontroll",
  "Filosof": "orakel-a", "Kryptoanalytiker": "orakel-a", "Pensionären": "orakel-a",
  "Den sura": "orakel-b", "Nationalekonom": "orakel-b", "Tonåringen": "orakel-b",
};

test("orakelKohort: förväntad tilldelning (paritet med Python)", () => {
  for (const [namn, kohort] of Object.entries(ORAKEL_FORVANTAT)) {
    assert.equal(orakelKohort(namn), kohort, `${namn} ska vara ${kohort}`);
  }
});

test("orakelKohort: exakt 8/8/8-balans", () => {
  const c = { "kontroll": 0, "orakel-a": 0, "orakel-b": 0 };
  for (const namn of ORAKEL_AGENTER) c[orakelKohort(namn)]++;
  assert.deepEqual(c, { "kontroll": 8, "orakel-a": 8, "orakel-b": 8 });
});

test("orakelKohort: okänd agent → kontroll", () => {
  assert.equal(orakelKohort("Finns Inte"), "kontroll");
});

// ── bootstrapKI ─────────────────────────────────────────────────────

test("bootstrapKI: null vid färre än 5 värden", () => {
  assert.equal(bootstrapKI([1, 2, 3, 4]), null);
  assert.equal(bootstrapKI([]), null);
});

test("bootstrapKI: deterministiskt med samma seed", () => {
  const v = [3, -5, 12, 8, -1, 20, 4, 7, -3, 15];
  const a = bootstrapKI(v);
  const b = bootstrapKI(v);
  assert.deepEqual(a, b);
});

test("bootstrapKI: intervallet omsluter medelvärdet", () => {
  const v = [3, -5, 12, 8, -1, 20, 4, 7, -3, 15];
  const medel = v.reduce((s, x) => s + x, 0) / v.length;
  const ki = bootstrapKI(v);
  assert.ok(ki.lag <= medel && medel <= ki.hog, `${ki.lag} ≤ ${medel} ≤ ${ki.hog}`);
  assert.equal(ki.n, 10);
});

test("bootstrapKI: konstant data → punktintervall", () => {
  const ki = bootstrapKI([7, 7, 7, 7, 7, 7]);
  assert.equal(ki.lag, 7);
  assert.equal(ki.hog, 7);
});

test("bootstrapKI: tydligt positiv effekt → hela intervallet över 0", () => {
  // 30 värden kring +20 med måttlig spridning — KI ska inte omfatta 0
  const v = Array.from({ length: 30 }, (_, i) => 15 + (i % 11));
  const ki = bootstrapKI(v);
  assert.ok(ki.lag > 0, `förväntade lag > 0, fick ${ki.lag}`);
});

test("bootstrapKI: ignorerar NaN/Infinity", () => {
  const ki = bootstrapKI([5, NaN, 6, Infinity, 7, 5, 6, 7]);
  assert.equal(ki.n, 6);
});

// ── viktadMedian ────────────────────────────────────────────────────

test("viktadMedian: likformiga vikter = vanlig median", () => {
  const poster = [10, 20, 30, 40, 50].map(v => ({ varde: v, vikt: 1 }));
  assert.equal(viktadMedian(poster), 30);
});

test("viktadMedian: tung vikt drar medianen till sig", () => {
  const poster = [
    { varde: 10, vikt: 1 }, { varde: 20, vikt: 1 }, { varde: 100, vikt: 10 },
  ];
  assert.equal(viktadMedian(poster), 100);
});

test("viktadMedian: tom lista och ogiltiga poster → null", () => {
  assert.equal(viktadMedian([]), null);
  assert.equal(viktadMedian([{ varde: NaN, vikt: 1 }, { varde: 5, vikt: 0 }]), null);
});

test("viktadMedian: en post → dess värde", () => {
  assert.equal(viktadMedian([{ varde: 42, vikt: 0.1 }]), 42);
});
