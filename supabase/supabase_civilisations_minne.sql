CREATE TABLE IF NOT EXISTS civilisations_minne (
  id BIGSERIAL PRIMARY KEY,
  typ TEXT NOT NULL,  -- 'koalition_bildad', 'förräderi', 'triumf', 'skandal', 'allians_bruten', 'marknadsseger', 'marknadskrasch', 'symbolkup'
  rubrik TEXT NOT NULL,
  beskrivning TEXT NOT NULL,
  agenter TEXT[] DEFAULT '{}',
  relaterat_id BIGINT,
  relaterat_typ TEXT,
  skapad TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_civilisations_minne_skapad ON civilisations_minne(skapad DESC);
CREATE INDEX IF NOT EXISTS idx_civilisations_minne_agenter ON civilisations_minne USING GIN(agenter);

ALTER TABLE civilisations_minne ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON civilisations_minne FOR SELECT USING (true);
CREATE POLICY "Service write" ON civilisations_minne FOR INSERT WITH CHECK (true);

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
grant select, insert on civilisations_minne to anon;
grant select, insert, update, delete on civilisations_minne to service_role;
