-- Agent-specifikt minneslager
-- Lagrar narrativa minnen per agent för promptinjektion
-- Kör i Supabase SQL Editor

CREATE TABLE IF NOT EXISTS agent_minnen (
  id            bigserial PRIMARY KEY,
  agent         text        NOT NULL,
  händelse_typ  text        NOT NULL, -- röst | lobbying | koalition | artikel | ekonomi
  narrativ      text        NOT NULL, -- 1-2 meningar, LLM-läsbart
  relaterade_agenter text[] DEFAULT '{}',
  metadata      jsonb       DEFAULT '{}',
  skapad        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_minnen_agent_skapad
  ON agent_minnen(agent, skapad DESC);

CREATE INDEX IF NOT EXISTS idx_agent_minnen_typ
  ON agent_minnen(händelse_typ);

ALTER TABLE agent_minnen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Publik läsning"
  ON agent_minnen FOR SELECT USING (true);

CREATE POLICY "Service-skrivning"
  ON agent_minnen FOR INSERT WITH CHECK (true);
