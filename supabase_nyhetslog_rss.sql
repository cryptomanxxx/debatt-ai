-- Lägg till rss_resultat-kolumn i nyhetslog
-- Kör detta i Supabase SQL Editor

ALTER TABLE nyhetslog
  ADD COLUMN IF NOT EXISTS rss_resultat jsonb DEFAULT '[]'::jsonb;
