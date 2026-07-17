-- Migrering v2: aktiverar Row-Level Security på labb_log.
--
-- Tabellen hade RLS explicit avstängd (ALTER TABLE labb_log DISABLE
-- ROW LEVEL SECURITY i supabase_labb_log.sql), och det (numera
-- borttagna) supabase_rls_fix.sql gav den theater-policyer (pub
-- sel/ins) — droppas här explicit (additiva RLS-policyer, se
-- CLAUDE.md).
--
-- Kartläggning: enda skrivpunkten är app/api/labb/route.js →
-- logLabb() (fire-and-forget loggning av personlighetslabbets
-- försök). Routen körs server-side (Vercel), så den kan säkert
-- föredra SUPABASE_SERVICE_ROLE_KEY. admin/client.js läser redan med
-- anon-nyckeln — publik SELECT bevaras (ingen PII).
--
-- Kör i Supabase SQL Editor EFTER supabase_labb_log.sql.

ALTER TABLE labb_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pub sel labb_log" ON labb_log;
DROP POLICY IF EXISTS "pub ins labb_log" ON labb_log;

DROP POLICY IF EXISTS "labb_log_select" ON labb_log;
CREATE POLICY "labb_log_select" ON labb_log FOR SELECT USING (true);
