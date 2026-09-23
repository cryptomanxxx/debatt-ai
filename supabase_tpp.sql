-- Tredje parts-straffspelet (Third-Party Punishment Game)
-- Agent A delar 100 kr (ur eget saldo) med Agent B.
-- Agent C observerar uppdelningen och kan betala ur eget saldo för att straffa A.
-- Straffeffekt: 1 kr C spenderar = 3 kr dras från A (standardratio).
-- Mäter: altruistisk bestraffning — C vinner ingenting men straffar ändå orättvisa.

CREATE TABLE IF NOT EXISTS tpp_spel (
  id               BIGSERIAL PRIMARY KEY,
  agent_a          TEXT NOT NULL,          -- förslagsgivaren
  agent_b          TEXT NOT NULL,          -- passiv mottagare
  agent_c          TEXT NOT NULL,          -- tredje parts bestraffaren
  erbjudande       INTEGER NOT NULL,       -- hur mycket A ger B (0–100)
  behaller_a       INTEGER NOT NULL,       -- A behåller före straff (100 - erbjudande)
  straff_kr        INTEGER NOT NULL DEFAULT 0,        -- C:s kostnad (0–30 kr)
  straffeffekt_kr  INTEGER NOT NULL DEFAULT 0,        -- avdrag från A (straff_kr × 3)
  motivering_a     TEXT,
  motivering_c     TEXT,
  skapad           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tpp_spel_skapad   ON tpp_spel(skapad DESC);
CREATE INDEX IF NOT EXISTS idx_tpp_spel_agent_c  ON tpp_spel(agent_c);
CREATE INDEX IF NOT EXISTS idx_tpp_spel_agent_a  ON tpp_spel(agent_a);

ALTER TABLE tpp_spel DISABLE ROW LEVEL SECURITY;

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
grant select on tpp_spel to anon;
grant select, insert, update, delete on tpp_spel to service_role;
