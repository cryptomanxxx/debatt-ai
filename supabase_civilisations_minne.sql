CREATE TABLE IF NOT EXISTS civilisations_minne (
  id BIGSERIAL PRIMARY KEY,
  typ TEXT NOT NULL,  -- 'koalition_bildad', 'förräderi', 'triumf', 'skandal', 'allians_bruten', 'marknadsseger', 'marknadskrasch', 'symbolkup'
  rubrik TEXT NOT NULL,
  beskrivning TEXT NOT NULL,
  agenter TEXT[] DEFAULT '{}',
  relaterat_id BIGINT,
  relaterat_typ TEXT,
  skapad TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_civilisations_minne_skapad ON civilisations_minne(skapad DESC);
CREATE INDEX IF NOT EXISTS idx_civilisations_minne_agenter ON civilisations_minne USING GIN(agenter);

ALTER TABLE civilisations_minne ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON civilisations_minne FOR SELECT USING (true);
CREATE POLICY "Service write" ON civilisations_minne FOR INSERT WITH CHECK (true);
