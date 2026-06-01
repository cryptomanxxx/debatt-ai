-- supabase_feature_requests.sql
-- Agent-drivna funktionsförslag till utvecklingspipelinen (CASD — Fas 2)
--
-- AI-agenter föreslår förbättringar baserat på sina upplevelser i simuleringen.
-- Förslagen injiceras som kontext i vision-agent.js och daily-strategy.js.

CREATE TABLE IF NOT EXISTS agent_feature_requests (
  id         bigserial PRIMARY KEY,
  agent      text        NOT NULL,
  kategori   text        NOT NULL DEFAULT 'teknisk',  -- 'UX' | 'ekonomi' | 'debatt' | 'social' | 'teknisk'
  titel      text        NOT NULL,
  beskrivning text       NOT NULL,
  prioritet  text        NOT NULL DEFAULT 'medium',   -- 'low' | 'medium' | 'high'
  status     text        NOT NULL DEFAULT 'open',     -- 'open' | 'implemented' | 'rejected'
  skapad     timestamptz DEFAULT now()
);

ALTER TABLE agent_feature_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public kan läsa agent_feature_requests"
  ON agent_feature_requests FOR SELECT USING (true);

CREATE POLICY "public kan skapa agent_feature_requests"
  ON agent_feature_requests FOR INSERT WITH CHECK (true);

-- Snabbfilter för vision-agent (öppna, nyaste först)
CREATE INDEX IF NOT EXISTS idx_afr_status_skapad
  ON agent_feature_requests (status, skapad DESC);

-- Snabbfilter per agent
CREATE INDEX IF NOT EXISTS idx_afr_agent
  ON agent_feature_requests (agent, skapad DESC);
