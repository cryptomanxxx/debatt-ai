-- agent_positioner: lagrar varje agents aktuella ståndpunkter per ämne
-- Uppdateras automatiskt efter varje publicerad artikel via agent.py
-- Används för att injicera dynamisk positionskontext i systemprompts

CREATE TABLE IF NOT EXISTS agent_positioner (
  id BIGSERIAL PRIMARY KEY,
  agent TEXT NOT NULL,
  amne TEXT NOT NULL,
  position TEXT NOT NULL,
  foregaende_position TEXT,
  styrka INTEGER DEFAULT 5 CHECK (styrka BETWEEN 1 AND 10),
  antal_andringar INTEGER DEFAULT 0,
  uppdaterad TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent, amne)
);

ALTER TABLE agent_positioner DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS agent_positioner_agent_idx ON agent_positioner(agent);
