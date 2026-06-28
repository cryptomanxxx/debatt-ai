-- civilisation_log: logg över anrop till /api/civilisation
-- v2: lägger till svar-kolumn och publik läsningspolicy för /hjarnans-logg-sidan
CREATE TABLE IF NOT EXISTS civilisation_log (
  id          bigserial PRIMARY KEY,
  fraga       text        NOT NULL,
  svar        text,
  endpoint    text,
  datapunkter integer     DEFAULT 0,
  provider    text,
  model       text,
  latency_ms  integer,
  lang        text        DEFAULT 'sv',
  kalltyp     text        DEFAULT 'besökare',
  skapad      timestamptz DEFAULT now()
);

-- Migrering: lägg till svar om tabellen redan finns utan den kolumnen
ALTER TABLE civilisation_log ADD COLUMN IF NOT EXISTS svar text;

CREATE INDEX IF NOT EXISTS civilisation_log_skapad_idx  ON civilisation_log (skapad DESC);
CREATE INDEX IF NOT EXISTS civilisation_log_kalltyp_idx ON civilisation_log (kalltyp);

ALTER TABLE civilisation_log ENABLE ROW LEVEL SECURITY;

-- Publik läsning — frågorna och svaren visas öppet på /hjarnans-logg
DROP POLICY IF EXISTS "Service read civilisation_log" ON civilisation_log;
CREATE POLICY "Publik läsning civilisation_log"
  ON civilisation_log FOR SELECT
  USING (true);

-- Skrivning kräver service role key — anon-nyckeln är publik och får aldrig skriva
DROP POLICY IF EXISTS "Service insert civilisation_log" ON civilisation_log;
DROP POLICY IF EXISTS "Insert civilisation_log" ON civilisation_log;
CREATE POLICY "Service role insert civilisation_log"
  ON civilisation_log FOR INSERT
  TO service_role
  WITH CHECK (true);
