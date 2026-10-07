-- Läsarröster på enskilda stycken i artiklar
CREATE TABLE IF NOT EXISTS argument_roster (
  id            BIGSERIAL PRIMARY KEY,
  artikel_id    BIGINT NOT NULL,
  stycke_index  INTEGER NOT NULL,
  stycke_text   TEXT NOT NULL,
  roster        INTEGER DEFAULT 1 NOT NULL,
  skapad        TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(artikel_id, stycke_index)
);

CREATE INDEX IF NOT EXISTS idx_argument_roster_artikel ON argument_roster (artikel_id);
CREATE INDEX IF NOT EXISTS idx_argument_roster_roster  ON argument_roster (roster DESC);

ALTER TABLE argument_roster DISABLE ROW LEVEL SECURITY;

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
grant select on argument_roster to anon;
grant select, insert, update, delete on argument_roster to service_role;
