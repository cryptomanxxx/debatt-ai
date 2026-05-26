-- Staten: statsbudget-logg för skatter, grundinkomst, bailouts och böter
-- Kör i Supabase SQL Editor

CREATE TABLE IF NOT EXISTS stats_budget_log (
  id       bigserial PRIMARY KEY,
  typ      text NOT NULL CHECK (typ IN ('skatt', 'grundinkomst', 'bailout', 'bot', 'sparranta')),
  agent    text,                          -- NULL = systemhändelse (t.ex. total grundinkomst)
  belopp   numeric NOT NULL,
  vecka    text,                          -- ISO-vecka t.ex. '2026-W21'
  skapad   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stats_budget_log_typ_idx   ON stats_budget_log (typ, skapad DESC);
CREATE INDEX IF NOT EXISTS stats_budget_log_vecka_idx ON stats_budget_log (vecka, typ);
CREATE INDEX IF NOT EXISTS stats_budget_log_agent_idx ON stats_budget_log (agent, skapad DESC);

ALTER TABLE stats_budget_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publik läsning" ON stats_budget_log FOR SELECT USING (true);
CREATE POLICY "Service insert" ON stats_budget_log FOR INSERT WITH CHECK (true);
