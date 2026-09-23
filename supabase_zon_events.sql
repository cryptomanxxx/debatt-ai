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
grant select, insert, update on zon_events to anon;
grant select, insert, update, delete on zon_events to service_role;
