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

ALTER TABLE debatt_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon kan läsa debatt_log" ON debatt_log FOR SELECT USING (true);
