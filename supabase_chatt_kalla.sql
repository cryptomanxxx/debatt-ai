-- Lägg till kalla-kolumn på chatt_debatter
-- Kör i Supabase SQL Editor

ALTER TABLE chatt_debatter
  ADD COLUMN IF NOT EXISTS kalla text DEFAULT 'inbyggt';

-- Möjliga värden: 'besökare' | 'ai' | 'inbyggt'
