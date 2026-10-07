-- Migrering v2: aktiverar Row-Level Security på lobbying_log.
--
-- Tabellen hade RLS explicit avstängd (ALTER TABLE lobbying_log
-- DISABLE ROW LEVEL SECURITY i supabase_lobbying.sql), och det
-- (numera borttagna) supabase_rls_fix.sql gav den theater-policyer
-- (pub sel/ins) — droppas här explicit (additiva RLS-policyer, se
-- CLAUDE.md).
--
-- Kartläggning: två skrivpunkter — supabase_utils.py → kör_lobbying()
-- (agent.py + lobbying_test.py, båda workflows hade redan
-- SUPABASE_SERVICE_ROLE_KEY) och foretag_test.py (lobbybolag-
-- mekaniken, ✅83) — den senare missades i den första kartläggningen
-- eftersom den anropar en generisk sb_post(h, "lobbying_log", ...)-
-- hjälpfunktion med tabellnamnet som strängargument, inte en
-- rest/v1/lobbying_log-URL direkt i filen (Codex P1 på PR #1238).
-- foretag-test.yml saknade secreten helt — tillagd.
--
-- Båda skrivpunkterna rör även agent_roster_lag, lagforslag,
-- agent_planbocker och agent_transaktioner i samma anrop — sb_key
-- rebinds till service role (säkert oavsett dessa tabellers egen
-- policy; de hanteras med egna dedikerade v2-migreringar senare i
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
