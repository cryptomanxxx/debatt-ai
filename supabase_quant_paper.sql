-- QUANT Paper Trading — riktiga marknadsdata, fiktivt kapital
-- Kör i Supabase SQL Editor

-- Nuvarande positioner
CREATE TABLE IF NOT EXISTS quant_paper_innehav (
  id            bigserial PRIMARY KEY,
  symbol        text      NOT NULL UNIQUE,
  antal         numeric   NOT NULL DEFAULT 0,
  kopt_pris_usd numeric   NOT NULL,
  uppdaterad    timestamptz DEFAULT now()
);

-- Dagliga NAV-snapshots med benchmark-jämförelse
CREATE TABLE IF NOT EXISTS quant_paper_nav (
  id                 bigserial PRIMARY KEY,
  portfölj_värde_usd numeric NOT NULL,
  kontant_usd        numeric NOT NULL,
  btc_benchmark_usd  numeric,
  spy_benchmark_usd  numeric,
  start_kapital_usd  numeric DEFAULT 10000,
  quant_motivering   text,
  skapad             timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE quant_paper_innehav ENABLE ROW LEVEL SECURITY;
ALTER TABLE quant_paper_nav     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Publik läsning quant_paper_innehav" ON quant_paper_innehav;
CREATE POLICY "Publik läsning quant_paper_innehav" ON quant_paper_innehav FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anon insert quant_paper_innehav" ON quant_paper_innehav;
CREATE POLICY "Anon insert quant_paper_innehav" ON quant_paper_innehav FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anon update quant_paper_innehav" ON quant_paper_innehav;
CREATE POLICY "Anon update quant_paper_innehav" ON quant_paper_innehav FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Publik läsning quant_paper_nav" ON quant_paper_nav;
CREATE POLICY "Publik läsning quant_paper_nav" ON quant_paper_nav FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anon insert quant_paper_nav" ON quant_paper_nav;
CREATE POLICY "Anon insert quant_paper_nav" ON quant_paper_nav FOR INSERT WITH CHECK (true);
