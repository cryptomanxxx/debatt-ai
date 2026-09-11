// Delad, testbar modul för läsarbilders HMAC-raderingstoken
// (app/api/skicka-in/bild/route.js, se ✅116 i CLAUDE.md för bakgrund).
//
// Utbruten ur route.js dels för att slippa duplicera logiken om fler
// endpoints någon gång behöver samma token, dels — och framför allt — för
// att göra själva nyckelvalet testbart utan att behöva mutera process.env
// mellan testfall: valjHmacSecret() är en ren funktion som tar emot
// explicita indata istället för att läsa miljövariabler direkt.
//
// Kärnregeln (se historiken i CLAUDE.md ✅116): raderingstoken FÅR ALDRIG
// nycklas med anon-nyckeln (NEXT_PUBLIC_SUPABASE_ANON_KEY) — den är per
// definition publik/klientsynlig, så en HMAC nycklad med den vore
// förfalskningsbar av vem som helst. Bara SUPABASE_SERVICE_ROLE_KEY
// (server-only, aldrig skickad till klienten) är en giltig nyckel.
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Väljer HMAC-nyckeln ur explicita kandidater. MEDVETET utan fallback till
 * anon-nyckeln — `anonKey` tas emot bara för att göra uteslutningen
 * verifierbar i test, den används aldrig som returvärde.
 */
export function valjHmacSecret({ serviceRoleKey, anonKey } = {}) {
  void anonKey; // aldrig en giltig källa — se filhuvudkommentaren
  return serviceRoleKey || "";
}

/** Läser den faktiska nyckeln ur processmiljön vid anropstillfället. */
export function hamtaHmacSecret() {
  return valjHmacSecret({
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

/** Raderingstoken = HMAC-SHA256(filnamn) nyckad med den givna hemligheten. */
export function delningsToken(filnamn, secret) {
  return createHmac("sha256", secret || "").update(filnamn).digest("hex");
}

/**
 * Tidskonstant verifiering. Returnerar alltid `false` (fail closed) om
 * hemligheten saknas eller token inte har giltigt hex-format — ingen av
 * dessa vägar ska någonsin kunna räknas som "matchar".
 */
export function tokenMatchar(filnamn, token, secret) {
  if (!secret) return false;
  if (typeof token !== "string" || !/^[0-9a-f]{64}$/i.test(token)) return false;
  const forvantad = delningsToken(filnamn, secret);
  return timingSafeEqual(Buffer.from(token.toLowerCase(), "hex"), Buffer.from(forvantad, "hex"));
}
