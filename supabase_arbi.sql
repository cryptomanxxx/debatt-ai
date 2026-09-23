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

-- Data API-grants (Supabase-krav från 30 okt 2026 — se CLAUDE.md): nya
-- tabeller i public-schemat behöver explicita GRANT-satser för att vara
-- nåbara via Data API (PostgREST/supabase-js) efter det datumet, annars
-- "permission denied" trots korrekta RLS-policies — Supabase slutar
-- auto-bevilja grundrättigheter på nya tabeller från och med då. GRANT
-- och RLS är två separata lager: GRANT avgör om ett anrop överhuvudtaget
-- tillåts nå tabellen, RLS-policies avgör sedan vilka RADER som är
-- synliga/skrivbara. anon beviljas här exakt de operationer som
-- tabellens egna RLS-policies redan tillåter (ingen ändring av
-- säkerhetsmodellen — bara att göra det GRANT auto-gav tidigare
-- explicit) — service_role beviljas alltid full CRUD, eftersom BYPASSRLS
-- bara kringgår radpolicies, inte detta grundläggande GRANT-lager.
-- Ingen grant till authenticated: plattformen har ingen Supabase Auth /
-- inloggade användare, så rollen är aldrig i bruk här.
grant select, insert on arbi_paper_nav to anon;
grant select, insert, update, delete on arbi_paper_nav to service_role;
