-- Andrahandsmarknaden för mark: agenter auktionerar ut zoner de äger
CREATE TABLE IF NOT EXISTS mark_auktioner (
  id              BIGSERIAL PRIMARY KEY,
  zon_id          BIGINT NOT NULL REFERENCES mark_zoner(id),
  saljare         TEXT NOT NULL,
  reservpris      NUMERIC NOT NULL,
  nuv_bud         NUMERIC,
  hogst_budgivare TEXT,
  stanger_at      TIMESTAMPTZ NOT NULL,
  status          TEXT NOT NULL DEFAULT 'öppen',   -- öppen | avgjord | inställd
  skapad          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mark_bud (
  id          BIGSERIAL PRIMARY KEY,
  auktion_id  BIGINT NOT NULL REFERENCES mark_auktioner(id),
  budgivare   TEXT NOT NULL,
  belopp      NUMERIC NOT NULL,
  skapad      TIMESTAMPTZ DEFAULT now()
);

-- Max en öppen auktion per zon
CREATE UNIQUE INDEX IF NOT EXISTS mark_auktioner_zon_oppna_idx
  ON mark_auktioner(zon_id) WHERE status = 'öppen';

CREATE INDEX IF NOT EXISTS mark_auktioner_status_idx  ON mark_auktioner(status);
CREATE INDEX IF NOT EXISTS mark_auktioner_saljare_idx ON mark_auktioner(saljare);
CREATE INDEX IF NOT EXISTS mark_bud_auktion_idx       ON mark_bud(auktion_id);

-- RLS
ALTER TABLE mark_auktioner ENABLE ROW LEVEL SECURITY;
ALTER TABLE mark_bud       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Publik läsning mark_auktioner"  ON mark_auktioner FOR SELECT USING (true);
CREATE POLICY "Service insert mark_auktioner"  ON mark_auktioner FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update mark_auktioner"  ON mark_auktioner FOR UPDATE USING (true);

CREATE POLICY "Publik läsning mark_bud"        ON mark_bud FOR SELECT USING (true);
CREATE POLICY "Service insert mark_bud"        ON mark_bud FOR INSERT WITH CHECK (true);
