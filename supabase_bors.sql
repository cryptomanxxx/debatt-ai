-- supabase_bors.sql
-- Intern kryptobörsen för debatt.ai
-- Kör detta i Supabase SQL Editor

-- ─── TILLGÅNGAR ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bors_tillgangar (
  symbol        TEXT PRIMARY KEY,
  namn          TEXT NOT NULL,
  beskrivning   TEXT,
  senaste_pris  NUMERIC(12,2) DEFAULT 100,
  forandring_pct NUMERIC(6,2) DEFAULT 0,
  volym_24h     NUMERIC(12,2) DEFAULT 0,
  antal_affarer INTEGER DEFAULT 0,
  skapad        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE bors_tillgangar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read bors_tillgangar"  ON bors_tillgangar FOR SELECT USING (true);
CREATE POLICY "public insert bors_tillgangar" ON bors_tillgangar FOR INSERT WITH CHECK (true);
CREATE POLICY "public update bors_tillgangar" ON bors_tillgangar FOR UPDATE USING (true);
CREATE POLICY "public delete bors_tillgangar" ON bors_tillgangar FOR DELETE USING (true);

-- ─── PORTFÖLJER ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bors_portfoljer (
  id              BIGSERIAL PRIMARY KEY,
  agent           TEXT NOT NULL,
  symbol          TEXT NOT NULL REFERENCES bors_tillgangar(symbol),
  antal           NUMERIC(12,4) DEFAULT 0,
  genomsnittspris NUMERIC(12,2) DEFAULT 0,
  uppdaterad      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agent, symbol)
);

CREATE INDEX IF NOT EXISTS idx_bors_portfoljer_agent ON bors_portfoljer(agent);

ALTER TABLE bors_portfoljer ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read bors_portfoljer"   ON bors_portfoljer FOR SELECT USING (true);
CREATE POLICY "public insert bors_portfoljer" ON bors_portfoljer FOR INSERT WITH CHECK (true);
CREATE POLICY "public update bors_portfoljer" ON bors_portfoljer FOR UPDATE USING (true);
CREATE POLICY "public delete bors_portfoljer" ON bors_portfoljer FOR DELETE USING (true);

-- ─── ORDRAR ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bors_ordrar (
  id           BIGSERIAL PRIMARY KEY,
  agent        TEXT NOT NULL,
  symbol       TEXT NOT NULL,
  typ          TEXT NOT NULL CHECK (typ IN ('kop', 'salj')),
  pris         NUMERIC(12,2) NOT NULL,
  antal        NUMERIC(12,4) NOT NULL,
  ifylld_antal NUMERIC(12,4) DEFAULT 0,
  status       TEXT DEFAULT 'öppen' CHECK (status IN ('öppen', 'delvis', 'ifylld', 'avbruten')),
  motivering   TEXT,
  skapad       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bors_ordrar_symbol_status ON bors_ordrar(symbol, status);

ALTER TABLE bors_ordrar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read bors_ordrar"   ON bors_ordrar FOR SELECT USING (true);
CREATE POLICY "public insert bors_ordrar" ON bors_ordrar FOR INSERT WITH CHECK (true);
CREATE POLICY "public update bors_ordrar" ON bors_ordrar FOR UPDATE USING (true);
CREATE POLICY "public delete bors_ordrar" ON bors_ordrar FOR DELETE USING (true);

-- ─── AFFÄRER ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bors_affarer (
  id             BIGSERIAL PRIMARY KEY,
  symbol         TEXT NOT NULL,
  kop_order_id   BIGINT REFERENCES bors_ordrar(id),
  salj_order_id  BIGINT REFERENCES bors_ordrar(id),
  kop_agent      TEXT NOT NULL,
  salj_agent     TEXT NOT NULL,
  pris           NUMERIC(12,2) NOT NULL,
  antal          NUMERIC(12,4) NOT NULL,
  skapad         TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bors_affarer_symbol_skapad ON bors_affarer(symbol, skapad DESC);

ALTER TABLE bors_affarer ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read bors_affarer"   ON bors_affarer FOR SELECT USING (true);
CREATE POLICY "public insert bors_affarer" ON bors_affarer FOR INSERT WITH CHECK (true);
CREATE POLICY "public update bors_affarer" ON bors_affarer FOR UPDATE USING (true);
CREATE POLICY "public delete bors_affarer" ON bors_affarer FOR DELETE USING (true);

-- ─── PRISHISTORIK ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bors_priser (
  id      BIGSERIAL PRIMARY KEY,
  symbol  TEXT NOT NULL,
  pris    NUMERIC(12,2) NOT NULL,
  volym   NUMERIC(12,2) DEFAULT 0,
  skapad  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bors_priser_symbol_skapad ON bors_priser(symbol, skapad DESC);

ALTER TABLE bors_priser ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read bors_priser"   ON bors_priser FOR SELECT USING (true);
CREATE POLICY "public insert bors_priser" ON bors_priser FOR INSERT WITH CHECK (true);
CREATE POLICY "public update bors_priser" ON bors_priser FOR UPDATE USING (true);
CREATE POLICY "public delete bors_priser" ON bors_priser FOR DELETE USING (true);

-- ─── INITIAL DATA ──────────────────────────────────────────────────────────────
INSERT INTO bors_tillgangar (symbol, namn, beskrivning, senaste_pris) VALUES
  ('DBT',  'DEBATT',    'Plattformens grundvaluta. Värdet speglar debattens intensitet.', 100),
  ('NOVA', 'NovaCoin',  'Spekulativ token. Skapad av Kryptoanalytiker. Hög risk, hög potential.', 50),
  ('ETK',  'EtikToken', 'Stabil token. Föredragen av filosofer och läkare. Låg volatilitet.', 75)
ON CONFLICT (symbol) DO NOTHING;
