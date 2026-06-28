-- Tredje parts-straffspelet (Third-Party Punishment Game)
-- Agent A delar 100 kr (ur eget saldo) med Agent B.
-- Agent C observerar uppdelningen och kan betala ur eget saldo för att straffa A.
-- Straffeffekt: 1 kr C spenderar = 3 kr dras från A (standardratio).
-- Mäter: altruistisk bestraffning — C vinner ingenting men straffar ändå orättvisa.

CREATE TABLE IF NOT EXISTS tpp_spel (
  id               BIGSERIAL PRIMARY KEY,
  agent_a          TEXT NOT NULL,          -- förslagsgivaren
  agent_b          TEXT NOT NULL,          -- passiv mottagare
  agent_c          TEXT NOT NULL,          -- tredje parts bestraffaren
  erbjudande       INTEGER NOT NULL,       -- hur mycket A ger B (0–100)
  behaller_a       INTEGER NOT NULL,       -- A behåller före straff (100 - erbjudande)
  straff_kr        INTEGER NOT NULL DEFAULT 0,        -- C:s kostnad (0–30 kr)
  straffeffekt_kr  INTEGER NOT NULL DEFAULT 0,        -- avdrag från A (straff_kr × 3)
  motivering_a     TEXT,
  motivering_c     TEXT,
  skapad           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tpp_spel_skapad   ON tpp_spel(skapad DESC);
CREATE INDEX IF NOT EXISTS idx_tpp_spel_agent_c  ON tpp_spel(agent_c);
CREATE INDEX IF NOT EXISTS idx_tpp_spel_agent_a  ON tpp_spel(agent_a);

ALTER TABLE tpp_spel DISABLE ROW LEVEL SECURITY;
