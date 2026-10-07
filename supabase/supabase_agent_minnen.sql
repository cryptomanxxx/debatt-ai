-- Agent-specifikt minneslager
-- Lagrar narrativa minnen per agent för promptinjektion
-- Kör i Supabase SQL Editor

CREATE TABLE IF NOT EXISTS agent_minnen (
  id            bigserial PRIMARY KEY,
  agent         text        NOT NULL,
  händelse_typ  text        NOT NULL, -- röst | lobbying | koalition | artikel | ekonomi
  narrativ      text        NOT NULL, -- 1-2 meningar, LLM-läsbart
  relaterade_agenter text[] DEFAULT '{}',
  metadata      jsonb       DEFAULT '{}',
  skapad        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_minnen_agent_skapad
  ON agent_minnen(agent, skapad DESC);

CREATE INDEX IF NOT EXISTS idx_agent_minnen_typ
  ON agent_minnen(händelse_typ);

ALTER TABLE agent_minnen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Publik läsning"
  ON agent_minnen FOR SELECT USING (true);

CREATE POLICY "Service-skrivning"
  ON agent_minnen FOR INSERT WITH CHECK (true);

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
grant select, insert on agent_minnen to anon;
grant select, insert, update, delete on agent_minnen to service_role;
