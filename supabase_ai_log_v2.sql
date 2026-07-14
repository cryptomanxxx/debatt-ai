-- Migrering v2: aktiverar Row-Level Security på ai_log — och tar bort de
-- gamla "public full access"-policyerna från supabase_rls_fix.sql om den
-- filen körts (pub sel/ins ai_log, WITH CHECK (true) — funktionellt
-- identiskt med RLS avstängt). Postgres RLS-policyer är additiva (OR):
-- att bara lägga till en ny restriktiv SELECT-policy utan att ta bort den
-- gamla permissiva INSERT-policyn hade lämnat anon fri att skriva ändå
-- (Codex P2 på PR #1228).
--
-- Tabellen hade RLS explicit avstängd (ALTER TABLE ai_log DISABLE ROW LEVEL
-- SECURITY i supabase_ai_log.sql) — flaggat av Supabase-larmet
-- "rls_disabled_in_public" (12 jul 2026).
--
-- Data är okänslig (bara provider/model/source/status/latens/tokenantal —
-- ingen PII, ingen ekonomi), så publik SELECT bevaras (alla fyra läsare —
-- provider_benchmark.py, agents/codestral-worker.js,
-- agents/ai-performance-observer.js, app/admin/client.js — använder redan
-- anon-nyckeln). Skrivning sker från två centrala ställen
-- (ai_klient.py → _logga_ai_anrop(), app/lib/logAiCall.js) som båda
-- uppdaterades att föredra SUPABASE_SERVICE_ROLE_KEY. Ingen anon-skrivpolicy.
--
-- Kör i Supabase SQL Editor EFTER supabase_ai_log.sql (och EFTER
-- supabase_rls_fix.sql om den redan körts — ordningen spelar ingen roll
-- eftersom denna fil städar upp oavsett).

ALTER TABLE ai_log ENABLE ROW LEVEL SECURITY;

-- Städa bort ev. gamla permissiva policyer från supabase_rls_fix.sql
DROP POLICY IF EXISTS "pub sel ai_log" ON ai_log;
DROP POLICY IF EXISTS "pub ins ai_log" ON ai_log;

DROP POLICY IF EXISTS "ai_log_select" ON ai_log;
CREATE POLICY "ai_log_select" ON ai_log FOR SELECT USING (true);
