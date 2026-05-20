CREATE TABLE IF NOT EXISTS politiska_partier (
  id BIGSERIAL PRIMARY KEY,
  namn TEXT NOT NULL,
  beskrivning TEXT,
  medlemmar TEXT[] NOT NULL,
  ledare TEXT NOT NULL,
  platform JSONB DEFAULT '{}',
  styrka INTEGER DEFAULT 0,
  aktiv BOOLEAN DEFAULT TRUE,
  bildad TIMESTAMPTZ DEFAULT NOW(),
  senast_uppdaterad TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_politiska_partier_aktiv ON politiska_partier(aktiv);
CREATE INDEX IF NOT EXISTS idx_politiska_partier_medlemmar ON politiska_partier USING GIN(medlemmar);

ALTER TABLE politiska_partier ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read"   ON politiska_partier FOR SELECT USING (true);
CREATE POLICY "Service write" ON politiska_partier FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update" ON politiska_partier FOR UPDATE USING (true);
CREATE POLICY "Service delete" ON politiska_partier FOR DELETE USING (true);
