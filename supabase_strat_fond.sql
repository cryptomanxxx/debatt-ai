-- STRAT Hedgefond — algoritmisk fond baserad på backtest-strategier
-- Kör i Supabase SQL Editor

-- 1. Registrera fonden (körs bara om den inte redan finns)
INSERT INTO hedgefonder (namn, symbol, förvaltare, beskrivning, strategi, nav_per_andel, total_andelar, aktiv)
SELECT 'Strat Fund', 'STRAT', 'Historiker',
       'Algoritmisk fond. Läser bästa backtest-strategi och applicerar buy/sell-signaler utan LLM.',
       'algo', 100, 0, true
WHERE NOT EXISTS (SELECT 1 FROM hedgefonder WHERE symbol = 'STRAT');

-- 2. Paper trading-tabeller (parallellt med intern fondhandel)

-- Nuvarande positioner
CREATE TABLE IF NOT EXISTS strat_paper_innehav (
  id            bigserial PRIMARY KEY,
  symbol        text      NOT NULL UNIQUE,
  antal         numeric   NOT NULL DEFAULT 0,
  kopt_pris_usd numeric   NOT NULL,
  entry_datum   date,
  uppdaterad    timestamptz DEFAULT now()
);

-- Dagliga NAV-snapshots med benchmark och aktiv strategi
CREATE TABLE IF NOT EXISTS strat_paper_nav (
  id                 bigserial PRIMARY KEY,
  portfölj_värde_usd numeric NOT NULL,
  kontant_usd        numeric NOT NULL,
  btc_benchmark_usd  numeric,
  spy_benchmark_usd  numeric,
  start_kapital_usd  numeric DEFAULT 10000,
  aktiv_strategi     text,
  aktiv_symbol       text,
  signal             text,
  backtest_avk_pct   numeric,
  skapad             timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE strat_paper_innehav ENABLE ROW LEVEL SECURITY;
ALTER TABLE strat_paper_nav     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Publik läsning strat_paper_innehav" ON strat_paper_innehav;
CREATE POLICY "Publik läsning strat_paper_innehav" ON strat_paper_innehav FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anon insert strat_paper_innehav" ON strat_paper_innehav;
CREATE POLICY "Anon insert strat_paper_innehav" ON strat_paper_innehav FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anon update strat_paper_innehav" ON strat_paper_innehav;
CREATE POLICY "Anon update strat_paper_innehav" ON strat_paper_innehav FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Publik läsning strat_paper_nav" ON strat_paper_nav;
CREATE POLICY "Publik läsning strat_paper_nav" ON strat_paper_nav FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anon insert strat_paper_nav" ON strat_paper_nav;
CREATE POLICY "Anon insert strat_paper_nav" ON strat_paper_nav FOR INSERT WITH CHECK (true);
