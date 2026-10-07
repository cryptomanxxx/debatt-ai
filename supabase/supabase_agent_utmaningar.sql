-- Tabell för att spara läsarutmaningar mot agenter
CREATE TABLE IF NOT EXISTS agent_utmaningar (
  id          BIGSERIAL PRIMARY KEY,
  agent       TEXT NOT NULL,
  tes         TEXT NOT NULL,
  motargument TEXT NOT NULL,
  skapad      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index för sortering
CREATE INDEX IF NOT EXISTS idx_agent_utmaningar_skapad ON agent_utmaningar (skapad DESC);
CREATE INDEX IF NOT EXISTS idx_agent_utmaningar_agent  ON agent_utmaningar (agent);

-- Inaktivera RLS (anon-nyckeln behöver kunna skriva)
ALTER TABLE agent_utmaningar DISABLE ROW LEVEL SECURITY;

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
grant select on agent_utmaningar to anon;
grant select, insert, update, delete on agent_utmaningar to service_role;
