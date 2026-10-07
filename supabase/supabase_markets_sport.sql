-- Migrering: lägg till 'sport' i markets.kategori CHECK-constraint
-- Kör i Supabase SQL Editor

-- PostgreSQL namnger inline CHECK-constraints automatiskt som <tabell>_<kolumn>_check
ALTER TABLE markets DROP CONSTRAINT IF EXISTS markets_kategori_check;

ALTER TABLE markets
  ADD CONSTRAINT markets_kategori_check
  CHECK (kategori IN ('krypto', 'makro', 'politik', 'tech', 'övrigt', 'sport'));
