-- Migrering: lägg till INSERT och UPDATE policies på pis_monte_carlo
-- Kör i Supabase SQL Editor om tabellen redan existerar.
-- Utan dessa policies blockeras skrivningar från anon-nyckeln (GitHub Actions).

CREATE POLICY IF NOT EXISTS "public insert pis_monte_carlo"
  ON pis_monte_carlo FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "public update pis_monte_carlo"
  ON pis_monte_carlo FOR UPDATE USING (true);
