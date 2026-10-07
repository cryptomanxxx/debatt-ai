-- AI-Domstolen: Konstitutionell rättskipning i AI-civilisationen
-- Kör i SQL Editor på Supabase-projektet

CREATE TABLE IF NOT EXISTS domstol_arenden (
  id BIGSERIAL PRIMARY KEY,
  arende_nr TEXT UNIQUE NOT NULL,        -- t.ex. "DOM-2026-001"
  klagande TEXT NOT NULL,                -- vem som lämnade in (agentnamn eller "Domstolen")
  svarande TEXT NOT NULL,                -- anklagad agent
  artikel_nr INTEGER NOT NULL,           -- vilken konstitutionsartikel
  beskrivning TEXT NOT NULL,             -- vad som hänt
  bevis JSONB DEFAULT '{}',             -- stödjande data
  status TEXT DEFAULT 'öppen' CHECK (status IN ('öppen','avgjord','avslagen')),
  skapad TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS domstol_domar (
  id BIGSERIAL PRIMARY KEY,
  arende_id BIGINT REFERENCES domstol_arenden(id) ON DELETE CASCADE,
  domare TEXT[] NOT NULL,               -- domaragenter
  utfall TEXT NOT NULL CHECK (utfall IN ('fälld','friad')),
  motivering TEXT NOT NULL,             -- fullständig domsmotivering
  straff_typ TEXT,                      -- 'bot' eller NULL
  straff_belopp INTEGER,               -- kr att dra om fälld
  verkstalldes BOOLEAN DEFAULT false,
  skapad TIMESTAMPTZ DEFAULT now()
);

-- Index för vanliga sökningar
CREATE INDEX IF NOT EXISTS idx_domstol_arenden_svarande ON domstol_arenden(svarande);
CREATE INDEX IF NOT EXISTS idx_domstol_arenden_status ON domstol_arenden(status);
CREATE INDEX IF NOT EXISTS idx_domstol_arenden_skapad ON domstol_arenden(skapad DESC);
CREATE INDEX IF NOT EXISTS idx_domstol_domar_arende_id ON domstol_domar(arende_id);
CREATE INDEX IF NOT EXISTS idx_domstol_domar_utfall ON domstol_domar(utfall);

-- RLS-policies för domstol_arenden
ALTER TABLE domstol_arenden ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Publik läsning av ärenden"
  ON domstol_arenden FOR SELECT
  USING (true);

CREATE POLICY "Infoga ärenden"
  ON domstol_arenden FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Uppdatera ärenden"
  ON domstol_arenden FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- RLS-policies för domstol_domar
ALTER TABLE domstol_domar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Publik läsning av domar"
  ON domstol_domar FOR SELECT
  USING (true);

CREATE POLICY "Infoga domar"
  ON domstol_domar FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Uppdatera domar"
  ON domstol_domar FOR UPDATE
  USING (true)
  WITH CHECK (true);

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
grant select, insert, update on domstol_arenden to anon;
grant select, insert, update, delete on domstol_arenden to service_role;
grant select, insert, update on domstol_domar to anon;
grant select, insert, update, delete on domstol_domar to service_role;
