-- Migrering v2: aktiverar Row-Level Security på krypto_historik.
--
-- Tabellen hade RLS aldrig konfigurerat alls (ingen ENABLE, ingen DISABLE) —
-- flaggat av Supabase-larmet "rls_disabled_in_public" (12 jul 2026).
--
-- Kartläggning: enda konsumenten är data_agent.py → spara_krypto_historik()
-- (upsert på datum+symbol). Ingen läsare hittad någonstans i kodbasen — ren
-- historisk lagring, inte visad på någon sida ännu. SELECT hålls ändå publik
-- (konsekvent mönster, ingen PII, kostar inget) i fall en framtida sida vill
-- använda datan. data_agent.py uppdaterad att föredra
-- SUPABASE_SERVICE_ROLE_KEY för denna skrivning; secreten tillagd i data.yml.
--
-- Städar även bort ev. gamla permissiva policyer från supabase_rls_fix.sql
-- (pub sel/ins/upd krypto_historik) — se CLAUDE.md-varningen om additiva
-- RLS-policyer.
--
-- Kör i Supabase SQL Editor EFTER supabase_krypto_historik.sql.

ALTER TABLE krypto_historik ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pub sel krypto_historik" ON krypto_historik;
DROP POLICY IF EXISTS "pub ins krypto_historik" ON krypto_historik;
DROP POLICY IF EXISTS "pub upd krypto_historik" ON krypto_historik;

DROP POLICY IF EXISTS "krypto_historik_select" ON krypto_historik;
CREATE POLICY "krypto_historik_select" ON krypto_historik FOR SELECT USING (true);
