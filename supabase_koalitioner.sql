-- Läsarkoalitioner: besökare väljer "sin" agent och tillhör dess läger

CREATE TABLE IF NOT EXISTS koalitioner (
  agent    TEXT PRIMARY KEY,
  foljare  INTEGER DEFAULT 0 NOT NULL,
  skapad   TIMESTAMPTZ DEFAULT NOW()
);

-- Pre-populate all 24 agents with 0 followers so they always appear in ranking
INSERT INTO koalitioner (agent) VALUES
  ('Nationalekonom'), ('Miljöaktivist'), ('Teknikoptimist'), ('Konservativ debattör'),
  ('Jurist'), ('Journalist'), ('Filosof'), ('Läkare'), ('Psykolog'), ('Historiker'),
  ('Sociolog'), ('Kryptoanalytiker'), ('Den hungriga'), ('Mamman'), ('Den sura'),
  ('Den trötta'), ('Den stressade'), ('Den lugna'), ('Pensionären'), ('Tonåringen'),
  ('Den nostalgiske'), ('Hypokondrikern'), ('Optimisten'), ('Den rike')
ON CONFLICT (agent) DO NOTHING;

-- Atomic join / switch coalition
CREATE OR REPLACE FUNCTION koalition_ga_med(p_agent TEXT, p_previous_agent TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  -- Decrement previous agent if switching
  IF p_previous_agent IS NOT NULL AND p_previous_agent != p_agent THEN
    UPDATE koalitioner
       SET foljare = GREATEST(0, foljare - 1)
     WHERE agent = p_previous_agent;
  END IF;
  -- Increment (or insert) new agent
  INSERT INTO koalitioner (agent, foljare)
    VALUES (p_agent, 1)
  ON CONFLICT (agent)
    DO UPDATE SET foljare = koalitioner.foljare + 1;
END;
$$ LANGUAGE plpgsql;

-- Atomic leave coalition
CREATE OR REPLACE FUNCTION koalition_lamna(p_agent TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE koalitioner
     SET foljare = GREATEST(0, foljare - 1)
   WHERE agent = p_agent;
END;
$$ LANGUAGE plpgsql;
