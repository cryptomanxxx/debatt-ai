-- INSERT-policies för agent_bilder och agent_bild_reaktioner
-- Kör detta i Supabase SQL Editor om bilderna inte sparas (anon-nyckeln nekas INSERT)

CREATE POLICY "Anon insert agent_bilder"
  ON agent_bilder FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anon insert agent_bild_reaktioner"
  ON agent_bild_reaktioner FOR INSERT
  WITH CHECK (true);
