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

-- Data API-grants (Supabase-krav från 30 okt 2026 — se CLAUDE.md): nya
-- tabeller i public-schemat behöver explicita GRANT-satser för att vara
-- nåbara via Data API (PostgREST/supabase-js) efter det datumet, annars
-- "permission denied" trots korrekta RLS-policies — Supabase slutar
-- auto-bevilja grundrättigheter på nya tabeller från och med då. GRANT
-- och RLS är två separata lager: GRANT avgör om ett anrop överhuvudtaget
-- tillåts nå tabellen, RLS-policies avgör sedan vilka RADER som är
-- synliga/skrivbara. anon beviljas här exakt de operationer som
-- tabellens egna RLS-policies redan tillåter (ingen ändring av
-- säkerhetsmodellen — bara att göra det GRANT auto-gav tidigare
-- explicit) — service_role beviljas alltid full CRUD, eftersom BYPASSRLS
-- bara kringgår radpolicies, inte detta grundläggande GRANT-lager.
-- Ingen grant till authenticated: plattformen har ingen Supabase Auth /
-- inloggade användare, så rollen är aldrig i bruk här.
grant select on vetenskapliga_upptagter to anon;
grant select, insert, update, delete on vetenskapliga_upptagter to service_role;
