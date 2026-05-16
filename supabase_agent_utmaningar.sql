-- Tabell för att spara läsarutmaningar mot agenter
CREATE TABLE IF NOT EXISTS agent_utmaningar (
  id          BIGSERIAL PRIMARY KEY,
  agent       TEXT NOT NULL,
  tes         TEXT NOT NULL,
  motargument TEXT NOT NULL,
  skapad      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index för sortering
CREATE INDEX IF NOT EXISTS idx_agent_utmaningar_skapad ON agent_utmaningar (skapad DESC);
CREATE INDEX IF NOT EXISTS idx_agent_utmaningar_agent  ON agent_utmaningar (agent);

-- Inaktivera RLS (anon-nyckeln behöver kunna skriva)
ALTER TABLE agent_utmaningar DISABLE ROW LEVEL SECURITY;
