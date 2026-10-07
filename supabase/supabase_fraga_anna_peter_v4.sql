-- Migrering: lägger till frågeläget på /fraga-anna-och-peter. Vidgar
-- aktion-CHECK:en på fraga_anna_peter_log med fyra nya värden
-- ('anna_svarar', 'peter_svarar', 'johan_svarar', 'oraklet_svarar') —
-- sparas när besökaren klistrat in en fråga (heuristiskt detekterad,
-- se arFraga() i app/fraga-anna-och-peter/page.js) och agenten genererat
-- ett svar via /api/fraga-anna-och-peter/svara, istället för att bara läsa
-- upp den inklistrade texten ordagrant (den befintliga '_sager'/
-- '_forklarar'-familjen). Utan denna migrering avvisar Postgres varje
-- försök att spara en sådan historikpost (INSERT misslyckas med ett
-- constraint-fel, tyst loggat av route.js men aldrig sparat). Samma
-- mönster som supabase_fraga_anna_peter_v2.sql (Johan) och
-- supabase_fraga_anna_peter_v3.sql (Oraklet). Kör i Supabase SQL Editor
-- efter supabase_fraga_anna_peter_v3.sql.

alter table fraga_anna_peter_log drop constraint if exists fraga_anna_peter_log_aktion_check;
alter table fraga_anna_peter_log add constraint fraga_anna_peter_log_aktion_check
  check (aktion in ('anna_sager', 'peter_sager', 'johan_sager', 'oraklet_forklarar', 'diskussion',
                     'anna_svarar', 'peter_svarar', 'johan_svarar', 'oraklet_svarar'));
