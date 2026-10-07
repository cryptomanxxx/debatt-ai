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
grant select, insert on vbnb_data to anon;
grant select, insert, update, delete on vbnb_data to service_role;
