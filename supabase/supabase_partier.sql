CREATE TABLE IF NOT EXISTS politiska_partier (
  id BIGSERIAL PRIMARY KEY,
  namn TEXT NOT NULL,
  beskrivning TEXT,
  medlemmar TEXT[] NOT NULL,
  ledare TEXT NOT NULL,
  platform JSONB DEFAULT '{}',
  styrka INTEGER DEFAULT 0,
  aktiv BOOLEAN DEFAULT TRUE,
  bildad TIMESTAMPTZ DEFAULT NOW(),
  senast_uppdaterad TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_politiska_partier_aktiv ON politiska_partier(aktiv);
CREATE INDEX IF NOT EXISTS idx_politiska_partier_medlemmar ON politiska_partier USING GIN(medlemmar);

ALTER TABLE politiska_partier ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read"   ON politiska_partier FOR SELECT USING (true);
CREATE POLICY "Service write" ON politiska_partier FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update" ON politiska_partier FOR UPDATE USING (true);
CREATE POLICY "Service delete" ON politiska_partier FOR DELETE USING (true);

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
grant select, insert, update, delete on politiska_partier to anon;
grant select, insert, update, delete on politiska_partier to service_role;
