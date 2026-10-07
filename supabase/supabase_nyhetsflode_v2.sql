-- Migrering v2 för nyhetsflode — lägger till en dedikerad cache-kolumn för
-- Professor Oraklets uppläsningssammanfattning (/universitet, "Vetenskapliga
-- Nyheter"-fliken, "🎓 Professor Oraklet läser"-knappen).
--
-- Bakgrund: /api/nyhetsflode/forbered-lasning skrev tidigare berikad
-- fulltext (och ev. en översättning) rakt in i den PUBLIKA beskrivning-
-- kolumnen — samma kolumn som visas i den vanliga nyhetslistan. Två problem:
-- (1) fulltexten var rå, oredigerad sidtext (ingen innehållsavgränsning),
--     vilket blandade in navigering/sidfot/cookie-notiser/prenumerations-CTA:er
--     i det som lästes upp — användarrapport, en riktig Science Alert-artikel
--     visade tydligt hur oanvändbart resultatet blev;
-- (2) det förorenade den publika listförhandsvisningen (VetenskapsFlodeVy.js
--     visar beskrivning-kolumnen direkt) med skräptext, inte bara Oraklets
--     egen uppläsning.
--
-- Fixen: /api/nyhetsflode/forbered-lasning lämnar nu beskrivning orörd och
-- skriver istället en riktig LLM-genererad SAMMANFATTNING (som uttryckligen
-- ignorerar sidnavigering/sidfot/cookie-notiser och förklarar artikelns
-- faktiska innehåll på svenska) till denna nya kolumn. Sammanfattningen
-- genereras EN gång per artikel och cachas här — nästa klick på "Professor
-- Oraklet läser" för samma nyhet läser bara denna kolumn, ingen ny
-- nätverkshämtning eller LLM-anrop.
--
-- Kör i Supabase SQL Editor efter supabase_nyhetsflode.sql.

alter table nyhetsflode add column if not exists oraklet_sammanfattning text;

-- Ingen ny RLS-policy behövs — UPDATE på nyhetsflode kräver redan service
-- role (se supabase_nyhetsflode.sql), och denna kolumn skrivs uteslutande av
-- /api/nyhetsflode/forbered-lasning via SUPABASE_SERVICE_ROLE_KEY.
