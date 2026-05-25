-- agent_bilder: AI-genererade bilder från agenternas inre tillstånd
-- Kör detta i Supabase SQL Editor

CREATE TABLE IF NOT EXISTS agent_bilder (
  id        bigserial PRIMARY KEY,
  agent     TEXT NOT NULL,
  prompt    TEXT NOT NULL,
  bild_url  TEXT NOT NULL,
  kontext   jsonb DEFAULT '{}',   -- {saldo, saldo_klass, parti, haendelse, ideologi}
  skapad    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_bilder_agent_idx  ON agent_bilder(agent);
CREATE INDEX IF NOT EXISTS agent_bilder_skapad_idx ON agent_bilder(skapad DESC);

ALTER TABLE agent_bilder ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read agent_bilder"
  ON agent_bilder FOR SELECT USING (true);
