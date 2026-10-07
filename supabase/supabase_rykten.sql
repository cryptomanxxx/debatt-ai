CREATE TABLE IF NOT EXISTS rykten (
  id              bigserial PRIMARY KEY,
  innehall        TEXT      NOT NULL,
  om_agent        TEXT      NOT NULL,
  ursprung_agent  TEXT      NOT NULL,
  sanning         BOOL      NOT NULL DEFAULT false,
  kanda_av        TEXT[]    DEFAULT '{}',
  antal_spridningar INT     DEFAULT 0,
  skapad          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rykte_spridningar (
  id          bigserial PRIMARY KEY,
  rykte_id    BIGINT REFERENCES rykten(id) ON DELETE CASCADE,
  fran_agent  TEXT NOT NULL,
  till_agent  TEXT NOT NULL,
  skapad      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE rykten             ENABLE ROW LEVEL SECURITY;
ALTER TABLE rykte_spridningar  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read rykten"    ON rykten            FOR SELECT USING (true);
CREATE POLICY "public insert rykten"  ON rykten            FOR INSERT WITH CHECK (true);
CREATE POLICY "public update rykten"  ON rykten            FOR UPDATE USING (true);
CREATE POLICY "public read spridn"    ON rykte_spridningar FOR SELECT USING (true);
CREATE POLICY "public insert spridn"  ON rykte_spridningar FOR INSERT WITH CHECK (true);

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
grant select, insert, update on rykten to anon;
grant select, insert, update, delete on rykten to service_role;
grant select, insert on rykte_spridningar to anon;
grant select, insert, update, delete on rykte_spridningar to service_role;
