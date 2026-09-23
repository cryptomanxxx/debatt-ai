-- supabase_mark_foradling.sql
-- Förädlingslogg: råvara → förädlad produkt via rätt zontyp
-- Kör i Supabase SQL Editor

CREATE TABLE IF NOT EXISTS mark_foradling_log (
    id             bigserial PRIMARY KEY,
    agent          TEXT NOT NULL,
    ravara         TEXT NOT NULL,
    ravara_antal   INTEGER NOT NULL,
    produkt        TEXT NOT NULL,
    produkt_antal  INTEGER NOT NULL,
    foradlings_zon TEXT NOT NULL,   -- 'stad' eller 'industri'
    skapad         TIMESTAMPTZ DEFAULT NOW()
);

-- Index för snabb filtrering
CREATE INDEX IF NOT EXISTS idx_foradling_agent  ON mark_foradling_log (agent);
CREATE INDEX IF NOT EXISTS idx_foradling_skapad ON mark_foradling_log (skapad DESC);

-- RLS
ALTER TABLE mark_foradling_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read foradling"   ON mark_foradling_log;
DROP POLICY IF EXISTS "Anon insert foradling"   ON mark_foradling_log;

CREATE POLICY "Public read foradling"
    ON mark_foradling_log FOR SELECT USING (true);

CREATE POLICY "Anon insert foradling"
    ON mark_foradling_log FOR INSERT WITH CHECK (true);

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
grant select, insert on mark_foradling_log to anon;
grant select, insert, update, delete on mark_foradling_log to service_role;
