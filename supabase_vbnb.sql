-- VBNB — VanEck BNB ETF daglig datahistorik
-- Kör i Supabase SQL Editor

CREATE TABLE IF NOT EXISTS vbnb_data (
  id                 bigserial PRIMARY KEY,
  datum              date        NOT NULL UNIQUE,
  bnb_in_trust       numeric,          -- Antal BNB i trusten
  aum_usd            numeric,          -- Assets Under Management i USD
  nav_per_share      numeric,          -- NAV per aktie (USD)
  bnb_price_usd      numeric,          -- BNB-pris i USD vid stängning
  shares_outstanding bigint,           -- Antal aktier utestående
  datakalla          text DEFAULT 'yfinance',  -- 'yfinance' | 'vaneck' | 'beraknad'
  skapad             timestamptz DEFAULT now()
);

-- RLS: publik läsning för anon-nyckeln
ALTER TABLE vbnb_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read vbnb_data"
  ON vbnb_data FOR SELECT
  USING (true);

CREATE POLICY "service insert vbnb_data"
  ON vbnb_data FOR INSERT
  WITH CHECK (true);

CREATE POLICY "service update vbnb_data"
  ON vbnb_data FOR UPDATE
  USING (true);

-- Index för snabb datumsortering
CREATE INDEX IF NOT EXISTS vbnb_data_datum_idx ON vbnb_data (datum DESC);
