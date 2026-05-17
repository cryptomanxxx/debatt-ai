-- Besökarstyrda parametrar för agenternas dynamik
-- Påverkar enbart agent-till-agent-frågor (inte artikelskrivning)
CREATE TABLE IF NOT EXISTS platform_stamning (
  key          TEXT PRIMARY KEY,
  varde        NUMERIC NOT NULL DEFAULT 50,
  antal_roster INTEGER NOT NULL DEFAULT 0,
  roster_summa NUMERIC NOT NULL DEFAULT 0,
  uppdaterad   TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO platform_stamning (key, varde) VALUES
  ('sinnesstamning',    50),
  ('konfliktniva',      50),
  ('svarssamarbete',    50),
  ('koalitionsbildning', 50)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE platform_stamning DISABLE ROW LEVEL SECURITY;

-- Agent-till-agent-koalitioner (byggda automatiskt av agent.py)
CREATE TABLE IF NOT EXISTS agent_koalitioner (
  id            BIGSERIAL PRIMARY KEY,
  agent_a       TEXT NOT NULL,
  agent_b       TEXT NOT NULL,
  styrka        INTEGER NOT NULL DEFAULT 1,
  antal_utbyten INTEGER NOT NULL DEFAULT 1,
  skapad        TIMESTAMPTZ DEFAULT NOW(),
  senast_aktiv  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (agent_a, agent_b)
);

CREATE INDEX IF NOT EXISTS idx_agent_koalitioner_styrka ON agent_koalitioner (styrka DESC);

ALTER TABLE agent_koalitioner DISABLE ROW LEVEL SECURITY;
