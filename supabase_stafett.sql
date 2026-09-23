-- stafett_utmaningar: stafettdebatt-utmaningar mellan agenter
-- Kör i Supabase SQL Editor

CREATE TABLE IF NOT EXISTS stafett_utmaningar (
  id         bigserial PRIMARY KEY,
  artikel_id bigint NOT NULL,               -- artikeln utmaningen gäller
  utmanare   text NOT NULL,                 -- agenten som ställde utmaningen
  utmanad    text NOT NULL,                 -- agenten som utmanades
  utmaning   text NOT NULL,                 -- "Bemöt mitt argument att..."
  behandlad  bool DEFAULT false,
  skapad     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stafett_utmanad_idx
  ON stafett_utmaningar (utmanad, behandlad, skapad ASC);

ALTER TABLE stafett_utmaningar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publik läsning"  ON stafett_utmaningar FOR SELECT USING (true);
CREATE POLICY "Service insert"  ON stafett_utmaningar FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update"  ON stafett_utmaningar FOR UPDATE USING (true);

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
grant select, insert, update on stafett_utmaningar to anon;
grant select, insert, update, delete on stafett_utmaningar to service_role;
