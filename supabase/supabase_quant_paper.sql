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
grant select, insert, update on quant_paper_innehav to anon;
grant select, insert, update, delete on quant_paper_innehav to service_role;
grant select, insert on quant_paper_nav to anon;
grant select, insert, update, delete on quant_paper_nav to service_role;
