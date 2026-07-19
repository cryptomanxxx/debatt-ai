-- Migrering v2: aktiverar Row-Level Security på agent_roster_lag.
--
-- Tabellen hade RLS explicit avstängd (ALTER TABLE agent_roster_lag DISABLE
-- ROW LEVEL SECURITY i supabase_parlament.sql) — flaggat av Supabase-larmet
-- "rls_disabled_in_public" (12 jul 2026). Den nu borttagna
-- supabase_rls_fix.sql gav tabellen theater-policyer (pub sel/ins/upd)
-- — droppas här explicit (additiva RLS-policyer, se CLAUDE.md).
--
-- Kartläggning (sökt både rest/v1/agent_roster_lag och bara tabellnamnet i
-- citattecken, över både .py och .js): inga nya kodändringar krävdes —
-- samtliga skrivpunkter var redan säkrade med service role som en
-- bieffekt av de tidigare lagforslag- (#1246), agent_koalitioner- och
-- lobbying_log-fixarna (samma funktioner läser/skriver flera tabeller
-- via samma redan rebound-ade sb_key):
--   - supabase_utils.py → spara_lag_rost() (POST + räknar-PATCH)
--   - supabase_utils.py → kör_lobbying() (POST vid accepterad lobbying)
--   - supabase_utils.py → kör_bribe() (POST on_conflict vid accepterad muta)
--   - foretag_test.py → berakna_intakt_lobbybolag() (sb_upsert, h ärvt
--     från main()'s befintliga service-role-rebind)
-- Läsare (SSR/rapportskript, bevarar publik SELECT via anon-nyckeln):
--   app/parlament/page.js, app/ud/page.js, app/partier/page.js,
--   app/trust/page.js, app/api/aktivitet/route.js, diplomati_test.py,
--   forskning_test.py, agents/outcome-observer.js,
--   agents/civilisations-historiker.js, agents/daily-strategy.js,
--   supabase_utils.py → hamta_alla_roster_lag(), hamta_ledare_rost(),
--   _hamta_utfall_for_strategi()
--
-- Kör i Supabase SQL Editor EFTER supabase_parlament.sql.

ALTER TABLE agent_roster_lag ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pub sel agent_roster_lag" ON agent_roster_lag;
DROP POLICY IF EXISTS "pub ins agent_roster_lag" ON agent_roster_lag;
DROP POLICY IF EXISTS "pub upd agent_roster_lag" ON agent_roster_lag;

DROP POLICY IF EXISTS "agent_roster_lag_select" ON agent_roster_lag;
CREATE POLICY "agent_roster_lag_select" ON agent_roster_lag FOR SELECT USING (true);
