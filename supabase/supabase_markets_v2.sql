-- Migrering v2: aktiverar Row-Level Security på markets och agent_bets.
--
-- Båda tabellerna hade RLS aldrig konfigurerat alls — flaggat av
-- Supabase-larmet "rls_disabled_in_public" (12 jul 2026).
--
-- Kartläggning — skrivpunkter:
--   markets:
--     - supabase_utils.py → skapa_market_forslag() (agent föreslår market)
--     - data_agent.py → skapa_krypto_markets() / lös_krypto_markets()
--     - market_observer.py → avgora_market() (daglig auto-avgörning)
--     - app/admin/client.js → sparaMarket() (admin redigerar titel/beskrivning) —
--       klientsidan kan aldrig använda service role (anon-nyckeln är
--       webbläsarexponerad), så denna routades om via en ny server-side
--       route: app/api/admin/update-market/route.js (samma mönster som
--       redan finns för artiklar)
--   agent_bets:
--     - supabase_utils.py → spara_bet() (agent lägger bet)
--     - supabase_utils.py → reglera_prediction_bets() (avgör bets, kallas
--       från både agent.py och market_observer.py)
--
-- Många läsare (så gott som varje sida som visar agentstatistik) använder
-- redan anon-nyckeln för SELECT — publik läsning bevaras (ingen PII).
--
-- Secreten fanns redan i agent.yml och data.yml; tillagd i
-- market-observer.yml. app/api/admin/update-market/route.js och Vercel-
-- routorna använder redan SUPABASE_SERVICE_ROLE_KEY (konfigurerad sedan
-- tidigare för andra admin-routes).
--
-- Städar även bort ev. gamla permissiva policyer från supabase_rls_fix.sql
-- (pub sel/ins/upd markets, pub sel/ins/upd agent_bets) — se
-- CLAUDE.md-varningen om additiva RLS-policyer.
--
-- Kör i Supabase SQL Editor EFTER supabase_markets.sql.

ALTER TABLE markets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pub sel markets" ON markets;
DROP POLICY IF EXISTS "pub ins markets" ON markets;
DROP POLICY IF EXISTS "pub upd markets" ON markets;

DROP POLICY IF EXISTS "markets_select" ON markets;
CREATE POLICY "markets_select" ON markets FOR SELECT USING (true);

ALTER TABLE agent_bets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pub sel agent_bets" ON agent_bets;
DROP POLICY IF EXISTS "pub ins agent_bets" ON agent_bets;
DROP POLICY IF EXISTS "pub upd agent_bets" ON agent_bets;

DROP POLICY IF EXISTS "agent_bets_select" ON agent_bets;
CREATE POLICY "agent_bets_select" ON agent_bets FOR SELECT USING (true);
