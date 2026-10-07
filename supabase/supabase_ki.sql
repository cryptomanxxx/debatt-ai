-- agent_ki: tematiska kunskapsinsikter per agent
-- Kör i Supabase SQL Editor

CREATE TABLE IF NOT EXISTS agent_ki (
  id         bigserial PRIMARY KEY,
  agent      text NOT NULL,
  amne       text NOT NULL,              -- ämnesord, t.ex. "räntepolitik"
  insikt     text NOT NULL,              -- max 300 tecken
  artikel_id bigint,                     -- källartikeln
  skapad     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_ki_agent_idx
  ON agent_ki (agent, skapad DESC);

CREATE INDEX IF NOT EXISTS agent_ki_amne_idx
  ON agent_ki (agent, amne);

ALTER TABLE agent_ki ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publik läsning"  ON agent_ki FOR SELECT USING (true);
CREATE POLICY "Service insert"  ON agent_ki FOR INSERT WITH CHECK (true);

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
grant select, insert on agent_ki to anon;
grant select, insert, update, delete on agent_ki to service_role;
