-- Migrering v2: aktiverar Row-Level Security på agent_transaktioner.
--
-- Tabellen hade RLS explicit avstängd (ALTER TABLE agent_transaktioner
-- DISABLE ROW LEVEL SECURITY i supabase_ekonomi.sql) — flaggat av
-- Supabase-larmet "rls_disabled_in_public" (12 jul 2026). Den nu borttagna
-- supabase_rls_fix.sql gav tabellen theater-policyer (pub sel/ins,
-- append-only logg utan UPDATE-policy) — droppas här explicit (additiva
-- RLS-policyer, se CLAUDE.md).
--
-- Kartläggning (sökt både rest/v1/agent_transaktioner och bara
-- tabellnamnet i citattecken, över både .py och .js): två skrivpunkter i
-- supabase_utils.py:
--   - kör_lobbying() — redan service role sedan tidigare fix
--     (lobbying_log, kommentaren nämner uttryckligen agent_transaktioner)
--   - _spara_transaktion() (anropas från kör_diktatorspel() och
--     svara_ultimatum()) — full function-rebind till
--     SUPABASE_SERVICE_ROLE_KEY (NY). Rör bara denna tabell, ingen
--     scoping-konflikt med andra ännu ej fixade tabeller.
-- Läsare: app/ekonomi/page.js (SSR) — bevarar publik SELECT via
-- anon-nyckeln, ingen PII i tabellen.
--
-- Kör i Supabase SQL Editor EFTER supabase_ekonomi.sql.

ALTER TABLE agent_transaktioner ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pub sel agent_transaktioner" ON agent_transaktioner;
DROP POLICY IF EXISTS "pub ins agent_transaktioner" ON agent_transaktioner;
DROP POLICY IF EXISTS "pub upd agent_transaktioner" ON agent_transaktioner;

DROP POLICY IF EXISTS "agent_transaktioner_select" ON agent_transaktioner;
CREATE POLICY "agent_transaktioner_select" ON agent_transaktioner FOR SELECT USING (true);
