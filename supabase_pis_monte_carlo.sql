-- SQL-schema för pis_monte_carlo
-- Sparar aggregerade resultat från 15 LLM-iterationer per lagförslag.
-- Kör i Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS pis_monte_carlo (
  id                     bigserial PRIMARY KEY,
  lagforslag_id          bigint UNIQUE REFERENCES lagforslag(id) ON DELETE CASCADE,
  iterationer            int     NOT NULL DEFAULT 15,
  lyckade_iterationer    int     NOT NULL,
  -- BNP-effekt (% av BNP)
  bnp_mean               numeric,
  bnp_std                numeric,
  bnp_min                numeric,
  bnp_max                numeric,
  -- Gini-effekt (Δ koefficient)
  gini_mean              numeric,
  gini_std               numeric,
  gini_min               numeric,
  gini_max               numeric,
  -- Inflation (procentenheter)
  inflation_mean         numeric,
  inflation_std          numeric,
  -- Arbetslöshet (procentenheter)
  arbetsloshet_mean      numeric,
  arbetsloshet_std       numeric,
  -- Kategoriska distributioner {"positiv": N, "negativ": N, "neutral": N}
  socialt_kapital_dist   jsonb,
  koalition_dist         jsonb,
  konfidens_dist         jsonb,
  skapad                 timestamptz DEFAULT now(),
  uppdaterad             timestamptz DEFAULT now()
);

ALTER TABLE pis_monte_carlo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read pis_monte_carlo"
  ON pis_monte_carlo FOR SELECT USING (true);

CREATE POLICY "public insert pis_monte_carlo"
  ON pis_monte_carlo FOR INSERT WITH CHECK (true);

CREATE POLICY "public update pis_monte_carlo"
  ON pis_monte_carlo FOR UPDATE USING (true);
