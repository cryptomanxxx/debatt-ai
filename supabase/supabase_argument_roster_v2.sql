-- Migrering v2: aktiverar Row-Level Security på argument_roster.
--
-- Tabellen hade RLS explicit avstängd (ALTER TABLE argument_roster
-- DISABLE ROW LEVEL SECURITY i supabase_argument_roster.sql), och det
-- (numera borttagna) supabase_rls_fix.sql gav den theater-policyer
-- (pub sel/ins) — droppas här explicit (additiva RLS-policyer, se
-- CLAUDE.md).
--
-- Kartläggning: enda konsumenten är app/api/argument-roster/route.js
-- (GET + POST, läsarröster på artikelstycken). Routen körs server-side
-- (Vercel), så den kan säkert föredra SUPABASE_SERVICE_ROLE_KEY för
-- PATCH/POST. GET-läsningen använder redan anon-nyckeln — publik
-- SELECT bevaras (ingen PII).
--
-- Kör i Supabase SQL Editor EFTER supabase_argument_roster.sql.

ALTER TABLE argument_roster ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pub sel argument_roster" ON argument_roster;
DROP POLICY IF EXISTS "pub ins argument_roster" ON argument_roster;

DROP POLICY IF EXISTS "argument_roster_select" ON argument_roster;
CREATE POLICY "argument_roster_select" ON argument_roster FOR SELECT USING (true);
