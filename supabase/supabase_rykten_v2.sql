-- Ryktesspridning v2 — förbättringar
-- Kör detta i Supabase SQL Editor

-- 1. Spridningskanal på rykte_spridningar
ALTER TABLE rykte_spridningar
  ADD COLUMN IF NOT EXISTS kanal TEXT DEFAULT 'slumpmässig';

-- 2. Mutationskedja på rykten
ALTER TABLE rykten
  ADD COLUMN IF NOT EXISTS parent_rykte_id BIGINT REFERENCES rykten(id);

-- Index för effektiv mutationskedja-sökning
CREATE INDEX IF NOT EXISTS idx_rykten_parent ON rykten(parent_rykte_id)
  WHERE parent_rykte_id IS NOT NULL;
