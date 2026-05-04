-- Besökaromröstningar på förprogrammerade debattfrågor
CREATE TABLE IF NOT EXISTS opinion_roster (
  id          bigserial PRIMARY KEY,
  fraga       text UNIQUE NOT NULL,
  kategori    text NOT NULL,
  roster_ja   int DEFAULT 0,
  roster_nej  int DEFAULT 0,
  skapad      timestamptz DEFAULT now()
);

-- RLS-policys: anonyma besökare får läsa och skriva (upsert)
ALTER TABLE opinion_roster ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon kan läsa" ON opinion_roster
  FOR SELECT USING (true);

CREATE POLICY "Anon kan infoga" ON opinion_roster
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anon kan uppdatera" ON opinion_roster
  FOR UPDATE USING (true);

-- Ny kolumn för "Osäker"-alternativet
ALTER TABLE opinion_roster ADD COLUMN IF NOT EXISTS roster_osaker int DEFAULT 0;

-- Fix: anonyma besökare ska kunna läsa kommentarer (för Senaste kommentarerna på framsidan)
ALTER TABLE kommentarer ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon kan läsa kommentarer" ON kommentarer
  FOR SELECT USING (true);
