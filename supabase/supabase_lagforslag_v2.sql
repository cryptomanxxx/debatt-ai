-- Migrering v2: aktiverar Row-Level Security på lagforslag.
--
-- Tabellen hade RLS explicit avstängd (ALTER TABLE lagforslag DISABLE ROW
-- LEVEL SECURITY i supabase_parlament.sql) — flaggat av Supabase-larmet
-- "rls_disabled_in_public" (12 jul 2026). Den nu borttagna
-- supabase_rls_fix.sql gav tabellen theater-policyer (pub sel/ins/upd)
-- — droppas här explicit (additiva RLS-policyer, se CLAUDE.md).
--
-- Kartläggning (sökt både rest/v1/lagforslag och bara tabellnamnet i
-- citattecken, över både .py och .js):
--   Skrivare (alla nu på service role, med fallback till anon):
--     - app/api/admin/update-lagforslag/route.js (NY) — admin-panelens
--       manuella skapa/ta bort, routad från app/admin/client.js
--       (klientkomponent, kunde inte använda service role direkt)
--     - app/api/admin/riksdag-import/route.js — sbWriteHeaders() (NY),
--       plus lade till saknad x-admin-password-kontroll (token skickades
--       redan av riksdag-import.yml men validerades aldrig)
--     - app/api/v1/policy/simulate/route.js — redan service role sedan
--       tidigare
--     - app/api/admin/riksdag-utfall/route.js — redan service role,
--       men routen anropas inte längre någonstans (ersatt av
--       agents/riksdag-utfall.js)
--     - agents/riksdag-utfall.js — redan service role (SUPABASE_SERVICE_KEY)
--       via riksdag-utfall.yml
--     - supabase_utils.py: spara_lag_rost(), skapa_lagforslag_ai(),
--       importera_riksdagen_forslag(), kör_bribe() — full function-rebind
--       till SUPABASE_SERVICE_ROLE_KEY (NY). uppdatera_riksdagen_utfall(),
--       initiera_koalition(), kör_lobbying() hade redan service role från
--       tidigare fixar (lagforslag berörs bara som läsning/skrivning i
--       samma redan säkrade funktioner)
--     - parti_ekonomi_test.py — scoped lokal service-role-nyckel för just
--       lagforslag-anropet (NY, delar H_W med parti_kassor/parti_utgifter
--       som inte är i scope här) + SUPABASE_SERVICE_ROLE_KEY tillagd i
--       parti-ekonomi-test.yml
--     - foretag_test.py → sb_patch(h, "lagforslag", ...) — redan service
--       role via main()'s befintliga rebind (lobbying_log-fixen, PR #1238)
--   Läsare: app/parlament/page.js, app/pis/page.js, app/lobbying/page.js,
--     app/hjarnan/page.js, app/api/v1/policy/proposals/route.js,
--     app/admin/client.js (SELECT), supabase_utils.py → hamta_lagforslag()
--     m.fl. — bevarar publik SELECT via anon-nyckeln, ingen PII i tabellen
--
-- Kör i Supabase SQL Editor EFTER supabase_parlament.sql.

ALTER TABLE lagforslag ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pub sel lagforslag" ON lagforslag;
DROP POLICY IF EXISTS "pub ins lagforslag" ON lagforslag;
DROP POLICY IF EXISTS "pub upd lagforslag" ON lagforslag;

DROP POLICY IF EXISTS "lagforslag_select" ON lagforslag;
CREATE POLICY "lagforslag_select" ON lagforslag FOR SELECT USING (true);
