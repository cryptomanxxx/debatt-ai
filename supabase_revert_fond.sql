-- REVERT Hedgefond — mean reversion-fond baserad på z-score
-- Köper översålda kryptovalutor (z ≤ −1.5 mot MA20) och säljer när priset
-- återvänt till medelvärdet (z ≥ 0). Ren algoritmisk, ingen LLM — likt STRAT.
-- Kör i Supabase SQL Editor efter supabase_hedgefond.sql.

-- 1. Registrera fonden (körs bara om den inte redan finns)
INSERT INTO hedgefonder (namn, symbol, förvaltare, beskrivning, strategi, nav_per_andel, total_andelar, aktiv)
SELECT 'Revert Fund', 'REVERT', 'Den lugna',
       'Mean reversion-fond. Köper panik (z-score ≤ −1.5 mot MA20), säljer när priset återvänt till medelvärdet. Ingen LLM.',
       'mean_reversion', 100, 0, true
WHERE NOT EXISTS (SELECT 1 FROM hedgefonder WHERE symbol = 'REVERT');

-- 2. Paper trading-tabeller (samma mönster som strat_paper_*)

-- Nuvarande positioner (flera symboler kan ägas samtidigt)
CREATE TABLE IF NOT EXISTS revert_paper_innehav (
  id            bigserial PRIMARY KEY,
  symbol        text      NOT NULL UNIQUE,
  antal         numeric   NOT NULL DEFAULT 0,
  kopt_pris_usd numeric   NOT NULL,
  entry_datum   date,
  entry_z       numeric,
  uppdaterad    timestamptz DEFAULT now()
);

-- Dagliga NAV-snapshots med benchmark och z-scores
CREATE TABLE IF NOT EXISTS revert_paper_nav (
  id                 bigserial PRIMARY KEY,
  portfölj_värde_usd numeric NOT NULL,
  kontant_usd        numeric NOT NULL,
  btc_benchmark_usd  numeric,
  spy_benchmark_usd  numeric,
  start_kapital_usd  numeric DEFAULT 10000,
  signal             text,
  z_scores           jsonb,
  skapad             timestamptz DEFAULT now()
);

-- RLS: publik läsning, skrivning via anon-nyckeln från GitHub Actions
-- (samma policy-mönster som strat_paper_* och quant_paper_*)
ALTER TABLE revert_paper_innehav ENABLE ROW LEVEL SECURITY;
ALTER TABLE revert_paper_nav     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "revert_innehav_select" ON revert_paper_innehav;
CREATE POLICY "revert_innehav_select" ON revert_paper_innehav FOR SELECT USING (true);
DROP POLICY IF EXISTS "revert_innehav_insert" ON revert_paper_innehav;
CREATE POLICY "revert_innehav_insert" ON revert_paper_innehav FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "revert_innehav_update" ON revert_paper_innehav;
CREATE POLICY "revert_innehav_update" ON revert_paper_innehav FOR UPDATE USING (true);

DROP POLICY IF EXISTS "revert_nav_select" ON revert_paper_nav;
CREATE POLICY "revert_nav_select" ON revert_paper_nav FOR SELECT USING (true);
DROP POLICY IF EXISTS "revert_nav_insert" ON revert_paper_nav;
CREATE POLICY "revert_nav_insert" ON revert_paper_nav FOR INSERT WITH CHECK (true);
