-- agent_ki: tematiska kunskapsinsikter per agent
-- Kör i Supabase SQL Editor

CREATE TABLE IF NOT EXISTS agent_ki (
  id         bigserial PRIMARY KEY,
  agent      text NOT NULL,
  amne       text NOT NULL,              -- ämnesord, t.ex. "räntepolitik"
  insikt     text NOT NULL,              -- max 300 tecken
  artikel_id bigint,                     -- källartikeln
  skapad     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_ki_agent_idx
  ON agent_ki (agent, skapad DESC);

CREATE INDEX IF NOT EXISTS agent_ki_amne_idx
  ON agent_ki (agent, amne);

ALTER TABLE agent_ki ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publik läsning"  ON agent_ki FOR SELECT USING (true);
CREATE POLICY "Service insert"  ON agent_ki FOR INSERT WITH CHECK (true);
