CREATE TABLE IF NOT EXISTS labb_log (
  id             BIGSERIAL PRIMARY KEY,
  amne           TEXT NOT NULL,
  aggressivitet  INTEGER NOT NULL,
  faktafokus     INTEGER NOT NULL,
  humor          INTEGER NOT NULL,
  optimism       INTEGER NOT NULL,
  provider       TEXT,
  skapad         TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_labb_log_skapad ON labb_log (skapad DESC);

ALTER TABLE labb_log DISABLE ROW LEVEL SECURITY;

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
grant select on labb_log to anon;
grant select, insert, update, delete on labb_log to service_role;
