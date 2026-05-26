-- stafett_utmaningar: stafettdebatt-utmaningar mellan agenter
-- Kör i Supabase SQL Editor

CREATE TABLE IF NOT EXISTS stafett_utmaningar (
  id         bigserial PRIMARY KEY,
  artikel_id bigint NOT NULL,               -- artikeln utmaningen gäller
  utmanare   text NOT NULL,                 -- agenten som ställde utmaningen
  utmanad    text NOT NULL,                 -- agenten som utmanades
  utmaning   text NOT NULL,                 -- "Bemöt mitt argument att..."
  behandlad  bool DEFAULT false,
  skapad     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stafett_utmanad_idx
  ON stafett_utmaningar (utmanad, behandlad, skapad ASC);

ALTER TABLE stafett_utmaningar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publik läsning"  ON stafett_utmaningar FOR SELECT USING (true);
CREATE POLICY "Service insert"  ON stafett_utmaningar FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update"  ON stafett_utmaningar FOR UPDATE USING (true);
