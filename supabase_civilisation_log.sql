-- civilisation_log: logg över anrop till /api/civilisation
CREATE TABLE IF NOT EXISTS civilisation_log (
  id          bigserial PRIMARY KEY,
  fraga       text        NOT NULL,
  endpoint    text,
  datapunkter integer     DEFAULT 0,
  provider    text,
  model       text,
  latency_ms  integer,
  lang        text        DEFAULT 'sv',
  skapad      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS civilisation_log_skapad_idx ON civilisation_log (skapad DESC);
CREATE INDEX IF NOT EXISTS civilisation_log_endpoint_idx ON civilisation_log (endpoint);

ALTER TABLE civilisation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read civilisation_log"
  ON civilisation_log FOR SELECT USING (true);

CREATE POLICY "Service insert civilisation_log"
  ON civilisation_log FOR INSERT WITH CHECK (true);
