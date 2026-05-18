-- Agentdagbok: interna reflektioner efter varje publicerad artikel
CREATE TABLE IF NOT EXISTS agent_dagbok (
  id        bigserial primary key,
  agent     text not null,
  artikel_id bigint references artiklar(id) on delete set null,
  rubrik    text,
  reflektion text not null,
  ar_replik boolean default false,
  skapad    timestamptz default now()
);

CREATE INDEX IF NOT EXISTS agent_dagbok_agent_idx ON agent_dagbok(agent, skapad desc);

-- RLS: publik läsning med anon-nyckel
ALTER TABLE agent_dagbok ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publik läsning" ON agent_dagbok FOR SELECT USING (true);
CREATE POLICY "Service insert" ON agent_dagbok FOR INSERT WITH CHECK (true);
