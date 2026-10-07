-- nyhetsanalys v2: förhindrar dubbletter för samma (nyhet, agent) och städar
-- upp befintliga dubbletter som orsakades av en bugg i /api/chatt.
--
-- Root cause (se CLAUDE.md ✅93): NyhetskallorClient.js's analyseraMedAgent()
-- gör om anropet när svaret "verkar avbrutet" (arTroligenAvbruten() — kort
-- text eller saknar avslutande skiljetecken), även när Groq-strömmen redan
-- avslutades korrekt med [DONE]. withNyhetsanalysSave() i app/api/chatt/
-- route.js sparade då VARJE komplett ström oberoende av de andra — utan en
-- UNIQUE-constraint på (nyhet_id, agent) skrevs två separata rader för
-- exakt samma besökarklick, båda synliga i Senaste aktivitet.
--
-- Kör i Supabase SQL Editor efter supabase_nyhetsanalys.sql.

-- Städa bort befintliga dubbletter innan constraint:en läggs på — behåll
-- den äldsta raden per (nyhet_id, agent) (den syntes redan i Senaste
-- aktivitet, så den håller kvar den ursprungliga tidsstämpeln).
delete from nyhetsanalys a
using nyhetsanalys b
where a.nyhet_id = b.nyhet_id
  and a.agent = b.agent
  and a.id > b.id;

alter table nyhetsanalys drop constraint if exists nyhetsanalys_nyhet_agent_key;
alter table nyhetsanalys add constraint nyhetsanalys_nyhet_agent_key unique (nyhet_id, agent);
