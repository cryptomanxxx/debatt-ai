CREATE TABLE IF NOT EXISTS labb_log (
  id             BIGSERIAL PRIMARY KEY,
  amne           TEXT NOT NULL,
  aggressivitet  INTEGER NOT NULL,
  faktafokus     INTEGER NOT NULL,
  humor          INTEGER NOT NULL,
  optimism       INTEGER NOT NULL,
  provider       TEXT,
  skapad         TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_labb_log_skapad ON labb_log (skapad DESC);

ALTER TABLE labb_log DISABLE ROW LEVEL SECURITY;
