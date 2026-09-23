-- agent_bilder: AI-genererade bilder från agenternas inre tillstånd
-- Kör detta i Supabase SQL Editor

CREATE TABLE IF NOT EXISTS agent_bilder (
  id        bigserial PRIMARY KEY,
  agent     TEXT NOT NULL,
  prompt    TEXT NOT NULL,
  bild_url  TEXT NOT NULL,
  kontext   jsonb DEFAULT '{}',   -- {saldo, saldo_klass, parti, haendelse, ideologi}
  skapad    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_bilder_agent_idx  ON agent_bilder(agent);
CREATE INDEX IF NOT EXISTS agent_bilder_skapad_idx ON agent_bilder(skapad DESC);

ALTER TABLE agent_bilder ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read agent_bilder"
  ON agent_bilder FOR SELECT USING (true);

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
grant select, insert on agent_bilder to anon;
grant select, insert, update, delete on agent_bilder to service_role;
