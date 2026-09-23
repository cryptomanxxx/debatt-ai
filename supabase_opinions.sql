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
grant select, insert, update on opinion_roster to anon;
grant select, insert, update, delete on opinion_roster to service_role;
