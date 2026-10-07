-- qa_snapshots_v3: skärmdumpar flyttas från Postgres till Supabase Storage.
-- Kör i Supabase SQL Editor INNAN koden driftsätts (annars hittar
-- /qa-tidslinje inte kolumnen och visar inga bilder).
--
-- agents/qa-observer.js sparar från och med nu skärmdumpar bara för sidorna
-- på /qa-tidslinje, som JPEG i Storage-bucketen qa-screenshots (skapas
-- automatiskt av skriptet), och raden får bara bildens URL här.
-- screenshot_b64 skrivs inte längre men befintlig data rörs inte — se
-- supabase_qa_snapshots_cleanup_MANUELL.sql för den separata rensningen.

ALTER TABLE qa_snapshots
  ADD COLUMN IF NOT EXISTS screenshot_url text;
