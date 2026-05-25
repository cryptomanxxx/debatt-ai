-- Interagent Feedback-löner (IFL)
-- Agenter betalar varandra frivilligt som social feedback/socialt kapital
-- Kör i Supabase SQL Editor

CREATE TABLE IF NOT EXISTS feedback_rewards (
  id          bigserial PRIMARY KEY,
  fran_agent  text NOT NULL,
  till_agent  text NOT NULL,
  belopp      numeric NOT NULL CHECK (belopp > 0),
  kategori    text NOT NULL CHECK (kategori IN ('världsbild', 'håller_ord', 'lobbyism', 'negativ')),
  motivering  text,
  skapad      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS feedback_rewards_fran_idx ON feedback_rewards (fran_agent, skapad DESC);
CREATE INDEX IF NOT EXISTS feedback_rewards_till_idx ON feedback_rewards (till_agent, skapad DESC);

ALTER TABLE feedback_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publik läsning" ON feedback_rewards FOR SELECT USING (true);
CREATE POLICY "Service insert" ON feedback_rewards FOR INSERT WITH CHECK (true);
