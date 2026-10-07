-- nyhetsanalys v3: begränsar dubblett-dedupen till en enskild klick-händelse,
-- inte till agent+nyhet globalt.
--
-- Codex-fynd (PR #1370-granskning): v2:s unique(nyhet_id, agent) var för
-- bred. Den byggdes för att förhindra att en OMFÖRSÖK av samma klick (se
-- analyseraMedAgent() i NyhetskallorClient.js) skapade en synlig dubblett —
-- men samma constraint gjorde också att en HELT LEGITIM, senare analys av
-- samma agent på samma nyhet (en annan besökare, eller samma besökare en
-- annan dag) tyst skrev över den arkiverade föregångaren via upserten. Och
-- eftersom `skapad` inte ingick i upsert-payloaden behöll den överskrivna
-- raden sin URSPRUNGLIGA tidsstämpel — den nya analysen syntes aldrig som ny
-- aktivitet, trots att innehållet bytts ut under den.
--
-- Lösning: en per-klick idempotensnyckel (request_id) som klienten
-- genererar EN gång per analyseraMedAgent()-anrop och delar mellan ev.
-- omförsök av SAMMA klick. Unique-scope byts till (nyhet_id, agent,
-- request_id) — bara riktiga retries av samma klick (samma request_id)
-- kolliderar nu, inte oberoende analyser av samma agent+nyhet över tid.
--
-- NULL räknas som distinkt från alla andra värden (inklusive andra NULL) i
-- ett Postgres unique-index — så äldre rader (skapade innan denna kolumn
-- fanns) och den automatiska pipelinens rader (nyhetsanalys_auto_test.py,
-- som inte har detta klientbegrepp och alltid lämnar request_id NULL)
-- kolliderar aldrig med varandra eller med nya klientdrivna rader.
--
-- Kör i Supabase SQL Editor efter supabase_nyhetsanalys_v2.sql.

alter table nyhetsanalys add column if not exists request_id text;

alter table nyhetsanalys drop constraint if exists nyhetsanalys_nyhet_agent_key;
alter table nyhetsanalys add constraint nyhetsanalys_nyhet_agent_request_key
  unique (nyhet_id, agent, request_id);
