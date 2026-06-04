-- Evolutionär Systemprompt (ESP) — agent_strategi-tabellen
-- Varje agent har en evolverande strategitext som uppdateras baserat på utfall.
-- Injiceras i systempromten som ett extra lager ovanpå den statiska personligheten.

CREATE TABLE IF NOT EXISTS agent_strategi (
  agent        TEXT PRIMARY KEY,
  strategi_text TEXT NOT NULL DEFAULT '',
  generation   INTEGER NOT NULL DEFAULT 0,
  uppdaterad   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Publik läsning (anon-nyckeln räcker)
ALTER TABLE agent_strategi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Publik läsning agent_strategi"
  ON agent_strategi FOR SELECT
  USING (true);

CREATE POLICY "Anon insert/update agent_strategi"
  ON agent_strategi FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anon update agent_strategi"
  ON agent_strategi FOR UPDATE
  USING (true);
