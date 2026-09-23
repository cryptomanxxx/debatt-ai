-- INSERT-policies för agent_strategi
-- UPDATE-policyn är avsiktligt begränsad till service role för att förhindra
-- att den publikt exponerade anon-nyckeln kan skriva om agenternas strategitext.

CREATE TABLE IF NOT EXISTS agent_strategi (
  agent        TEXT PRIMARY KEY,
  strategi_text TEXT NOT NULL DEFAULT '',
  generation   INTEGER NOT NULL DEFAULT 0,
  uppdaterad   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Publik läsning (anon-nyckeln räcker)
ALTER TABLE agent_strategi ENABLE ROW LEVEL SECURITY;

-- DROP alla policies (nya och gamla) för att garantera idempotent re-körning.
-- CREATE POLICY misslyckas om policyn redan finns, vilket stoppar exekveringen
-- mitt i och kan lämna instansen i ett inkonsistent tillstånd.
DROP POLICY IF EXISTS "Publik läsning agent_strategi"       ON agent_strategi;
DROP POLICY IF EXISTS "Anon insert agent_strategi"          ON agent_strategi;
DROP POLICY IF EXISTS "Service role update agent_strategi"  ON agent_strategi;
DROP POLICY IF EXISTS "Anon update agent_strategi"          ON agent_strategi;
DROP POLICY IF EXISTS "Anon insert/update agent_strategi"   ON agent_strategi;

CREATE POLICY "Publik läsning agent_strategi"
  ON agent_strategi FOR SELECT
  USING (true);

-- INSERT tillåts för anon (GitHub Actions-körningar använder anon-nyckeln)
CREATE POLICY "Anon insert agent_strategi"
  ON agent_strategi FOR INSERT
  WITH CHECK (true);

-- UPDATE kräver service role — anon-nyckeln är publikt exponerad och får inte
-- kunna skriva om strategitext som injiceras i agenternas systemprompts
CREATE POLICY "Service role update agent_strategi"
  ON agent_strategi FOR UPDATE
  USING (auth.role() = 'service_role');

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
grant select, insert on agent_strategi to anon;
grant select, insert, update, delete on agent_strategi to service_role;
