-- Migrering v2: aktiverar Row-Level Security på koalitioner (läsarkoalitioner).
--
-- Tabellen saknade RLS helt (Supabase-larm "rls_disabled_in_public", 12 jul 2026).
-- Lågriskfall jämfört med t.ex. amnes_prenumeranter: ingen PII, bara publika
-- följarantal per agent. Publik SELECT är avsedd — det är hela poängen med
-- /koalitioner-sidan. Skrivning sker redan uteslutande via app/api/koalition
-- (POST/DELETE), som redan använder SUPABASE_SERVICE_ROLE_KEY med anon-fallback
-- — ingen kodändring krävs, bara att stänga anon-skrivvägen i databasen.
--
-- Kör i Supabase SQL Editor EFTER supabase_koalitioner.sql.

ALTER TABLE koalitioner ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "koalitioner_select" ON koalitioner;
CREATE POLICY "koalitioner_select" ON koalitioner FOR SELECT USING (true);

-- Ingen INSERT/UPDATE/DELETE-policy för anon/authenticated — service role
-- (BYPASSRLS) är enda vägen in för skrivning, vilket app/api/koalition redan
-- är byggd för.
