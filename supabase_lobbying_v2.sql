-- Migrering v2: aktiverar Row-Level Security på lobbying_log.
--
-- Tabellen hade RLS explicit avstängd (ALTER TABLE lobbying_log
-- DISABLE ROW LEVEL SECURITY i supabase_lobbying.sql), och det
-- (numera borttagna) supabase_rls_fix.sql gav den theater-policyer
-- (pub sel/ins) — droppas här explicit (additiva RLS-policyer, se
-- CLAUDE.md).
--
-- Kartläggning: enda skrivpunkten är supabase_utils.py → kör_lobbying(),
-- anropad från agent.py och lobbying_test.py (båda workflows har redan
-- SUPABASE_SERVICE_ROLE_KEY). Funktionen rör även agent_roster_lag,
-- lagforslag, agent_planbocker och agent_transaktioner i samma anrop —
-- hela sb_key rebinds till service role (säkert oavsett dessa
-- tabellers egen policy; agent_transaktioner/agent_roster_lag/
-- lagforslag hanteras med egna dedikerade v2-migreringar senare i
-- genomgången, agent_planbocker som eget separat större projekt).
--
-- Många läsare (/lobbying, /formogenhet, /trust, /narrativ, /hjarnan)
-- använder redan anon-nyckeln för SELECT — publik läsning bevaras
-- (ingen PII).
--
-- Kör i Supabase SQL Editor EFTER supabase_lobbying.sql.

ALTER TABLE lobbying_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pub sel lobbying_log" ON lobbying_log;
DROP POLICY IF EXISTS "pub ins lobbying_log" ON lobbying_log;

DROP POLICY IF EXISTS "lobbying_log_select" ON lobbying_log;
CREATE POLICY "lobbying_log_select" ON lobbying_log FOR SELECT USING (true);
