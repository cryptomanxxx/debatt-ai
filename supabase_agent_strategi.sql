-- INSERT-policies för agent_strategi
-- UPDATE-policyn är avsiktligt begränsad till service role för att förhindra
-- att den publikt exponerade anon-nyckeln kan skriva om agenternas strategitext.

CREATE TABLE IF NOT EXISTS agent_strategi (
  agent        TEXT PRIMARY KEY,
  strategi_text TEXT NOT NULL DEFAULT '',
  generation   INTEGER NOT NULL DEFAULT 0,
  uppdaterad   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Publik läsning (anon-nyckeln räcker)
ALTER TABLE agent_strategi ENABLE ROW LEVEL SECURITY;

-- Rensa gamla permissiva policies om de finns (idempotent re-körning)
DROP POLICY IF EXISTS "Anon update agent_strategi" ON agent_strategi;
DROP POLICY IF EXISTS "Anon insert/update agent_strategi" ON agent_strategi;

CREATE POLICY "Publik läsning agent_strategi"
  ON agent_strategi FOR SELECT
  USING (true);

-- INSERT tillåts för anon (GitHub Actions-körningar använder anon-nyckeln)
CREATE POLICY "Anon insert agent_strategi"
  ON agent_strategi FOR INSERT
  WITH CHECK (true);

-- UPDATE kräver service role — anon-nyckeln är publikt exponerad och får inte
-- kunna skriva om strategitext som injiceras i agenternas systemprompts
CREATE POLICY "Service role update agent_strategi"
  ON agent_strategi FOR UPDATE
  USING (auth.role() = 'service_role');
