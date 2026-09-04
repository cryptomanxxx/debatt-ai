-- Migrering: lägger till Johan (Teknikoptimist) som tredje ankare på
-- /fraga-anna-och-peter. Vidgar aktion-CHECK:en på fraga_anna_peter_log med
-- 'johan_sager' — utan detta avvisar Postgres varje försök att spara en
-- historikpost där besökaren lät Johan läsa upp text (INSERT misslyckas med
-- ett constraint-fel, tyst loggat av route.js men aldrig sparat). Kör i
-- Supabase SQL Editor efter supabase_fraga_anna_peter.sql.

alter table fraga_anna_peter_log drop constraint if exists fraga_anna_peter_log_aktion_check;
alter table fraga_anna_peter_log add constraint fraga_anna_peter_log_aktion_check
  check (aktion in ('anna_sager', 'peter_sager', 'johan_sager', 'diskussion'));
