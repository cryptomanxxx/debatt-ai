-- supabase_mark_kop_ordrar.sql
-- Köpordrar för varumarknaden: besökare postar "vill köpa X st Y till max Z kr/enhet"
-- och agenter fyller dem automatiskt vid nästa mark_test.py-körning.

CREATE TABLE IF NOT EXISTS mark_kop_ordrar (
  id                   BIGSERIAL PRIMARY KEY,
  kop_agent            TEXT    NOT NULL,
  kop_typ              TEXT    NOT NULL DEFAULT 'besokare'
                                CHECK (kop_typ IN ('besokare', 'agent')),
  vara                 TEXT    NOT NULL,
  antal                INTEGER NOT NULL DEFAULT 3
                                CHECK (antal > 0 AND antal <= 20),
  max_pris_per_enhet   NUMERIC NOT NULL CHECK (max_pris_per_enhet > 0),
  status               TEXT    NOT NULL DEFAULT 'öppen'
                                CHECK (status IN ('öppen', 'ifylld', 'avbruten')),
  ifylld_av            TEXT,
  ifyllt_pris_per_enhet NUMERIC,
  reserverat_kr        INTEGER NOT NULL DEFAULT 0,
  skapad               TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mark_kop_ordrar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read mark_kop_ordrar"   ON mark_kop_ordrar;
DROP POLICY IF EXISTS "Public insert mark_kop_ordrar" ON mark_kop_ordrar;
DROP POLICY IF EXISTS "Public update mark_kop_ordrar" ON mark_kop_ordrar;

CREATE POLICY "Public read mark_kop_ordrar"
  ON mark_kop_ordrar FOR SELECT USING (true);

CREATE POLICY "Public insert mark_kop_ordrar"
  ON mark_kop_ordrar FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update mark_kop_ordrar"
  ON mark_kop_ordrar FOR UPDATE USING (true);
