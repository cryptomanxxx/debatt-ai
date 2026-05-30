-- Constitutional Evolution Module (CEM)
-- Agenter föreslår och röstar på ändringar av grundlagsparametrar.
-- Kräver att domstol_arenden / inflation.py tabeller finns.

-- Rörliga grundlagsparametrar
CREATE TABLE IF NOT EXISTS constitution_rules (
  id text PRIMARY KEY,
  namn text NOT NULL,
  varde numeric NOT NULL,
  min_varde numeric NOT NULL,
  max_varde numeric NOT NULL,
  enhet text DEFAULT 'kr',
  beskrivning text,
  artikel_nr int,   -- koppling till domstolens artikel (nullable)
  senast_andrad timestamptz DEFAULT now()
);

-- Ändringsförslag
CREATE TABLE IF NOT EXISTS constitution_amendments (
  id bigserial PRIMARY KEY,
  regel_id text NOT NULL REFERENCES constitution_rules(id),
  foreslagen_av text NOT NULL DEFAULT 'System',
  gammalt_varde numeric NOT NULL,
  foreslagen_varde numeric NOT NULL,
  motivering text NOT NULL,
  status text NOT NULL DEFAULT 'öppen',  -- öppen | antagen | avvisad
  roster_for int DEFAULT 0,
  roster_mot int DEFAULT 0,
  maktindex_for numeric DEFAULT 0,
  maktindex_mot numeric DEFAULT 0,
  rostning_slutar timestamptz NOT NULL,
  skapad timestamptz DEFAULT now()
);

-- Agenternas röster per ändringsförslag
CREATE TABLE IF NOT EXISTS constitution_roster (
  id bigserial PRIMARY KEY,
  amendment_id bigint NOT NULL REFERENCES constitution_amendments(id),
  agent text NOT NULL,
  rod text NOT NULL CHECK (rod IN ('for', 'mot')),
  maktindex numeric NOT NULL DEFAULT 0,
  motivering text,
  skapad timestamptz DEFAULT now(),
  UNIQUE(amendment_id, agent)
);

-- RLS: publik läsning
ALTER TABLE constitution_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE constitution_amendments ENABLE ROW LEVEL SECURITY;
ALTER TABLE constitution_roster ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read constitution_rules"      ON constitution_rules      FOR SELECT USING (true);
CREATE POLICY "Public read constitution_amendments" ON constitution_amendments FOR SELECT USING (true);
CREATE POLICY "Public read constitution_roster"     ON constitution_roster     FOR SELECT USING (true);

CREATE POLICY "Service insert constitution_rules"      ON constitution_rules      FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update constitution_rules"      ON constitution_rules      FOR UPDATE USING (true);
CREATE POLICY "Service insert constitution_amendments" ON constitution_amendments FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update constitution_amendments" ON constitution_amendments FOR UPDATE USING (true);
CREATE POLICY "Service insert constitution_roster"     ON constitution_roster     FOR INSERT WITH CHECK (true);

-- Index för prestanda
CREATE INDEX IF NOT EXISTS idx_amendments_status   ON constitution_amendments(status);
CREATE INDEX IF NOT EXISTS idx_amendments_regel_id ON constitution_amendments(regel_id);
CREATE INDEX IF NOT EXISTS idx_roster_amendment    ON constitution_roster(amendment_id);
CREATE INDEX IF NOT EXISTS idx_roster_agent        ON constitution_roster(agent);

-- Startdata: de fem rörliga parametrarna
INSERT INTO constitution_rules (id, namn, varde, min_varde, max_varde, enhet, beskrivning, artikel_nr)
VALUES
  ('lobbying_cap',              'Lobbyingtak',              45,    10,  200, 'kr',     'Maxbelopp per accepterat lobbyingförsök. Brott straffas med 60 kr (§1)',      1),
  ('bet_cap_with_loan',         'Spekulationstak (lån)',    20,     5,  100, 'kr',     'Max prediction market-insats när agenten har aktivt lån. Böter 40 kr (§2)', 2),
  ('monopoly_koalition_styrka', 'Monopolgräns: koalition', 20,     5,  100, 'poäng',  'Koalitionsstyrkegräns för §4-övervakning (monopolisering av makt)',         4),
  ('monopoly_saldo',            'Monopolgräns: saldo',   1500,   500, 5000, 'kr',     'Saldogräns för §4-övervakning (monopolisering av makt)',                    4),
  ('voting_majority',           'Röstmajoritet (CEM)',   0.667,   0.5,  1.0, 'andel', 'Majoritetskrav (viktat maktindex) för att anta grundlagsändring',          null)
ON CONFLICT (id) DO NOTHING;
