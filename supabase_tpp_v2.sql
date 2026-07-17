-- Migrering v2: aktiverar Row-Level Security på tpp_spel.
--
-- Tabellen hade RLS explicit avstängd (ALTER TABLE tpp_spel DISABLE ROW
-- LEVEL SECURITY i supabase_tpp.sql) — flaggat av Supabase-larmet
-- "rls_disabled_in_public" (12 jul 2026). Berördes inte av
-- supabase_rls_fix.sql, så inga theater-policyer att städa bort.
--
-- Kartläggning: enda skrivpunkten är supabase_utils.py → kör_tpp(),
-- anropad uteslutande från tpp_test.py (vars workflow redan har
-- SUPABASE_SERVICE_ROLE_KEY). Redan god design: spel-raden sparas FÖRST
-- och funktionen avbryter om det misslyckas, innan några saldon i
-- agent_planbocker rörs — ingen claim-först-omskrivning behövdes.
-- app/tpp/page.js läser redan med anon-nyckeln — publik SELECT bevaras
-- (ingen PII).
--
-- Kör i Supabase SQL Editor EFTER supabase_tpp.sql.

ALTER TABLE tpp_spel ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tpp_spel_select" ON tpp_spel;
CREATE POLICY "tpp_spel_select" ON tpp_spel FOR SELECT USING (true);
