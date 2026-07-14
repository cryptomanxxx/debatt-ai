-- Migrering v2: aktiverar Row-Level Security på ai_log.
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
-- Kör i Supabase SQL Editor EFTER supabase_ai_log.sql.

ALTER TABLE ai_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_log_select" ON ai_log;
CREATE POLICY "ai_log_select" ON ai_log FOR SELECT USING (true);
