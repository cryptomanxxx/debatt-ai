CREATE TABLE IF NOT EXISTS rykten (
  id              bigserial PRIMARY KEY,
  innehall        TEXT      NOT NULL,
  om_agent        TEXT      NOT NULL,
  ursprung_agent  TEXT      NOT NULL,
  sanning         BOOL      NOT NULL DEFAULT false,
  kanda_av        TEXT[]    DEFAULT '{}',
  antal_spridningar INT     DEFAULT 0,
  skapad          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rykte_spridningar (
  id          bigserial PRIMARY KEY,
  rykte_id    BIGINT REFERENCES rykten(id) ON DELETE CASCADE,
  fran_agent  TEXT NOT NULL,
  till_agent  TEXT NOT NULL,
  skapad      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE rykten             ENABLE ROW LEVEL SECURITY;
ALTER TABLE rykte_spridningar  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read rykten"    ON rykten            FOR SELECT USING (true);
CREATE POLICY "public insert rykten"  ON rykten            FOR INSERT WITH CHECK (true);
CREATE POLICY "public update rykten"  ON rykten            FOR UPDATE USING (true);
CREATE POLICY "public read spridn"    ON rykte_spridningar FOR SELECT USING (true);
CREATE POLICY "public insert spridn"  ON rykte_spridningar FOR INSERT WITH CHECK (true);
