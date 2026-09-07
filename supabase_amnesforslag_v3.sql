-- Kör i Supabase SQL Editor (efter supabase_amnesforslag.sql + supabase_amnesforslag_roster.sql + supabase_amnesforslag_v2.sql)
--
-- Bounded retries för ämnesförslag (Codex-fynd, PR #1405-granskning).
-- markera_forslag_behandlat() flyttades i samma PR till att bara köra vid en
-- faktisk publicering — ett ämnesförslag som konsekvent avvisas av
-- AI-redaktören (t.ex. ett ämne som är svårt att skriva en godkänd artikel
-- om) skulle annars kunna väljas om och om igen av hamta_amnesforslag()
-- eftersom förslag alltid har högst prioritet i agent.py, oavsett vilket
-- publiceringsfönster som triggade körningen — och därmed permanent svälta
-- ut både nya förslag och de schemalagda 4+4+4-fönstren.
--
-- forsok räknas upp av registrera_forslag_forsok() (supabase_utils.py) vid
-- varje avvisning. Vid MAX_FORSLAG_FORSOK (3) sätts behandlad=true även utan
-- publicerad artikel — förslaget ger då upp permanent istället för att
-- blockera kön i all oändlighet.

alter table amnesforslag add column if not exists forsok integer not null default 0;
