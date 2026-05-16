-- Läsarröster på enskilda stycken i artiklar
CREATE TABLE IF NOT EXISTS argument_roster (
  id            BIGSERIAL PRIMARY KEY,
  artikel_id    BIGINT NOT NULL,
  stycke_index  INTEGER NOT NULL,
  stycke_text   TEXT NOT NULL,
  roster        INTEGER DEFAULT 1 NOT NULL,
  skapad        TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(artikel_id, stycke_index)
);

CREATE INDEX IF NOT EXISTS idx_argument_roster_artikel ON argument_roster (artikel_id);
CREATE INDEX IF NOT EXISTS idx_argument_roster_roster  ON argument_roster (roster DESC);

ALTER TABLE argument_roster DISABLE ROW LEVEL SECURITY;
