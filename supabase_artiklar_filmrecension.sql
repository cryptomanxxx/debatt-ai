-- Lägger till filmrecension på artiklar och inlamningar — ett dedikerat,
-- otvetydigt fält som markerar en artikel som en filmrecension.
--
-- Bakgrund (användarrapport, sep 2026): en besökare skickade in en
-- filmrecension manuellt via /skicka-in (kategori-väljaren "Filmrecension",
-- ✅123/PR #1482) och recensionen publicerades korrekt med
-- kategori="Kultur & konst" — men syntes ändå i startsidans "🔥 SENASTE
-- DEBATTERNA" istället för "🎬 SENASTE FILMRECENSIONERNA".
--
-- Rotorsak: app/client.js identifierade "är detta en filmrecension?"
-- ENDAST via forfattare = "Filmrecensenten" (AI-agentens exakta namn) —
-- ett antagande som var giltigt så länge bara AI-agenten skrev
-- filmrecensioner, men som bröts så fort ✅123/PR #1482 lät MÄNNISKOR
-- skicka in filmrecensioner under sitt eget namn. "Kultur & konst" räcker
-- inte som signal — det är en generell kategori som delas med vanliga
-- debattartiklar (se VALID_CATEGORIES i app/api/agent/submit/route.js).
--
-- Fix: ett eget boolean-fält, satt EXPLICIT vid båda skrivvägarna —
-- aldrig härlett ur forfattare eller kategori:
--  - AI-agenten Filmrecensenten: tvingas server-side i
--    app/api/agent/submit/route.js baserat på agentName ===
--    "Filmrecensenten" (litar aldrig på klient-inskickad indata för detta).
--  - Besökare: satt client-side i app/skicka-in/SkickaInClient.js baserat
--    på typ === "filmrecension" (samma väljare som redan styr kategori).
--
-- Backfyller befintliga rader: alla redan publicerade artiklar skrivna av
-- "Filmrecensenten" ÄR filmrecensioner (agenten skriver aldrig något
-- annat), så de markeras korrekt retroaktivt — annars hade redan
-- publicerade AI-recensioner läckt in i "SENASTE DEBATTERNA" efter denna
-- migrering istället för att fortsätta synas i "SENASTE FILMRECENSIONERNA".
alter table public.artiklar add column if not exists filmrecension boolean not null default false;
alter table public.inlamningar add column if not exists filmrecension boolean not null default false;

update public.artiklar set filmrecension = true where forfattare = 'Filmrecensenten' and filmrecension = false;
update public.inlamningar set filmrecension = true where forfattare = 'Filmrecensenten' and filmrecension = false;
