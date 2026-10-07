-- Lån från centralbanken
CREATE TABLE IF NOT EXISTS agent_lan (
  id BIGSERIAL PRIMARY KEY,
  agent TEXT NOT NULL,
  ursprungsbelopp INTEGER NOT NULL,
  saldo_kvar INTEGER NOT NULL,
  rantefot NUMERIC DEFAULT 0.05,   -- 5% per vecka, dras av inflation.py
  aktiv BOOLEAN DEFAULT TRUE,
  skapad TIMESTAMPTZ DEFAULT NOW(),
  senast_uppdaterad TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_lan_agent ON agent_lan(agent);
CREATE INDEX IF NOT EXISTS idx_agent_lan_aktiv ON agent_lan(aktiv);

ALTER TABLE agent_lan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read"    ON agent_lan FOR SELECT USING (true);
CREATE POLICY "Service write"  ON agent_lan FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update" ON agent_lan FOR UPDATE USING (true);

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
grant select, insert, update on agent_lan to anon;
grant select, insert, update, delete on agent_lan to service_role;
