-- Utrikesdepartementet — relationer och deklarationer
-- Kör i Supabase SQL Editor

CREATE TABLE IF NOT EXISTS ud_relationer (
  id            BIGSERIAL PRIMARY KEY,
  civ_id        BIGINT NOT NULL REFERENCES community_civilisationer(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'neutral'
                CHECK (status IN ('neutral', 'vänlig', 'spänd', 'fientlig')),
  antal_utbyten INT NOT NULL DEFAULT 0,
  senaste_kontakt TIMESTAMPTZ,
  uppdaterad    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(civ_id)
);

CREATE TABLE IF NOT EXISTS ud_deklarationer (
  id        BIGSERIAL PRIMARY KEY,
  minister  TEXT NOT NULL,
  rubrik    TEXT NOT NULL,
  innehall  TEXT NOT NULL,
  civ_id    BIGINT REFERENCES community_civilisationer(id) ON DELETE SET NULL,
  skapad    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ud_rel_civ   ON ud_relationer(civ_id);
CREATE INDEX IF NOT EXISTS idx_ud_dekl_skapad ON ud_deklarationer(skapad DESC);

ALTER TABLE ud_relationer  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ud_deklarationer ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON ud_relationer    FOR SELECT USING (true);
CREATE POLICY "Public read" ON ud_deklarationer FOR SELECT USING (true);
