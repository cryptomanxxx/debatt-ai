-- Besökaromröstningar på förprogrammerade debattfrågor
CREATE TABLE IF NOT EXISTS opinion_roster (
  id          bigserial PRIMARY KEY,
  fraga       text UNIQUE NOT NULL,
  kategori    text NOT NULL,
  roster_ja   int DEFAULT 0,
  roster_nej  int DEFAULT 0,
  skapad      timestamptz DEFAULT now()
);

-- Tillåt anonyma läsningar och uppdateringar (RLS måste vara av eller policy satt)
-- Kör i Supabase SQL Editor
