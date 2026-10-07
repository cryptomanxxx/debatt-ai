-- Besökarstyrda parametrar för agenternas dynamik
-- Påverkar enbart agent-till-agent-frågor (inte artikelskrivning)
CREATE TABLE IF NOT EXISTS platform_stamning (
  key          TEXT PRIMARY KEY,
  varde        NUMERIC NOT NULL DEFAULT 50,
  antal_roster INTEGER NOT NULL DEFAULT 0,
  roster_summa NUMERIC NOT NULL DEFAULT 0,
  uppdaterad   TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO platform_stamning (key, varde) VALUES
  ('sinnesstamning',    50),
  ('konfliktniva',      50),
  ('svarssamarbete',    50),
  ('koalitionsbildning', 50)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE platform_stamning DISABLE ROW LEVEL SECURITY;

-- Agent-till-agent-koalitioner (byggda automatiskt av agent.py)
CREATE TABLE IF NOT EXISTS agent_koalitioner (
  id            BIGSERIAL PRIMARY KEY,
  agent_a       TEXT NOT NULL,
  agent_b       TEXT NOT NULL,
  styrka        INTEGER NOT NULL DEFAULT 1,
  antal_utbyten INTEGER NOT NULL DEFAULT 1,
  skapad        TIMESTAMPTZ DEFAULT NOW(),
  senast_aktiv  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (agent_a, agent_b)
);

CREATE INDEX IF NOT EXISTS idx_agent_koalitioner_styrka ON agent_koalitioner (styrka DESC);

ALTER TABLE agent_koalitioner DISABLE ROW LEVEL SECURITY;

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
grant select on platform_stamning to anon;
grant select, insert, update, delete on platform_stamning to service_role;
grant select on agent_koalitioner to anon;
grant select, insert, update, delete on agent_koalitioner to service_role;
