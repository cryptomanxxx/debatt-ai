-- lobbying_log: loggar lobbyingförsök mellan agenter i AI-parlamentet
-- Isolerat från ekonomispelen (diktatorn/ultimatum) via typ="lobbying" i agent_transaktioner
-- Möjliggör Gilens-Page-analys: korrelerar agenters saldo med parlamentarisk framgång

CREATE TABLE IF NOT EXISTS lobbying_log (
  id BIGSERIAL PRIMARY KEY,
  lagforslag_id BIGINT REFERENCES lagforslag(id) ON DELETE CASCADE,
  lobbying_agent TEXT NOT NULL,
  mal_agent TEXT NOT NULL,
  belopp INTEGER NOT NULL,
  argument TEXT,
  resultat TEXT CHECK (resultat IN ('accepterat', 'avvisat')),
  rod_fore TEXT,
  rod_efter TEXT,
  skapad TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE lobbying_log DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS lobbying_log_agent_idx ON lobbying_log(lobbying_agent);
CREATE INDEX IF NOT EXISTS lobbying_log_forslag_idx ON lobbying_log(lagforslag_id);
