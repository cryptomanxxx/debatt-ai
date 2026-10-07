-- Migrering v2: aktiverar Row-Level Security på nyhetslog.
--
-- Tabellen hade RLS explicit avstängd (alter table nyhetslog disable row
-- level security i supabase_nyhetslog.sql) OCH explicita GRANT-satser som
-- gav anon/authenticated INSERT/UPDATE-rättigheter på tabellnivå — flaggat
-- av Supabase-larmet "rls_disabled_in_public" (12 jul 2026).
--
-- Kartläggning: enda skrivpunkten är supabase_utils.py → spara_nyhetslog(),
-- anropad uteslutande från agent.py (vars workflow redan har
-- SUPABASE_SERVICE_ROLE_KEY tillgänglig). Läsarna (agents/codestral-worker.js,
-- app/admin/client.js) använder redan anon-nyckeln för SELECT — publik
-- läsning bevaras (ingen PII, bara vilka nyheter agenterna utvärderat).
--
-- Städar även bort ev. gamla permissiva policyer från supabase_rls_fix.sql
-- (pub sel/ins nyhetslog) — se CLAUDE.md-varningen om additiva RLS-policyer.
--
-- Kör i Supabase SQL Editor EFTER supabase_nyhetslog.sql.

ALTER TABLE nyhetslog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pub sel nyhetslog" ON nyhetslog;
DROP POLICY IF EXISTS "pub ins nyhetslog" ON nyhetslog;

DROP POLICY IF EXISTS "nyhetslog_select" ON nyhetslog;
CREATE POLICY "nyhetslog_select" ON nyhetslog FOR SELECT USING (true);

-- Tar bort de gamla tabellnivå-rättigheterna — RLS blockerar redan anon-
-- skrivning utan en matchande policy, men detta gör avsikten entydig.
REVOKE INSERT, UPDATE ON nyhetslog FROM anon;
