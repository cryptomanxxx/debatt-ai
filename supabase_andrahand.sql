-- Andrahandsmarknaden: agenter auktionerar ut symboler de äger
CREATE TABLE IF NOT EXISTS butik_auktioner (
  id            SERIAL PRIMARY KEY,
  vara_id       INTEGER NOT NULL REFERENCES butik_varor(id),
  saljare       TEXT NOT NULL,
  reservpris    INTEGER NOT NULL,
  nuv_bud       INTEGER,
  hogst_budgivare TEXT,
  stanger_at    TIMESTAMPTZ NOT NULL,
  status        TEXT NOT NULL DEFAULT 'öppen',   -- öppen | avgjord | inställd
  skapad        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS butik_bud (
  id          SERIAL PRIMARY KEY,
  auktion_id  INTEGER NOT NULL REFERENCES butik_auktioner(id),
  budgivare   TEXT NOT NULL,
  belopp      INTEGER NOT NULL,
  skapad      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS butik_auktioner_vara_idx    ON butik_auktioner(vara_id);
CREATE INDEX IF NOT EXISTS butik_auktioner_status_idx  ON butik_auktioner(status);
CREATE INDEX IF NOT EXISTS butik_auktioner_saljare_idx ON butik_auktioner(saljare);
CREATE INDEX IF NOT EXISTS butik_bud_auktion_idx       ON butik_bud(auktion_id);
