-- Migrering: lägger till Professor Oraklet som fjärde röst på
-- /fraga-anna-och-peter (nu döpt "Fråga AI-agenterna" i nav/rubrik). Vidgar
-- aktion-CHECK:en på fraga_anna_peter_log med 'oraklet_forklarar' — utan
-- detta avvisar Postgres varje försök att spara en historikpost där
-- besökaren lät Oraklet förklara text/en artikel (INSERT misslyckas med ett
-- constraint-fel, tyst loggat av route.js men aldrig sparat). Samma mönster
-- som supabase_fraga_anna_peter_v2.sql (Johan). Kör i Supabase SQL Editor
-- efter supabase_fraga_anna_peter_v2.sql.

alter table fraga_anna_peter_log drop constraint if exists fraga_anna_peter_log_aktion_check;
alter table fraga_anna_peter_log add constraint fraga_anna_peter_log_aktion_check
  check (aktion in ('anna_sager', 'peter_sager', 'johan_sager', 'oraklet_forklarar', 'diskussion'));
