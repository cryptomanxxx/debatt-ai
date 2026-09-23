-- agent_positioner: lagrar varje agents aktuella ståndpunkter per ämne
-- Uppdateras automatiskt efter varje publicerad artikel via agent.py
-- Används för att injicera dynamisk positionskontext i systemprompts

CREATE TABLE IF NOT EXISTS agent_positioner (
  id BIGSERIAL PRIMARY KEY,
  agent TEXT NOT NULL,
  amne TEXT NOT NULL,
  position TEXT NOT NULL,
  foregaende_position TEXT,
  styrka INTEGER DEFAULT 5 CHECK (styrka BETWEEN 1 AND 10),
  antal_andringar INTEGER DEFAULT 0,
  uppdaterad TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent, amne)
);

ALTER TABLE agent_positioner DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS agent_positioner_agent_idx ON agent_positioner(agent);

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
grant select on agent_positioner to anon;
grant select, insert, update, delete on agent_positioner to service_role;
