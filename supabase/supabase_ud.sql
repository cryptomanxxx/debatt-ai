-- Utrikesdepartementet — relationer och deklarationer
-- Kör i Supabase SQL Editor

CREATE TABLE IF NOT EXISTS ud_relationer (
  id            BIGSERIAL PRIMARY KEY,
  civ_id        BIGINT NOT NULL REFERENCES community_civilisationer(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'neutral'
                CHECK (status IN ('neutral', 'vänlig', 'spänd', 'fientlig')),
  antal_utbyten INT NOT NULL DEFAULT 0,
  senaste_kontakt TIMESTAMPTZ,
  uppdaterad    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(civ_id)
);

CREATE TABLE IF NOT EXISTS ud_deklarationer (
  id        BIGSERIAL PRIMARY KEY,
  minister  TEXT NOT NULL,
  rubrik    TEXT NOT NULL,
  innehall  TEXT NOT NULL,
  civ_id    BIGINT REFERENCES community_civilisationer(id) ON DELETE SET NULL,
  skapad    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ud_rel_civ   ON ud_relationer(civ_id);
CREATE INDEX IF NOT EXISTS idx_ud_dekl_skapad ON ud_deklarationer(skapad DESC);

ALTER TABLE ud_relationer  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ud_deklarationer ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON ud_relationer    FOR SELECT USING (true);
CREATE POLICY "Public read" ON ud_deklarationer FOR SELECT USING (true);

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
grant select on ud_relationer to anon;
grant select, insert, update, delete on ud_relationer to service_role;
grant select on ud_deklarationer to anon;
grant select, insert, update, delete on ud_deklarationer to service_role;
