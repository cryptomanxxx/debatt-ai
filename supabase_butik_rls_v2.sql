-- Migrering v2: aktiverar Row-Level Security på butikens fyra tabeller.
--
-- butik_varor, agent_symboler, butik_auktioner och butik_bud hade RLS
-- aldrig konfigurerat alls — flaggat av Supabase-larmet
-- "rls_disabled_in_public" (12 jul 2026). Ingen av dem berördes av
-- supabase_rls_fix.sql, så inga gamla theater-policyer att städa bort här.
--
-- Kartläggning — skrivpunkter:
--   butik_varor:   inflation.py (veckovis prisuppräkning 3%)
--   agent_symboler: supabase_utils.py → kop_statussymbol(), stang_auktioner()
--   butik_auktioner: supabase_utils.py → stang_auktioner(),
--                     lista_symbol_for_forsaljning(), buda_pa_auktion()
--   butik_bud:      supabase_utils.py → buda_pa_auktion()
--
-- De fyra funktionerna i supabase_utils.py kallas från både agent.py
-- (anon-nyckel) och butik_test.py/andrahand_test.py (redan service role
-- via egen SB_WRITE_KEY) — varje funktion löser nu internt
-- SUPABASE_SERVICE_ROLE_KEY oavsett vilken nyckel som skickades in, så
-- båda anropsvägarna fungerar korrekt.
--
-- Många läsare (app/butik/page.js, app/agent/[namn]/page.js,
-- app/client.js, app/hjarnan/page.js, app/arkiv/ArkivClient.js m.fl.)
-- använder redan anon-nyckeln för SELECT — publik läsning bevaras
-- (ingen PII).
--
-- Secreten fanns redan i agent.yml, butik-test.yml och andrahand-test.yml;
-- tillagd i inflation.yml.
--
-- Kör i Supabase SQL Editor EFTER supabase_butik.sql och
-- supabase_andrahand.sql.

ALTER TABLE butik_varor ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "butik_varor_select" ON butik_varor;
CREATE POLICY "butik_varor_select" ON butik_varor FOR SELECT USING (true);

ALTER TABLE agent_symboler ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agent_symboler_select" ON agent_symboler;
CREATE POLICY "agent_symboler_select" ON agent_symboler FOR SELECT USING (true);

ALTER TABLE butik_auktioner ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "butik_auktioner_select" ON butik_auktioner;
CREATE POLICY "butik_auktioner_select" ON butik_auktioner FOR SELECT USING (true);

ALTER TABLE butik_bud ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "butik_bud_select" ON butik_bud;
CREATE POLICY "butik_bud_select" ON butik_bud FOR SELECT USING (true);
