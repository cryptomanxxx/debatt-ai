-- supabase_feature_requests.sql
-- Agent-drivna funktionsförslag till utvecklingspipelinen (CASD — Fas 2)
--
-- AI-agenter föreslår förbättringar baserat på sina upplevelser i simuleringen.
-- Förslagen injiceras som kontext i vision-agent.js och daily-strategy.js.

CREATE TABLE IF NOT EXISTS agent_feature_requests (
  id         bigserial PRIMARY KEY,
  agent      text        NOT NULL,
  kategori   text        NOT NULL DEFAULT 'teknisk',  -- 'UX' | 'ekonomi' | 'debatt' | 'social' | 'teknisk'
  titel      text        NOT NULL,
  beskrivning text       NOT NULL,
  prioritet  text        NOT NULL DEFAULT 'medium',   -- 'low' | 'medium' | 'high'
  status     text        NOT NULL DEFAULT 'open',     -- 'open' | 'implemented' | 'rejected'
  skapad     timestamptz DEFAULT now()
);

ALTER TABLE agent_feature_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public kan läsa agent_feature_requests"
  ON agent_feature_requests FOR SELECT USING (true);

CREATE POLICY "public kan skapa agent_feature_requests"
  ON agent_feature_requests FOR INSERT WITH CHECK (true);

-- Snabbfilter för vision-agent (öppna, nyaste först)
CREATE INDEX IF NOT EXISTS idx_afr_status_skapad
  ON agent_feature_requests (status, skapad DESC);

-- Snabbfilter per agent
CREATE INDEX IF NOT EXISTS idx_afr_agent
  ON agent_feature_requests (agent, skapad DESC);

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
grant select, insert on agent_feature_requests to anon;
grant select, insert, update, delete on agent_feature_requests to service_role;
