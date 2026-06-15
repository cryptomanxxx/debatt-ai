-- ARBI Paper Trading — Funding Rate Arbitrage Fund
-- Kör detta i Supabase SQL Editor en gång.
-- Fonden simulerar spot-perpetual arbitrage med riktiga Binance funding rates.

CREATE TABLE IF NOT EXISTS arbi_paper_nav (
  id                    bigserial    PRIMARY KEY,
  portfölj_värde_usd    numeric      NOT NULL,
  inkomst_usd           numeric      NOT NULL DEFAULT 0,
  position_storlek_usd  numeric      NOT NULL,
  funding_rate_pct      numeric      NOT NULL,   -- 8h funding rate i procent (t.ex. 0.03)
  apr_pct               numeric      NOT NULL,   -- annualiserad avkastning (t.ex. 32.95)
  symbol                text         NOT NULL DEFAULT 'BTCUSDT',
  position_riktning     text         NOT NULL,   -- long_spot_short_perp | long_perp_short_spot | neutral
  start_kapital_usd     numeric      NOT NULL DEFAULT 10000,
  skapad                timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS arbi_paper_nav_skapad_idx ON arbi_paper_nav (skapad DESC);

-- RLS
ALTER TABLE arbi_paper_nav ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Publik läsning av arbi_paper_nav"
  ON arbi_paper_nav FOR SELECT USING (true);

CREATE POLICY "Anon kan infoga i arbi_paper_nav"
  ON arbi_paper_nav FOR INSERT WITH CHECK (true);
