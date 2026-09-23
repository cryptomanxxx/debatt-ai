-- Logg för Debatt API-anrop (/api/debatt)
CREATE TABLE IF NOT EXISTS debatt_log (
  id         bigserial PRIMARY KEY,
  ip         text,
  amne       text,
  agenter    text[],
  antal_inlagg int,
  latency_ms int,
  skapad     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS debatt_log_skapad ON debatt_log (skapad DESC);

ALTER TABLE debatt_log ENABLE ROW LEVEL SECURITY;

-- API-routen loggar via service role
CREATE POLICY "Service kan infoga debatt_log" ON debatt_log
  FOR INSERT WITH CHECK (true);

-- Blockerad för anon — admin läser via service role
CREATE POLICY "Service kan läsa debatt_log" ON debatt_log
  FOR SELECT USING (false);

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
grant insert on debatt_log to anon;
grant select, insert, update, delete on debatt_log to service_role;
