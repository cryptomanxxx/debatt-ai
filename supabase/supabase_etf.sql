-- ETF-innehav per agent
-- Kör i Supabase SQL Editor

CREATE TABLE IF NOT EXISTS agent_etf_innehav (
  id              bigserial PRIMARY KEY,
  agent           TEXT      NOT NULL,
  symbol          TEXT      NOT NULL,          -- 'BTC', 'ETH', 'SOL', 'XRP', 'BNB'
  investerat_kr   NUMERIC(12,2) NOT NULL DEFAULT 0,   -- ursprunglig kostnad i kr
  kopt_pris_usd   NUMERIC(16,4) NOT NULL,             -- viktat genomsnittspris (USD) vid köp
  skapad          TIMESTAMPTZ DEFAULT now(),
  uppdaterad      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agent, symbol)
);

-- Transaktionslogg
CREATE TABLE IF NOT EXISTS etf_transaktioner (
  id          bigserial PRIMARY KEY,
  agent       TEXT      NOT NULL,
  symbol      TEXT      NOT NULL,
  typ         TEXT      NOT NULL CHECK (typ IN ('kop', 'salj')),
  belopp_kr   NUMERIC(12,2) NOT NULL,   -- kr-belopp (kostnad vid köp, intäkt vid sälj)
  pris_usd    NUMERIC(16,4) NOT NULL,   -- USD-pris vid transaktionstillfället
  skapad      TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE agent_etf_innehav  ENABLE ROW LEVEL SECURITY;
ALTER TABLE etf_transaktioner  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read etf innehav"  ON agent_etf_innehav  FOR SELECT USING (true);
CREATE POLICY "public insert etf innehav" ON agent_etf_innehav FOR INSERT WITH CHECK (true);
CREATE POLICY "public update etf innehav" ON agent_etf_innehav FOR UPDATE USING (true);
CREATE POLICY "public delete etf innehav" ON agent_etf_innehav FOR DELETE USING (true);

CREATE POLICY "public read etf trans"    ON etf_transaktioner  FOR SELECT USING (true);
CREATE POLICY "public insert etf trans"  ON etf_transaktioner  FOR INSERT WITH CHECK (true);

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
grant select, insert, update, delete on agent_etf_innehav to anon;
grant select, insert, update, delete on agent_etf_innehav to service_role;
grant select, insert on etf_transaktioner to anon;
grant select, insert, update, delete on etf_transaktioner to service_role;
