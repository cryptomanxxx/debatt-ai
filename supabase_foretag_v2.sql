-- supabase_foretag_v2.sql
-- Migrering: utökar sektor-CHECK med advokatbyra och lobbybolag
-- Kör i Supabase SQL Editor

-- Uppdatera CHECK-constrainten på foretag.sektor
ALTER TABLE foretag
  DROP CONSTRAINT IF EXISTS foretag_sektor_check;

ALTER TABLE foretag
  ADD CONSTRAINT foretag_sektor_check
  CHECK (sektor IN ('media', 'handel', 'konsult', 'investering', 'advokatbyra', 'lobbybolag'));
