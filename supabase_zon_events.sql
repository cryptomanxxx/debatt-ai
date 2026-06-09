-- supabase_zon_events.sql
-- Slumpmässiga zonevent: torka, gruvras, cyberattack
-- Kör i Supabase SQL Editor

CREATE TABLE IF NOT EXISTS zon_events (
    id                  bigserial PRIMARY KEY,
    zon_id              INTEGER NOT NULL,
    zon_namn            TEXT NOT NULL,
    agare               TEXT,
    event_typ           TEXT NOT NULL,           -- 'torka', 'gruvras', 'cyberattack'
    zontyp              TEXT NOT NULL,           -- 'jordbruk', 'gruva', 'industri'
    produktion_effekt   FLOAT NOT NULL DEFAULT 0, -- 0.5 = halverad, 0.0 = pausad
    aktiv               BOOLEAN NOT NULL DEFAULT TRUE,
    slutar              TIMESTAMPTZ NOT NULL,
    beskrivning         TEXT,
    skapad              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zon_events_aktiv  ON zon_events (aktiv) WHERE aktiv = TRUE;
CREATE INDEX IF NOT EXISTS idx_zon_events_zon_id ON zon_events (zon_id);
CREATE INDEX IF NOT EXISTS idx_zon_events_skapad ON zon_events (skapad DESC);

ALTER TABLE zon_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read zon_events"  ON zon_events;
DROP POLICY IF EXISTS "Anon insert zon_events"  ON zon_events;
DROP POLICY IF EXISTS "Anon update zon_events"  ON zon_events;

CREATE POLICY "Public read zon_events"
    ON zon_events FOR SELECT USING (true);

CREATE POLICY "Anon insert zon_events"
    ON zon_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Anon update zon_events"
    ON zon_events FOR UPDATE USING (true);
