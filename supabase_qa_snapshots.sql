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
grant select, insert, update on qa_snapshots to anon;
grant select, insert, update, delete on qa_snapshots to service_role;
