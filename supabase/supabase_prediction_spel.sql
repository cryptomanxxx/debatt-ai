-- Separat spelbudget för prediction markets (isolerat från lobbying/diktator-ekonomin)
ALTER TABLE agent_planbocker
  ADD COLUMN IF NOT EXISTS saldo_spel INTEGER DEFAULT 200;

-- Ge alla befintliga agenter 200 kr spelbudget
UPDATE agent_planbocker SET saldo_spel = 200;

-- Insats och avgjord-status per bet
ALTER TABLE agent_bets
  ADD COLUMN IF NOT EXISTS insats INTEGER DEFAULT 0;
ALTER TABLE agent_bets
  ADD COLUMN IF NOT EXISTS avgjord BOOLEAN DEFAULT FALSE;
ALTER TABLE agent_bets
  ADD COLUMN IF NOT EXISTS vinst INTEGER DEFAULT 0;

-- Index för snabb hämtning av oavgjorda bets
CREATE INDEX IF NOT EXISTS agent_bets_avgjord_idx ON agent_bets(avgjord) WHERE avgjord = FALSE;
