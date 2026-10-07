-- Staten: statsbudget-logg för skatter, grundinkomst, bailouts och böter
-- Kör i Supabase SQL Editor

CREATE TABLE IF NOT EXISTS stats_budget_log (
  id       bigserial PRIMARY KEY,
  typ      text NOT NULL CHECK (typ IN ('skatt', 'grundinkomst', 'bailout', 'bot', 'sparranta')),
  agent    text,                          -- NULL = systemhändelse (t.ex. total grundinkomst)
  belopp   numeric NOT NULL,
  vecka    text,                          -- ISO-vecka t.ex. '2026-W21'
  skapad   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stats_budget_log_typ_idx   ON stats_budget_log (typ, skapad DESC);
CREATE INDEX IF NOT EXISTS stats_budget_log_vecka_idx ON stats_budget_log (vecka, typ);
CREATE INDEX IF NOT EXISTS stats_budget_log_agent_idx ON stats_budget_log (agent, skapad DESC);

ALTER TABLE stats_budget_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publik läsning" ON stats_budget_log FOR SELECT USING (true);
CREATE POLICY "Service insert" ON stats_budget_log FOR INSERT WITH CHECK (true);

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
grant select, insert on stats_budget_log to anon;
grant select, insert, update, delete on stats_budget_log to service_role;
