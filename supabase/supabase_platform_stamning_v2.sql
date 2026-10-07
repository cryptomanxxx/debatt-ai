-- Migrering v2: aktiverar Row-Level Security på platform_stamning.
--
-- Tabellen hade RLS explicit avstängd (ALTER TABLE platform_stamning
-- DISABLE ROW LEVEL SECURITY i supabase_platform_stamning.sql), och
-- det (numera borttagna) supabase_rls_fix.sql gav den theater-policyer
-- (pub sel/upd) — droppas här explicit (additiva RLS-policyer, se
-- CLAUDE.md).
--
-- Kartläggning: enda skrivpunkten är app/api/platform-stamning/route.js
-- → POST (besökarröstning på de 4 parametrarna). Routen körs
-- server-side (Vercel) och uppdaterad att föredra
-- SUPABASE_SERVICE_ROLE_KEY — exponeras aldrig till webbläsaren.
-- GET-läsningen (samma route + agent.py + konversationer_bulk.py)
-- använder redan anon-nyckeln — publik SELECT bevaras (ingen PII).
--
-- Kör i Supabase SQL Editor EFTER supabase_platform_stamning.sql.

ALTER TABLE platform_stamning ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pub sel platform_stamning" ON platform_stamning;
DROP POLICY IF EXISTS "pub upd platform_stamning" ON platform_stamning;

DROP POLICY IF EXISTS "platform_stamning_select" ON platform_stamning;
CREATE POLICY "platform_stamning_select" ON platform_stamning FOR SELECT USING (true);
