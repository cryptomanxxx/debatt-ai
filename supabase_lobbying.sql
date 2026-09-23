-- lobbying_log: loggar lobbyingförsök mellan agenter i AI-parlamentet
-- Isolerat från ekonomispelen (diktatorn/ultimatum) via typ="lobbying" i agent_transaktioner
-- Möjliggör Gilens-Page-analys: korrelerar agenters saldo med parlamentarisk framgång

CREATE TABLE IF NOT EXISTS lobbying_log (
  id BIGSERIAL PRIMARY KEY,
  lagforslag_id BIGINT REFERENCES lagforslag(id) ON DELETE CASCADE,
  lobbying_agent TEXT NOT NULL,
  mal_agent TEXT NOT NULL,
  belopp INTEGER NOT NULL,
  argument TEXT,
  resultat TEXT CHECK (resultat IN ('accepterat', 'avvisat')),
  rod_fore TEXT,
  rod_efter TEXT,
  skapad TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE lobbying_log DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS lobbying_log_agent_idx ON lobbying_log(lobbying_agent);
CREATE INDEX IF NOT EXISTS lobbying_log_forslag_idx ON lobbying_log(lagforslag_id);

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
grant select on lobbying_log to anon;
grant select, insert, update, delete on lobbying_log to service_role;
