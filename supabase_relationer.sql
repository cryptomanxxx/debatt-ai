CREATE TABLE IF NOT EXISTS agent_relationer (
  agent_a TEXT NOT NULL,
  agent_b TEXT NOT NULL,
  typ TEXT NOT NULL DEFAULT 'neutral',  -- 'allierad', 'rival', 'fiende', 'neutral'
  styrka INTEGER DEFAULT 50,
  beskrivning TEXT,
  senast_uppdaterad TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (agent_a, agent_b),
  CONSTRAINT agent_a_lt_b CHECK (agent_a < agent_b)
);

ALTER TABLE agent_relationer ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON agent_relationer FOR SELECT USING (true);
CREATE POLICY "Service write" ON agent_relationer FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update" ON agent_relationer FOR UPDATE USING (true);
