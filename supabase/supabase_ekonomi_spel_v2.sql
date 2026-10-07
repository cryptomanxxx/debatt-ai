-- Migrering v2: aktiverar Row-Level Security på ekonomi_spel.
--
-- Tabellen hade RLS explicit avstängd (ALTER TABLE ekonomi_spel DISABLE ROW
-- LEVEL SECURITY i supabase_ekonomi.sql) — flaggat av Supabase-larmet
-- "rls_disabled_in_public" (12 jul 2026). Den nu borttagna
-- supabase_rls_fix.sql gav tabellen theater-policyer (pub sel/ins/upd)
-- — droppas här explicit (additiva RLS-policyer, se CLAUDE.md).
--
-- Kartläggning (sökt både rest/v1/ekonomi_spel och bara tabellnamnet i
-- citattecken, över både .py och .js): tre skrivpunkter i
-- supabase_utils.py — kör_diktatorspel(), kör_ultimatum_erbjudande(),
-- svara_ultimatum(). Dessa funktioner skriver ÄVEN till agent_planbocker
-- och agent_transaktioner (ännu inte RLS-fixade, egna separata projekt)
-- via samma _ekonomi_headers()-hjälpfunktion — en full function-rebind
-- av sb_key hade därför tyst föregripit de projekten. Löst med en ny
-- scoped hjälpfunktion _ekonomi_spel_write_headers() som bara används
-- för de tre rest/v1/ekonomi_spel-anropen (POST/PATCH); agent_planbocker/
-- agent_transaktioner-skrivningarna i samma funktioner rörs inte.
--
-- Läsare: app/ekonomi/page.js (SSR), app/api/aktivitet/route.js,
-- forskning_test.py, supabase_utils.py → hamta_pending_ultimatum(),
-- _hamta_ultimatum_historik() — bevarar publik SELECT via anon-nyckeln,
-- ingen PII i tabellen.
--
-- Kör i Supabase SQL Editor EFTER supabase_ekonomi.sql.

ALTER TABLE ekonomi_spel ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pub sel ekonomi_spel" ON ekonomi_spel;
DROP POLICY IF EXISTS "pub ins ekonomi_spel" ON ekonomi_spel;
DROP POLICY IF EXISTS "pub upd ekonomi_spel" ON ekonomi_spel;

DROP POLICY IF EXISTS "ekonomi_spel_select" ON ekonomi_spel;
CREATE POLICY "ekonomi_spel_select" ON ekonomi_spel FOR SELECT USING (true);
