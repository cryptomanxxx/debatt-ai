-- Migrering: lägg till INSERT och UPDATE policies på pis_monte_carlo
-- Kör i Supabase SQL Editor om tabellen redan existerar.
-- Utan dessa policies blockeras skrivningar från anon-nyckeln (GitHub Actions).
-- OBS: CREATE POLICY stöder inte IF NOT EXISTS — använd DO-block istället.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'pis_monte_carlo'
      AND policyname = 'public insert pis_monte_carlo'
  ) THEN
    CREATE POLICY "public insert pis_monte_carlo"
      ON pis_monte_carlo FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'pis_monte_carlo'
      AND policyname = 'public update pis_monte_carlo'
  ) THEN
    CREATE POLICY "public update pis_monte_carlo"
      ON pis_monte_carlo FOR UPDATE USING (true);
  END IF;
END $$;
