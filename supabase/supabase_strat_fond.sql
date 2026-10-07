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
grant select, insert, update on strat_paper_innehav to anon;
grant select, insert, update, delete on strat_paper_innehav to service_role;
grant select, insert on strat_paper_nav to anon;
grant select, insert, update, delete on strat_paper_nav to service_role;
