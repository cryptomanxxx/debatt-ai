-- Lägger till skapare-kolumn på lagforslag-tabellen
-- Möjliggör per-agent-kopplade AI-motioner i Civilisationens hjärna
-- Kör i Supabase SQL Editor

ALTER TABLE lagforslag ADD COLUMN IF NOT EXISTS skapare TEXT;

CREATE INDEX IF NOT EXISTS lagforslag_skapare_idx
  ON lagforslag(skapare)
  WHERE skapare IS NOT NULL;
