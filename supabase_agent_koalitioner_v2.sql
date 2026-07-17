-- Migrering v2: aktiverar Row-Level Security på agent_koalitioner.
--
-- Tabellen hade RLS explicit avstängd (ALTER TABLE agent_koalitioner
-- DISABLE ROW LEVEL SECURITY i supabase_platform_stamning.sql) —
-- flaggat av Supabase-larmet "rls_disabled_in_public" (12 jul 2026).
-- supabase_rls_fix.sql gav tabellen "public full access"-policyer
-- (pub sel/ins/upd) — funktionellt identiskt med RLS avstängt. Droppas
-- här explicit (Postgres RLS-policyer är additiva — se CLAUDE.md).
--
-- Kartläggning: två skrivpunkter i supabase_utils.py —
-- upsert_koalition() (passiv koalitionsbildning, kallas från agent.py
-- och konversationer_bulk.py) och initiera_koalition() (aktiv
-- koalitionsbildning, kallas från agent.py och koalition_test.py, som
-- redan skickade in service role via egen SB_WRITE_KEY). Båda
-- funktioner löser nu internt SUPABASE_SERVICE_ROLE_KEY oavsett vilken
-- nyckel anroparen skickade in.
--
-- Många läsare (versus, dynamik, kunskapsgraf, fraktioner, hjarnan,
-- trust m.fl.) använder redan anon-nyckeln för SELECT — publik läsning
-- bevaras (ingen PII).
--
-- Secreten fanns redan i agent.yml och koalition-test.yml; tillagd i
-- konversationer-bulk.yml.
--
-- Kör i Supabase SQL Editor EFTER supabase_platform_stamning.sql.

ALTER TABLE agent_koalitioner ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pub sel agent_koalitioner" ON agent_koalitioner;
DROP POLICY IF EXISTS "pub ins agent_koalitioner" ON agent_koalitioner;
DROP POLICY IF EXISTS "pub upd agent_koalitioner" ON agent_koalitioner;

DROP POLICY IF EXISTS "agent_koalitioner_select" ON agent_koalitioner;
CREATE POLICY "agent_koalitioner_select" ON agent_koalitioner FOR SELECT USING (true);
