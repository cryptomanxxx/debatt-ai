-- supabase_crse.sql – Corruption & Rent-Seeking Engine (CRSE)
-- Kör i Supabase SQL Editor.

-- bribe_offers: hemliga mutor — skilda från offentliga lobbying_log
-- Beloppen överstiger konstitutionens §1-tak (45 kr) eftersom de är informella
CREATE TABLE IF NOT EXISTS bribe_offers (
  id            BIGSERIAL PRIMARY KEY,
  giver_agent   TEXT NOT NULL,
  receiver_agent TEXT NOT NULL,
  lagforslag_id  BIGINT REFERENCES lagforslag(id) ON DELETE SET NULL,
  amount_kr      INTEGER NOT NULL CHECK (amount_kr > 0),
  resultat       TEXT CHECK (resultat IN ('accepterat', 'avvisat')),
  skapad         TIMESTAMPTZ DEFAULT NOW()
);

-- bribe_scores: aggregerat per agent och kalenderår
CREATE TABLE IF NOT EXISTS bribe_scores (
  id               BIGSERIAL PRIMARY KEY,
  agent            TEXT NOT NULL,
  period           TEXT NOT NULL,           -- t.ex. '2026'
  total_bribe_kr   INTEGER DEFAULT 0,       -- totalt mottaget i mutor
  antal_mottagna   INTEGER DEFAULT 0,
  total_givet_kr   INTEGER DEFAULT 0,       -- totalt givet i mutor
  antal_givna      INTEGER DEFAULT 0,
  uppdaterad       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent, period)
);

-- corruption_badges: aktiva korruptionsmärken efter §5-dom
CREATE TABLE IF NOT EXISTS corruption_badges (
  id                   BIGSERIAL PRIMARY KEY,
  agent                TEXT NOT NULL UNIQUE,
  domstol_arende_id    BIGINT,
  artikel_score_malus  NUMERIC DEFAULT 0.9,   -- minskar AI-editörens betyg med 10%
  aktiv                BOOLEAN DEFAULT TRUE,
  expires_at           TIMESTAMPTZ,
  skapad               TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE bribe_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_bribe_offers" ON bribe_offers FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_bribe_offers" ON bribe_offers FOR INSERT TO anon WITH CHECK (true);

ALTER TABLE bribe_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_bribe_scores" ON bribe_scores FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_bribe_scores" ON bribe_scores FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_bribe_scores" ON bribe_scores FOR UPDATE TO anon USING (true);

ALTER TABLE corruption_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_corruption_badges" ON corruption_badges FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_corruption_badges" ON corruption_badges FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_corruption_badges" ON corruption_badges FOR UPDATE TO anon USING (true);
