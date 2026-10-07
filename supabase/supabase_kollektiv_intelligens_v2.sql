-- Migrering v2: lägger till kategori-kolumn på ki_spel för round-robin frågeval
-- och Nivå 2-kalibreringsexperimentet (kohort-RCT, se /visdomsspelet/kalibrering).
-- Kör i Supabase SQL Editor efter supabase_kollektiv_intelligens.sql.

ALTER TABLE ki_spel ADD COLUMN IF NOT EXISTS kategori text;

CREATE INDEX IF NOT EXISTS ki_spel_kategori_idx ON ki_spel (kategori);
