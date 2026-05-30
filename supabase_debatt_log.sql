-- Logg för Debatt API-anrop (/api/debatt)
CREATE TABLE IF NOT EXISTS debatt_log (
  id         bigserial PRIMARY KEY,
  ip         text,
  amne       text,
  agenter    text[],
  antal_inlagg int,
  latency_ms int,
  skapad     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS debatt_log_skapad ON debatt_log (skapad DESC);

ALTER TABLE debatt_log ENABLE ROW LEVEL SECURITY;

-- API-routen loggar via service role
CREATE POLICY "Service kan infoga debatt_log" ON debatt_log
  FOR INSERT WITH CHECK (true);

-- Blockerad för anon — admin läser via service role
CREATE POLICY "Service kan läsa debatt_log" ON debatt_log
  FOR SELECT USING (false);
