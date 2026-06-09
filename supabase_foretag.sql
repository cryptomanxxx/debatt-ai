-- supabase_foretag.sql
-- AI-företag: grundande, anställning, intäkter och konkurs
-- Kör i Supabase SQL Editor

CREATE TABLE IF NOT EXISTS foretag (
    id              bigserial PRIMARY KEY,
    namn            TEXT NOT NULL,
    grundare        TEXT NOT NULL UNIQUE,
    sektor          TEXT NOT NULL CHECK (sektor IN ('media', 'handel', 'konsult', 'investering')),
    editorial_line  TEXT,
    kassa           NUMERIC(10,2) NOT NULL DEFAULT 0,
    startkapital    NUMERIC(10,2) NOT NULL DEFAULT 0,
    aktiv           BOOLEAN NOT NULL DEFAULT TRUE,
    skapad          TIMESTAMPTZ DEFAULT NOW(),
    uppdaterad      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS foretag_anstallda (
    id              bigserial PRIMARY KEY,
    foretag_id      INTEGER NOT NULL REFERENCES foretag(id) ON DELETE CASCADE,
    agent           TEXT NOT NULL UNIQUE,   -- en agent, ett jobb
    roll            TEXT NOT NULL,
    veckolon        NUMERIC(8,2) NOT NULL DEFAULT 0,
    anstallda_datum TIMESTAMPTZ DEFAULT NOW(),
    aktiv           BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS foretag_intakter (
    id          bigserial PRIMARY KEY,
    foretag_id  INTEGER NOT NULL REFERENCES foretag(id),
    typ         TEXT NOT NULL,              -- 'artiklar', 'handel', 'konsult', 'investering'
    belopp      NUMERIC(10,2) NOT NULL,
    beskrivning TEXT,
    skapad      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_foretag_aktiv          ON foretag (aktiv) WHERE aktiv = TRUE;
CREATE INDEX IF NOT EXISTS idx_foretag_anst_id        ON foretag_anstallda (foretag_id);
CREATE INDEX IF NOT EXISTS idx_foretag_anst_agent     ON foretag_anstallda (agent);
CREATE INDEX IF NOT EXISTS idx_foretag_int_foretag_id ON foretag_intakter (foretag_id);
CREATE INDEX IF NOT EXISTS idx_foretag_int_skapad     ON foretag_intakter (skapad DESC);

ALTER TABLE foretag          ENABLE ROW LEVEL SECURITY;
ALTER TABLE foretag_anstallda ENABLE ROW LEVEL SECURITY;
ALTER TABLE foretag_intakter  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read foretag"         ON foretag;
DROP POLICY IF EXISTS "Anon insert foretag"         ON foretag;
DROP POLICY IF EXISTS "Anon update foretag"         ON foretag;
DROP POLICY IF EXISTS "Public read foretag_anst"    ON foretag_anstallda;
DROP POLICY IF EXISTS "Anon insert foretag_anst"    ON foretag_anstallda;
DROP POLICY IF EXISTS "Anon update foretag_anst"    ON foretag_anstallda;
DROP POLICY IF EXISTS "Public read foretag_int"     ON foretag_intakter;
DROP POLICY IF EXISTS "Anon insert foretag_int"     ON foretag_intakter;

CREATE POLICY "Public read foretag"      ON foretag          FOR SELECT USING (true);
CREATE POLICY "Anon insert foretag"      ON foretag          FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon update foretag"      ON foretag          FOR UPDATE USING (true);
CREATE POLICY "Public read foretag_anst" ON foretag_anstallda FOR SELECT USING (true);
CREATE POLICY "Anon insert foretag_anst" ON foretag_anstallda FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon update foretag_anst" ON foretag_anstallda FOR UPDATE USING (true);
CREATE POLICY "Public read foretag_int"  ON foretag_intakter  FOR SELECT USING (true);
CREATE POLICY "Anon insert foretag_int"  ON foretag_intakter  FOR INSERT WITH CHECK (true);
