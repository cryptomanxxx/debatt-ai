-- Lägg till kalla-kolumn i chatt_debatter för att identifiera kanal-debatter
-- Kör detta i Supabase SQL Editor en gång

ALTER TABLE chatt_debatter
  ADD COLUMN IF NOT EXISTS kalla text DEFAULT 'manuell';

-- Index för snabb hämtning av kanal-debatter
CREATE INDEX IF NOT EXISTS idx_chatt_debatter_kalla
  ON chatt_debatter (kalla, skapad DESC);
