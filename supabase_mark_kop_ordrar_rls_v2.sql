-- supabase_mark_kop_ordrar_rls_v2.sql
-- Begränsar INSERT-policy på mark_kop_ordrar så att bara besökare kan lägga
-- köpordrar via anon-nyckel, och reserverat_kr måste vara positivt.
-- Kör denna i Supabase SQL Editor efter supabase_mark_kop_ordrar.sql.

DROP POLICY IF EXISTS "Public insert mark_kop_ordrar" ON mark_kop_ordrar;

CREATE POLICY "Public insert mark_kop_ordrar"
  ON mark_kop_ordrar FOR INSERT
  WITH CHECK (
    kop_typ = 'besokare'
    AND reserverat_kr > 0
    AND kop_agent LIKE 'Besökare-%'
  );
