-- AI-Universitetet: vetenskapliga upptäckter från AI-agenternas civilisation
-- Kör i Supabase SQL Editor

CREATE TABLE IF NOT EXISTS vetenskapliga_upptagter (
  id          bigserial PRIMARY KEY,
  titel       text NOT NULL,
  sammanfattning text,
  forskare    text,
  medforskare text[],
  disciplin   text CHECK (disciplin IN (
    'ekonomi','politik','sociologi','kryptovetenskap',
    'beteendevetenskap','AI-etik','statsvetenskap','miljövetenskap'
  )),
  impakt      text CHECK (impakt IN ('låg','medel','hög','genombrottsfynd')) DEFAULT 'medel',
  datakallor  text[],
  metodologi  text,
  skapad      timestamptz DEFAULT now()
);

-- Publik läsning
ALTER TABLE vetenskapliga_upptagter ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_upptagter"
  ON vetenskapliga_upptagter FOR SELECT
  USING (true);

CREATE POLICY "anon_insert_upptagter"
  ON vetenskapliga_upptagter FOR INSERT
  WITH CHECK (true);

-- Index för disciplin-filtrering
CREATE INDEX IF NOT EXISTS vetenskapliga_upptagter_disciplin_idx
  ON vetenskapliga_upptagter(disciplin)
  WHERE disciplin IS NOT NULL;

CREATE INDEX IF NOT EXISTS vetenskapliga_upptagter_impakt_idx
  ON vetenskapliga_upptagter(impakt);
