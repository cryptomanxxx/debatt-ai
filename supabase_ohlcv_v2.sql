-- Migrering v2: aktiverar Row-Level Security på ohlcv_cache.
--
-- Tabellen hade RLS aldrig konfigurerat alls — flaggat av Supabase-larmet
-- "rls_disabled_in_public" (12 jul 2026).
--
-- Kartläggning: tre skrivpunkter — backtest_fetch.py → spara_ohlcv()
-- (veckovis Yahoo Finance-bulkhämtning), hedgefond_test.py →
-- kop_etf_fond() (dagligt enskilt prispris för /etf-sidans P&L-beräkning),
-- och app/api/krypto-priser/route.js (live Binance-cache från Vercel,
-- upptäckt av Codex P2 på PR #1232 efter att den missades i första
-- kartläggningen). Många läsare (backtest.py, hedgefond_test.py,
-- arbi_test.py, kollusion_experiment_test.py, supabase_utils.py,
-- vbnb_fetch.py, samt flera sidor: /visualiseringar, /markets,
-- /agent/[namn], /etf, /hjarnan, /kollusionsspelet) använder redan
-- anon-nyckeln för SELECT — publik läsning bevaras (ingen PII).
--
-- Alla tre skrivare uppdaterade att föredra SUPABASE_SERVICE_ROLE_KEY.
-- Secreten fanns redan i backtest.yml (från #1230, men bara på
-- strategisteget — Codex P1 på #1232 fångade att fetch-steget som kör
-- backtest_fetch.py också behövde den); tillagd i hedgefond-test.yml.
-- Vercel-routen har redan SUPABASE_SERVICE_ROLE_KEY konfigurerat
-- (används brett i appen sedan tidigare).
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
