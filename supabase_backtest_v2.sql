-- Migrering v2: aktiverar Row-Level Security på backtest_resultat.
--
-- Tabellen hade RLS explicit avstängd (alter table backtest_resultat
-- disable row level security i supabase_backtest.sql) — flaggat av
-- Supabase-larmet "rls_disabled_in_public" (12 jul 2026).
--
-- Kartläggning: enda skrivpunkten är backtest.py (upsert på
-- symbol+strategi). Läsarna (hedgefond_test.py → strat_strategi(),
-- app/admin/client.js) använder redan anon-nyckeln för SELECT — publik
-- läsning bevaras (ingen PII, bara aggregerade backtest-nyckeltal).
-- backtest.py uppdaterad att föredra SUPABASE_SERVICE_ROLE_KEY för
-- skrivningen; secreten tillagd i backtest.yml + backtest_strategi.yml.
--
-- Städar även bort ev. gamla permissiva policyer från supabase_rls_fix.sql
-- (pub sel/ins/upd backtest_resultat) — se CLAUDE.md-varningen om
-- additiva RLS-policyer.
--
-- Kör i Supabase SQL Editor EFTER supabase_backtest.sql.

ALTER TABLE backtest_resultat ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pub sel backtest_resultat" ON backtest_resultat;
DROP POLICY IF EXISTS "pub ins backtest_resultat" ON backtest_resultat;
DROP POLICY IF EXISTS "pub upd backtest_resultat" ON backtest_resultat;

DROP POLICY IF EXISTS "backtest_resultat_select" ON backtest_resultat;
CREATE POLICY "backtest_resultat_select" ON backtest_resultat FOR SELECT USING (true);
