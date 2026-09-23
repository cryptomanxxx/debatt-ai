-- Stablecoin-vaults — STAB token backad av SEK-collateral
-- Kör i Supabase SQL Editor

CREATE TABLE IF NOT EXISTS stablecoin_vaults (
  id               bigserial   PRIMARY KEY,
  agent            text        NOT NULL UNIQUE,
  collateral_sek   numeric     NOT NULL DEFAULT 0,
  stab_utfardat    numeric     NOT NULL DEFAULT 0,
  aktiv            bool        NOT NULL DEFAULT true,
  skapad           timestamptz DEFAULT now(),
  uppdaterad       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stablecoin_vaults_agent
  ON stablecoin_vaults(agent);

ALTER TABLE stablecoin_vaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Publik läsning vaults"
  ON stablecoin_vaults FOR SELECT USING (true);
CREATE POLICY "Service-skrivning vaults"
  ON stablecoin_vaults FOR INSERT WITH CHECK (true);
CREATE POLICY "Service-uppdatering vaults"
  ON stablecoin_vaults FOR UPDATE USING (true);

-- OBS: STAB-token läggs till i bors_tillgangar av stablecoin_test.py vid första körning

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
grant select, insert, update on stablecoin_vaults to anon;
grant select, insert, update, delete on stablecoin_vaults to service_role;
