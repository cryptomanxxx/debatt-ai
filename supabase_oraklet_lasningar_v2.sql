-- Migrering: lägger till "urval" (Professor Oraklets Läslista, se
-- supabase_oraklet_urval.sql) som giltig typ på oraklet_lasningar. Vidgar
-- typ-CHECK:en — utan detta avvisar Postgres varje försök att logga en
-- uppläsning från den tredje fliken (INSERT misslyckas med ett
-- constraint-fel; /api/oraklet-lasning fångar felet och svarar fail-open
-- med {ok:false}, så uppläsningen fungerar men syns aldrig i Senaste
-- aktivitet-feeden — Codex-fynd, PR #1367-granskning). Kör i Supabase SQL
-- Editor efter supabase_oraklet_lasningar.sql.

alter table oraklet_lasningar drop constraint if exists oraklet_lasningar_typ_check;
alter table oraklet_lasningar add constraint oraklet_lasningar_typ_check
  check (typ in ('forskning', 'nyhet', 'urval'));
