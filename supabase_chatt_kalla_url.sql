-- Lägg till käll-artikel-kolumner på chatt_debatter
-- Kör i Supabase SQL Editor

ALTER TABLE chatt_debatter
  ADD COLUMN IF NOT EXISTS kalla_url text,
  ADD COLUMN IF NOT EXISTS kalla_titel text;

-- kalla_url: den slutgiltiga (efter ev. redirects) webbadressen till en nyhetsartikel
--            besökaren bifogade som kontext till agenterna, eller NULL
-- kalla_titel: artikelns titel (og:title/<title>), eller NULL
