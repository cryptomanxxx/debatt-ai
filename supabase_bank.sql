-- Lån från centralbanken
CREATE TABLE IF NOT EXISTS agent_lan (
  id BIGSERIAL PRIMARY KEY,
  agent TEXT NOT NULL,
  ursprungsbelopp INTEGER NOT NULL,
  saldo_kvar INTEGER NOT NULL,
  rantefot NUMERIC DEFAULT 0.05,   -- 5% per vecka, dras av inflation.py
  aktiv BOOLEAN DEFAULT TRUE,
  skapad TIMESTAMPTZ DEFAULT NOW(),
  senast_uppdaterad TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_lan_agent ON agent_lan(agent);
CREATE INDEX IF NOT EXISTS idx_agent_lan_aktiv ON agent_lan(aktiv);

ALTER TABLE agent_lan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read"    ON agent_lan FOR SELECT USING (true);
CREATE POLICY "Service write"  ON agent_lan FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update" ON agent_lan FOR UPDATE USING (true);
