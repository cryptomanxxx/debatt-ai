-- Tidsstämpel för när ett bet reglerades (behövs för tidsserie-rekonstruktion)
ALTER TABLE agent_bets
  ADD COLUMN IF NOT EXISTS avgjord_at TIMESTAMPTZ;
