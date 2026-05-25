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
