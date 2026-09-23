CREATE TABLE IF NOT EXISTS agent_relationer (
  agent_a TEXT NOT NULL,
  agent_b TEXT NOT NULL,
  typ TEXT NOT NULL DEFAULT 'neutral',  -- 'allierad', 'rival', 'fiende', 'neutral'
  styrka INTEGER DEFAULT 50,
  beskrivning TEXT,
  senast_uppdaterad TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (agent_a, agent_b),
  CONSTRAINT agent_a_lt_b CHECK (agent_a < agent_b)
);

ALTER TABLE agent_relationer ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON agent_relationer FOR SELECT USING (true);
CREATE POLICY "Service write" ON agent_relationer FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update" ON agent_relationer FOR UPDATE USING (true);

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
grant select, insert, update on agent_relationer to anon;
grant select, insert, update, delete on agent_relationer to service_role;
