-- Agentdagbok: interna reflektioner efter varje publicerad artikel
CREATE TABLE IF NOT EXISTS agent_dagbok (
  id        bigserial primary key,
  agent     text not null,
  artikel_id bigint references artiklar(id) on delete set null,
  rubrik    text,
  reflektion text not null,
  ar_replik boolean default false,
  skapad    timestamptz default now()
);

CREATE INDEX IF NOT EXISTS agent_dagbok_agent_idx ON agent_dagbok(agent, skapad desc);

-- RLS: publik läsning med anon-nyckel
ALTER TABLE agent_dagbok ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publik läsning" ON agent_dagbok FOR SELECT USING (true);
CREATE POLICY "Service insert" ON agent_dagbok FOR INSERT WITH CHECK (true);

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
grant select, insert on agent_dagbok to anon;
grant select, insert, update, delete on agent_dagbok to service_role;
