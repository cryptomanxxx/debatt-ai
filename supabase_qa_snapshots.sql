-- qa_snapshots: veckovis QA-historik för visuell jämförelse
-- Kör i Supabase SQL Editor

CREATE TABLE IF NOT EXISTS qa_snapshots (
  id                 bigserial PRIMARY KEY,
  vecka              text NOT NULL,           -- ISO-vecka t.ex. "2026-W21"
  sida_path          text NOT NULL,           -- t.ex. "/bors"
  sida_namn          text NOT NULL,
  status             text NOT NULL CHECK (status IN ('OK', 'VARNING', 'FEL')),
  orsak              text,
  detalj             text,
  konsol_fel_antal   int DEFAULT 0,
  konsol_fel_exempel text[],                  -- upp till 3 felmeddelanden
  skapad             timestamptz DEFAULT now()
);

-- En rad per vecka+sida — upsert skriver över om QA körs om samma vecka
CREATE UNIQUE INDEX IF NOT EXISTS qa_snapshots_vecka_sida
  ON qa_snapshots (vecka, sida_path);

CREATE INDEX IF NOT EXISTS qa_snapshots_vecka_idx ON qa_snapshots (vecka DESC);
CREATE INDEX IF NOT EXISTS qa_snapshots_status_idx ON qa_snapshots (status, vecka DESC);

ALTER TABLE qa_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publik läsning" ON qa_snapshots FOR SELECT USING (true);
CREATE POLICY "Service insert" ON qa_snapshots FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update" ON qa_snapshots FOR UPDATE USING (true);
