-- AI-Ekonomi: plånböcker, spel och transaktioner
-- Diktatorspelet: Agent A delar 100 kr ur eget saldo med Agent B.
-- Ultimatumspelet: Agent A erbjuder, Agent B accepterar eller avvisar.
-- Startkapital: 1 000 krediter per agent. Nollsummespel på sikt.

CREATE TABLE IF NOT EXISTS agent_planbocker (
  agent            TEXT PRIMARY KEY,
  saldo            INTEGER NOT NULL DEFAULT 1000,
  totalt_givet     INTEGER NOT NULL DEFAULT 0,
  totalt_fatt      INTEGER NOT NULL DEFAULT 0,
  antal_spel       INTEGER NOT NULL DEFAULT 0,
  uppdaterad       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ekonomi_spel (
  id               BIGSERIAL PRIMARY KEY,
  typ              TEXT NOT NULL CHECK (typ IN ('diktatorn', 'ultimatum')),
  agent_a          TEXT NOT NULL,
  agent_b          TEXT NOT NULL,
  belopp_start     INTEGER NOT NULL DEFAULT 100,
  erbjudande       INTEGER,
  svar             TEXT CHECK (svar IN ('accepterat', 'avvisat')),
  motivering_a     TEXT,
  motivering_b     TEXT,
  skapad           TIMESTAMPTZ DEFAULT NOW(),
  avslutad         TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS agent_transaktioner (
  id               BIGSERIAL PRIMARY KEY,
  fran_agent       TEXT NOT NULL,
  till_agent       TEXT NOT NULL,
  belopp           INTEGER NOT NULL,
  typ              TEXT NOT NULL,
  spel_id          BIGINT REFERENCES ekonomi_spel(id),
  motivering       TEXT,
  skapad           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ekonomi_spel_agent_b_svar ON ekonomi_spel(agent_b, svar);
CREATE INDEX IF NOT EXISTS idx_agent_transaktioner_skapad ON agent_transaktioner(skapad DESC);

ALTER TABLE agent_planbocker    DISABLE ROW LEVEL SECURITY;
ALTER TABLE ekonomi_spel        DISABLE ROW LEVEL SECURITY;
ALTER TABLE agent_transaktioner DISABLE ROW LEVEL SECURITY;

-- Startkapital för alla 24 agenter
INSERT INTO agent_planbocker (agent, saldo) VALUES
  ('Nationalekonom', 1000), ('Miljöaktivist', 1000), ('Teknikoptimist', 1000),
  ('Konservativ debattör', 1000), ('Jurist', 1000), ('Journalist', 1000),
  ('Filosof', 1000), ('Läkare', 1000), ('Psykolog', 1000), ('Historiker', 1000),
  ('Sociolog', 1000), ('Kryptoanalytiker', 1000), ('Den hungriga', 1000),
  ('Mamman', 1000), ('Den sura', 1000), ('Den trötta', 1000),
  ('Den stressade', 1000), ('Den lugna', 1000), ('Pensionären', 1000),
  ('Tonåringen', 1000), ('Den nostalgiske', 1000), ('Hypokondrikern', 1000),
  ('Optimisten', 1000), ('Den rike', 1000)
ON CONFLICT DO NOTHING;
