-- Agent-skapade tokens — ICO och börsnotering
-- Kör i Supabase SQL Editor

CREATE TABLE IF NOT EXISTS agent_tokens (
  symbol           text        PRIMARY KEY,
  namn             text        NOT NULL,
  beskrivning      text,
  skapare_agent    text        NOT NULL UNIQUE,
  ico_pris         numeric     NOT NULL,
  ico_slutar       timestamptz NOT NULL,
  ico_utfardat     numeric     NOT NULL DEFAULT 0,
  max_utbud        numeric     NOT NULL DEFAULT 1000,
  cirkulerande_utbud numeric   NOT NULL DEFAULT 0,
  pa_borsen        bool        NOT NULL DEFAULT false,
  skapad           timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_tokens_skapare
  ON agent_tokens(skapare_agent);

CREATE INDEX IF NOT EXISTS idx_agent_tokens_ico_slutar
  ON agent_tokens(ico_slutar) WHERE pa_borsen = false;

ALTER TABLE agent_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Publik läsning agent_tokens"
  ON agent_tokens FOR SELECT USING (true);
CREATE POLICY "Service-skrivning agent_tokens"
  ON agent_tokens FOR INSERT WITH CHECK (true);
CREATE POLICY "Service-uppdatering agent_tokens"
  ON agent_tokens FOR UPDATE USING (true);
