-- Migrering v2: aktiverar Row-Level Security på ohlcv_cache.
--
-- Tabellen hade RLS aldrig konfigurerat alls — flaggat av Supabase-larmet
-- "rls_disabled_in_public" (12 jul 2026).
--
-- Kartläggning: två skrivpunkter — backtest_fetch.py → spara_ohlcv()
-- (veckovis Yahoo Finance-bulkhämtning) och hedgefond_test.py →
-- kop_etf_fond() (dagligt enskilt prispris för /etf-sidans P&L-beräkning).
-- Många läsare (backtest.py, hedgefond_test.py, arbi_test.py,
-- kollusion_experiment_test.py, supabase_utils.py, vbnb_fetch.py, samt
-- flera sidor: /visualiseringar, /markets, /agent/[namn], /etf, /hjarnan,
-- /kollusionsspelet) använder redan anon-nyckeln för SELECT — publik
-- läsning bevaras (ingen PII, bara historiska kryptopriser).
--
-- backtest_fetch.py och hedgefond_test.py uppdaterade att föredra
-- SUPABASE_SERVICE_ROLE_KEY för sina respektive skrivningar. Secreten
-- fanns redan i backtest.yml (från #1230); tillagd i hedgefond-test.yml.
--
-- Städar även bort ev. gamla permissiva policyer från supabase_rls_fix.sql
-- (pub sel/ins/upd ohlcv_cache) — se CLAUDE.md-varningen om additiva
-- RLS-policyer.
--
-- Kör i Supabase SQL Editor EFTER supabase_ohlcv.sql.

ALTER TABLE ohlcv_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pub sel ohlcv_cache" ON ohlcv_cache;
DROP POLICY IF EXISTS "pub ins ohlcv_cache" ON ohlcv_cache;
DROP POLICY IF EXISTS "pub upd ohlcv_cache" ON ohlcv_cache;

DROP POLICY IF EXISTS "ohlcv_cache_select" ON ohlcv_cache;
CREATE POLICY "ohlcv_cache_select" ON ohlcv_cache FOR SELECT USING (true);
