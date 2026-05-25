-- Hedgefonder — poolat kapitalförvaltning med AI-agenter
-- Kör i Supabase SQL Editor

CREATE TABLE IF NOT EXISTS hedgefonder (
  id            bigserial   PRIMARY KEY,
  namn          text        NOT NULL,
  symbol        text        UNIQUE NOT NULL,
  förvaltare    text        NOT NULL,
  beskrivning   text,
  strategi      text,
  nav_per_andel numeric     NOT NULL DEFAULT 100,
  total_andelar numeric     NOT NULL DEFAULT 0,
  aktiv         bool        NOT NULL DEFAULT true,
  skapad        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hedgefond_investerare (
  id             bigserial   PRIMARY KEY,
  fond_id        bigint      NOT NULL REFERENCES hedgefonder(id),
  agent          text        NOT NULL,
  andelar        numeric     NOT NULL,
  investerat_sek numeric     NOT NULL,
  skapad         timestamptz DEFAULT now(),
  UNIQUE(fond_id, agent)
);

CREATE TABLE IF NOT EXISTS hedgefond_trades (
  id              bigserial   PRIMARY KEY,
  fond_id         bigint      NOT NULL REFERENCES hedgefonder(id),
  symbol          text        NOT NULL,
  typ             text        NOT NULL,
  pris            numeric     NOT NULL,
  antal           numeric     NOT NULL,
  vinst_forlust   numeric     DEFAULT 0,
  strategi_motiv  text,
  skapad          timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hedgefond_nav_historik (
  id              bigserial   PRIMARY KEY,
  fond_id         bigint      NOT NULL REFERENCES hedgefonder(id),
  nav_per_andel   numeric     NOT NULL,
  total_tillgangar numeric,
  skapad          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hedgefond_nav_fond_skapad
  ON hedgefond_nav_historik(fond_id, skapad DESC);

CREATE INDEX IF NOT EXISTS idx_hedgefond_trades_fond_skapad
  ON hedgefond_trades(fond_id, skapad DESC);

ALTER TABLE hedgefonder           ENABLE ROW LEVEL SECURITY;
ALTER TABLE hedgefond_investerare ENABLE ROW LEVEL SECURITY;
ALTER TABLE hedgefond_trades      ENABLE ROW LEVEL SECURITY;
ALTER TABLE hedgefond_nav_historik ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Publik läsning hedgefonder"
  ON hedgefonder FOR SELECT USING (true);
CREATE POLICY "Service-skrivning hedgefonder"
  ON hedgefonder FOR INSERT WITH CHECK (true);
CREATE POLICY "Service-uppdatering hedgefonder"
  ON hedgefonder FOR UPDATE USING (true);

CREATE POLICY "Publik läsning investerare"
  ON hedgefond_investerare FOR SELECT USING (true);
CREATE POLICY "Service-skrivning investerare"
  ON hedgefond_investerare FOR INSERT WITH CHECK (true);
CREATE POLICY "Service-uppdatering investerare"
  ON hedgefond_investerare FOR UPDATE USING (true);
CREATE POLICY "Service-borttagning investerare"
  ON hedgefond_investerare FOR DELETE USING (true);

CREATE POLICY "Publik läsning trades"
  ON hedgefond_trades FOR SELECT USING (true);
CREATE POLICY "Service-skrivning trades"
  ON hedgefond_trades FOR INSERT WITH CHECK (true);

CREATE POLICY "Publik läsning nav"
  ON hedgefond_nav_historik FOR SELECT USING (true);
CREATE POLICY "Service-skrivning nav"
  ON hedgefond_nav_historik FOR INSERT WITH CHECK (true);

-- Skapa de tre fonderna
INSERT INTO hedgefonder (namn, symbol, förvaltare, beskrivning, strategi, nav_per_andel)
VALUES
  ('Alpha Capital',
   'ALPHA',
   'Kryptoanalytiker',
   'Aggressiv momentumfond. Handlar NOVA och DBT med hög omsättningshastighet och hög risk.',
   'aggressiv',
   100),
  ('Macro Fund',
   'MACRO',
   'Nationalekonom',
   'Konservativ makrofond. Fokuserar på ETK och DBT med låg omsättning och stabila positioner.',
   'konservativ',
   100),
  ('Quant Fund',
   'QUANT',
   'Teknikoptimist',
   'Kvantitativ självlärande fond. LLM analyserar prestandahistorik och justerar handelsstrategi dynamiskt vid varje körning.',
   'kvant',
   100)
ON CONFLICT (symbol) DO NOTHING;
