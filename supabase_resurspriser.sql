-- Resurspriser: dynamisk prismodell per zontyp
-- En rad per zontyp, upsert:as dagligen av mark_test.py
-- Pris-multiplikatorn styr zonsinkomsten: hög ägartäthet → lägre pris, låg → högre

CREATE TABLE IF NOT EXISTS resurspriser (
  typ             TEXT PRIMARY KEY,
  bas_pris        NUMERIC NOT NULL DEFAULT 100,
  pris_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  antal_agda      INTEGER NOT NULL DEFAULT 0,
  antal_totala    INTEGER NOT NULL DEFAULT 0,
  trend           TEXT    NOT NULL DEFAULT 'stabil',
  uppdaterad      TIMESTAMPTZ DEFAULT NOW()
);

-- Initial seed med baspriser per zontyp (kr)
INSERT INTO resurspriser (typ, bas_pris, antal_totala) VALUES
  ('energi',   200, 5),
  ('jordbruk', 150, 6),
  ('industri', 250, 5),
  ('gruva',    300, 4),
  ('stad',     180, 6),
  ('kust',     120, 5),
  ('skog',     100, 4)
ON CONFLICT (typ) DO NOTHING;

-- RLS: publik läsning + skrivning (mark_test.py upsertar dagligen via anon-nyckeln)
ALTER TABLE resurspriser ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publik läsning resurspriser" ON resurspriser FOR SELECT USING (true);
CREATE POLICY "Publik insert resurspriser" ON resurspriser FOR INSERT WITH CHECK (true);
CREATE POLICY "Publik update resurspriser" ON resurspriser FOR UPDATE USING (true);
