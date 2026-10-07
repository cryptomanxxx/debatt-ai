-- Migrering v2: aktiverar Row-Level Security på agent_positioner.
--
-- Tabellen hade RLS explicit avstängd (ALTER TABLE agent_positioner
-- DISABLE ROW LEVEL SECURITY i supabase_positioner.sql) — flaggat av
-- Supabase-larmet "rls_disabled_in_public" (12 jul 2026).
-- supabase_rls_fix.sql gav tabellen theater-policyer (pub sel/ins/upd)
-- — droppas här explicit (additiva RLS-policyer, se CLAUDE.md).
--
-- Kartläggning: enda skrivpunkten är supabase_utils.py →
-- uppdatera_agent_positioner(), anropad uteslutande från agent.py
-- (vars workflow redan har SUPABASE_SERVICE_ROLE_KEY). Funktionen är
-- helt självständig (rör aldrig agent_planbocker) — hela sb_key
-- rebinds till service role.
--
-- Många läsare (/kompass, /agent/[namn], /narrativ, /fraktioner,
-- /asiktsdrift) använder redan anon-nyckeln för SELECT — publik
-- läsning bevaras (ingen PII).
--
-- Kör i Supabase SQL Editor EFTER supabase_positioner.sql.

ALTER TABLE agent_positioner ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pub sel agent_positioner" ON agent_positioner;
DROP POLICY IF EXISTS "pub ins agent_positioner" ON agent_positioner;
DROP POLICY IF EXISTS "pub upd agent_positioner" ON agent_positioner;

DROP POLICY IF EXISTS "agent_positioner_select" ON agent_positioner;
CREATE POLICY "agent_positioner_select" ON agent_positioner FOR SELECT USING (true);
