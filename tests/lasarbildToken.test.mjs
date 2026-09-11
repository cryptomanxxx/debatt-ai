/**
 * Regressionstest för app/lib/lasarbildToken.mjs — HMAC-raderingstoken för
 * läsarbilder (se ✅116 i CLAUDE.md). Skyddar specifikt mot att
 * SUPABASE_SERVICE_ROLE_KEY (den enda giltiga nyckeln) någonsin ersätts av
 * eller blandas med den publika NEXT_PUBLIC_SUPABASE_ANON_KEY.
 *
 * Körs med Nodes inbyggda testrunner (inga beroenden):
 *   node --test tests/*.test.mjs
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { valjHmacSecret, hamtaHmacSecret, delningsToken, tokenMatchar } from "../app/lib/lasarbildToken.mjs";

// ── valjHmacSecret: anon-nyckeln är aldrig en giltig källa ─────────────

test("valjHmacSecret: väljer service-role-nyckeln när den finns", () => {
  assert.equal(
    valjHmacSecret({ serviceRoleKey: "hemlig-service-role", anonKey: "publik-anon" }),
    "hemlig-service-role"
  );
});

test("valjHmacSecret: faller ALDRIG tillbaka på anon-nyckeln när service-role saknas", () => {
  assert.equal(valjHmacSecret({ serviceRoleKey: "", anonKey: "publik-anon" }), "");
  assert.equal(valjHmacSecret({ serviceRoleKey: undefined, anonKey: "publik-anon" }), "");
  assert.equal(valjHmacSecret({}), "");
  assert.equal(valjHmacSecret(), "");
});

// ── tokenMatchar: fail closed när hemligheten saknas ───────────────────

test("tokenMatchar: returnerar false när secret saknas, oavsett hur giltigt tokenet ser ut", () => {
  const giltigtFormat = "a".repeat(64);
  assert.equal(tokenMatchar("bild.png", giltigtFormat, ""), false);
  assert.equal(tokenMatchar("bild.png", giltigtFormat, undefined), false);
  assert.equal(tokenMatchar("bild.png", giltigtFormat, null), false);
});

// ── Korrekt nyckel + korrekt token ──────────────────────────────────────

test("tokenMatchar: giltig token beräknad med rätt nyckel matchar", () => {
  const secret = "hemlig-service-role-nyckel";
  const filnamn = "11111111-1111-1111-1111-111111111111.png";
  const token = delningsToken(filnamn, secret);
  assert.equal(tokenMatchar(filnamn, token, secret), true);
});

test("tokenMatchar: olika filnamn ger olika token för samma nyckel", () => {
  const secret = "hemlig-service-role-nyckel";
  const t1 = delningsToken("a.png", secret);
  const t2 = delningsToken("b.png", secret);
  assert.notEqual(t1, t2);
});

// ── Förfalskning med anon-nyckeln avvisas alltid ────────────────────────

test("tokenMatchar: ett token beräknat med anon-nyckeln matchar aldrig mot service-role-nyckeln", () => {
  const serviceRoleKey = "hemlig-service-role-nyckel";
  const anonKey = "publik-anon-nyckel"; // känd av alla — inbäddad i klienten
  const filnamn = "22222222-2222-2222-2222-222222222222.png";

  // En anropare som bara känner till anon-nyckeln (t.ex. genom att läsa
  // NEXT_PUBLIC_SUPABASE_ANON_KEY i webbläsarbunten) försöker förfalska
  // ett raderingstoken.
  const forfalskatToken = delningsToken(filnamn, anonKey);

  assert.equal(tokenMatchar(filnamn, forfalskatToken, serviceRoleKey), false);
});

// ── Malformade tokens avvisas ────────────────────────────────────────────

test("tokenMatchar: avvisar malformade tokens", () => {
  const secret = "hemlig-service-role-nyckel";
  const filnamn = "33333333-3333-3333-3333-333333333333.png";

  assert.equal(tokenMatchar(filnamn, "inte-hex-alls", secret), false);
  assert.equal(tokenMatchar(filnamn, "a".repeat(63), secret), false); // en tecken kort
  assert.equal(tokenMatchar(filnamn, "a".repeat(65), secret), false); // en tecken för mycket
  assert.equal(tokenMatchar(filnamn, null, secret), false);
  assert.equal(tokenMatchar(filnamn, undefined, secret), false);
  assert.equal(tokenMatchar(filnamn, 12345, secret), false);
});

test("tokenMatchar: hex-jämförelsen är case-insensitive", () => {
  const secret = "hemlig-service-role-nyckel";
  const filnamn = "44444444-4444-4444-4444-444444444444.png";
  const token = delningsToken(filnamn, secret);
  assert.equal(tokenMatchar(filnamn, token.toUpperCase(), secret), true);
});

// ── hamtaHmacSecret: läser miljön färskt, faller aldrig tillbaka på anon ─
//
// Till skillnad från testerna ovan (som anropar de rena funktionerna med
// explicita indata) muterar de här process.env — de enda i filen som gör
// det. Ursprungsvärdena sparas och återställs alltid i en finally, så en
// mutation här aldrig läcker till andra tester i samma körning (`node
// --test tests/*.test.mjs` kan köra flera testfiler i samma process).

test("hamtaHmacSecret: läser SUPABASE_SERVICE_ROLE_KEY vid varje anrop, inte cachat vid modulladdning", () => {
  const sparadService = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const sparadAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  try {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    assert.equal(hamtaHmacSecret(), "");

    process.env.SUPABASE_SERVICE_ROLE_KEY = "hemlig-service-role-nyckel";
    assert.equal(hamtaHmacSecret(), "hemlig-service-role-nyckel");

    // En förändring av nyckeln vid körningstid (t.ex. secret roteras)
    // ska omedelbart återspeglas — ingen modulnivå-cache.
    process.env.SUPABASE_SERVICE_ROLE_KEY = "en-annan-nyckel";
    assert.equal(hamtaHmacSecret(), "en-annan-nyckel");
  } finally {
    if (sparadService === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = sparadService;
    if (sparadAnon === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = sparadAnon;
  }
});

test("hamtaHmacSecret: fail closed — faller ALDRIG tillbaka på NEXT_PUBLIC_SUPABASE_ANON_KEY", () => {
  const sparadService = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const sparadAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  try {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "publik-anon-nyckel";

    // Service-role saknas men anon-nyckeln finns satt — resultatet ska
    // fortfarande vara tomt, aldrig anon-nyckeln.
    assert.equal(hamtaHmacSecret(), "");
  } finally {
    if (sparadService === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = sparadService;
    if (sparadAnon === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = sparadAnon;
  }
});
