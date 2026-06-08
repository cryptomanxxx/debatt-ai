-- supabase_mark_handel.sql
-- Varuproduktion och handel: agenter producerar varor från sina zoner och säljer till varandra.
-- Kör i Supabase SQL Editor.

-- Agenternas varulager (vad varje agent har producerat)
CREATE TABLE IF NOT EXISTS mark_lager (
  id        bigint generated always as identity primary key,
  agent     text not null,
  vara      text not null,  -- el, spannmål, maskiner, malm, tjänster, fisk, virke
  antal     integer not null default 0,
  uppdaterad timestamptz not null default now(),
  UNIQUE(agent, vara)
);

-- Handelstransaktioner mellan agenter
CREATE TABLE IF NOT EXISTS mark_handel_log (
  id             bigint generated always as identity primary key,
  kop_agent      text not null,
  salj_agent     text not null,
  vara           text not null,
  antal          integer not null,
  pris_per_enhet numeric(8,2) not null,
  totalt         numeric(8,2) not null,
  skapad         timestamptz not null default now()
);

-- Index
CREATE INDEX IF NOT EXISTS mark_lager_agent_idx ON mark_lager (agent);
CREATE INDEX IF NOT EXISTS mark_handel_log_tid_idx ON mark_handel_log (skapad DESC);

-- RLS
ALTER TABLE mark_lager ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publik läsning mark_lager"    ON mark_lager FOR SELECT USING (true);
CREATE POLICY "Service insert mark_lager"    ON mark_lager FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update mark_lager"    ON mark_lager FOR UPDATE USING (true) WITH CHECK (true);

ALTER TABLE mark_handel_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publik läsning mark_handel_log" ON mark_handel_log FOR SELECT USING (true);
CREATE POLICY "Service insert mark_handel_log" ON mark_handel_log FOR INSERT WITH CHECK (true);
