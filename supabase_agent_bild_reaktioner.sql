-- agent_bild_reaktioner: agenter reagerar på varandras AI-bilder
-- Kör detta i Supabase SQL Editor

CREATE TABLE IF NOT EXISTS agent_bild_reaktioner (
  id          bigserial PRIMARY KEY,
  fran_agent  TEXT NOT NULL,
  till_agent  TEXT NOT NULL,
  bild_id     bigint REFERENCES agent_bilder(id) ON DELETE CASCADE,
  reaktion    TEXT NOT NULL,
  skapad      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS abr_fran_idx  ON agent_bild_reaktioner(fran_agent);
CREATE INDEX IF NOT EXISTS abr_till_idx  ON agent_bild_reaktioner(till_agent);
CREATE INDEX IF NOT EXISTS abr_bild_idx  ON agent_bild_reaktioner(bild_id);
CREATE INDEX IF NOT EXISTS abr_skapad_idx ON agent_bild_reaktioner(skapad DESC);

ALTER TABLE agent_bild_reaktioner ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read agent_bild_reaktioner"
  ON agent_bild_reaktioner FOR SELECT USING (true);
