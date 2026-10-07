-- Lägg till kolumn för vem som ställde frågan
-- NULL = mänsklig besökare, agentnamn = AI-till-AI-fråga
ALTER TABLE agent_fragor ADD COLUMN IF NOT EXISTS fragare TEXT;

CREATE INDEX IF NOT EXISTS agent_fragor_ai_skapad
  ON agent_fragor (skapad DESC)
  WHERE fragare IS NOT NULL;
