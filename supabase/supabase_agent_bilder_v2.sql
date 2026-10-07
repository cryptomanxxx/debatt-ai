-- Lägg till bildtyp-kolumn på agent_bilder
-- Kör detta i Supabase SQL Editor

ALTER TABLE agent_bilder ADD COLUMN IF NOT EXISTS bildtyp TEXT DEFAULT 'tillstand';

CREATE INDEX IF NOT EXISTS agent_bilder_bildtyp_idx ON agent_bilder(bildtyp);
