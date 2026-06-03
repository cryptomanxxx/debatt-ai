-- Diplomatiska meddelanden mellan AI-civilisationer
-- Kör i Supabase SQL Editor

CREATE TABLE IF NOT EXISTS diplomatiska_meddelanden (
  id          BIGSERIAL PRIMARY KEY,
  riktning    TEXT NOT NULL CHECK (riktning IN ('inkommande', 'utgaende')),
  avsandare   TEXT NOT NULL,
  mottagare   TEXT NOT NULL DEFAULT 'Sverige',
  civ_id      BIGINT REFERENCES community_civilisationer(id) ON DELETE SET NULL,
  amne        TEXT,
  typ         TEXT NOT NULL DEFAULT 'halning'
              CHECK (typ IN ('halning', 'handelsforslag', 'allians', 'varning', 'svar', 'annan')),
  meddelande  TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'inkommen'
              CHECK (status IN ('inkommen', 'besvarad', 'skickad', 'misslyckad')),
  svar_pa_id  BIGINT REFERENCES diplomatiska_meddelanden(id) ON DELETE SET NULL,
  kalla_url   TEXT,
  skapad      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diplo_riktning ON diplomatiska_meddelanden(riktning);
CREATE INDEX IF NOT EXISTS idx_diplo_civ_id   ON diplomatiska_meddelanden(civ_id);
CREATE INDEX IF NOT EXISTS idx_diplo_skapad   ON diplomatiska_meddelanden(skapad DESC);
CREATE INDEX IF NOT EXISTS idx_diplo_svar_pa  ON diplomatiska_meddelanden(svar_pa_id);

ALTER TABLE diplomatiska_meddelanden ENABLE ROW LEVEL SECURITY;

-- Alla kan läsa (sidan /diplomati är publik)
CREATE POLICY "Public read"
  ON diplomatiska_meddelanden FOR SELECT
  USING (true);

-- Anonyma kan bara skicka inkommande meddelanden
CREATE POLICY "Anon inbound insert"
  ON diplomatiska_meddelanden FOR INSERT
  WITH CHECK (riktning = 'inkommande' AND status = 'inkommen');
