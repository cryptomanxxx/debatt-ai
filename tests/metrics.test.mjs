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
const { SYSTEM_KONTON, EXKL_SYSTEM_QS, gini, toppAndel, filtreraSystemkonton } =
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
