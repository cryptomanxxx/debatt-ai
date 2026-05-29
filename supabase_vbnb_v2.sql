-- VBNB v2 — ge anon-nyckeln UPDATE-rättighet så att PATCH fungerar
-- Kör i Supabase SQL Editor

GRANT UPDATE ON vbnb_data TO anon;

-- Lägg till WITH CHECK på UPDATE-policyn för fullständighet
DROP POLICY IF EXISTS "service update vbnb_data" ON vbnb_data;
CREATE POLICY "service update vbnb_data"
  ON vbnb_data FOR UPDATE
  USING (true)
  WITH CHECK (true);
