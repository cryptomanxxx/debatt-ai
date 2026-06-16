-- Visdomsspelet (Wisdom-of-Crowds Game) — mäter kollektiv intelligens hos AI-agenterna
-- Inspirerat av Galton/Surowiecki "wisdom of crowds", Page's diversity prediction theorem
-- och Lorenz et al. 2011 (PNAS) om hur social påverkan kan undergräva crowd wisdom.
-- Kör i Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS ki_spel (
  id                                bigserial PRIMARY KEY,
  fraga                             text NOT NULL,
  enhet                             text,
  facit                             numeric NOT NULL,
  lage                              text NOT NULL CHECK (lage IN ('oberoende', 'sekventiellt', 'deliberativt')),
  agent_svar                        jsonb NOT NULL DEFAULT '[]'::jsonb,
  kollektivt_estimat                numeric,
  kollektivt_fel                    numeric,
  genomsnittligt_individuellt_fel   numeric,
  bast_individuellt_fel             numeric,
  diversitet                        numeric,
  overkonfidens                     numeric,
  crowd_vinner                      boolean,
  antal_agenter                     integer,
  skapad                            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ki_spel_skapad_idx ON ki_spel (skapad DESC);
CREATE INDEX IF NOT EXISTS ki_spel_lage_idx ON ki_spel (lage);

ALTER TABLE ki_spel ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Publik läsning ki_spel" ON ki_spel;
CREATE POLICY "Publik läsning ki_spel" ON ki_spel FOR SELECT USING (true);

DROP POLICY IF EXISTS "Publik insert ki_spel" ON ki_spel;
CREATE POLICY "Publik insert ki_spel" ON ki_spel FOR INSERT WITH CHECK (true);
