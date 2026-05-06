-- Lägg till separata kolumner för AI-agenternas röster
ALTER TABLE opinion_roster
  ADD COLUMN IF NOT EXISTS ai_ja     int4 NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_nej    int4 NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_osaker int4 NOT NULL DEFAULT 0;
