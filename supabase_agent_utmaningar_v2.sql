-- Migrering v2: aktiverar Row-Level Security på agent_utmaningar.
--
-- Tabellen hade RLS explicit avstängd (ALTER TABLE agent_utmaningar
-- DISABLE ROW LEVEL SECURITY i supabase_agent_utmaningar.sql, kommentar
-- "anon-nyckeln behöver kunna skriva") — flaggat av Supabase-larmet
-- "rls_disabled_in_public" (12 jul 2026). Den nu borttagna
-- supabase_rls_fix.sql gav tabellen theater-policyer (pub sel/ins/upd)
-- — droppas här explicit (additiva RLS-policyer, se CLAUDE.md).
--
-- Kartläggning (sökt både rest/v1/agent_utmaningar och bara tabellnamnet
-- i citattecken, över både .py och .js):
--   Läsare: app/client.js (fetchSenasteUtmaningar, "use client" —
--     kräver publik SELECT via anon-nyckeln, ingen PII i tabellen)
--   Skrivare: app/api/agent-utmaning/route.js → sparaUtmaning() (enda
--     skrivpunkten, server-side API-route) — byter till
--     SUPABASE_SERVICE_ROLE_KEY (med fallback till anon om secreten
--     saknas i miljön) och loggar nu skrivfel via logFel() istället för
--     att tyst svälja dem.
--
-- Kör i Supabase SQL Editor EFTER supabase_agent_utmaningar.sql.

ALTER TABLE agent_utmaningar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pub sel agent_utmaningar" ON agent_utmaningar;
DROP POLICY IF EXISTS "pub ins agent_utmaningar" ON agent_utmaningar;
DROP POLICY IF EXISTS "pub upd agent_utmaningar" ON agent_utmaningar;

DROP POLICY IF EXISTS "agent_utmaningar_select" ON agent_utmaningar;
CREATE POLICY "agent_utmaningar_select" ON agent_utmaningar FOR SELECT USING (true);
