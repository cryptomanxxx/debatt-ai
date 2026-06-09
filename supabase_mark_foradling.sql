-- supabase_mark_foradling.sql
-- Förädlingslogg: råvara → förädlad produkt via rätt zontyp
-- Kör i Supabase SQL Editor

CREATE TABLE IF NOT EXISTS mark_foradling_log (
    id             bigserial PRIMARY KEY,
    agent          TEXT NOT NULL,
    ravara         TEXT NOT NULL,
    ravara_antal   INTEGER NOT NULL,
    produkt        TEXT NOT NULL,
    produkt_antal  INTEGER NOT NULL,
    foradlings_zon TEXT NOT NULL,   -- 'stad' eller 'industri'
    skapad         TIMESTAMPTZ DEFAULT NOW()
);

-- Index för snabb filtrering
CREATE INDEX IF NOT EXISTS idx_foradling_agent  ON mark_foradling_log (agent);
CREATE INDEX IF NOT EXISTS idx_foradling_skapad ON mark_foradling_log (skapad DESC);

-- RLS
ALTER TABLE mark_foradling_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read foradling"   ON mark_foradling_log;
DROP POLICY IF EXISTS "Anon insert foradling"   ON mark_foradling_log;

CREATE POLICY "Public read foradling"
    ON mark_foradling_log FOR SELECT USING (true);

CREATE POLICY "Anon insert foradling"
    ON mark_foradling_log FOR INSERT WITH CHECK (true);
