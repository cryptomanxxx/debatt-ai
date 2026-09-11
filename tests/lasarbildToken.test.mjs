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
import { valjHmacSecret, delningsToken, tokenMatchar } from "../app/lib/lasarbildToken.mjs";

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
