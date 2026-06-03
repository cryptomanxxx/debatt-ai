-- Community civilisationer
CREATE TABLE community_civilisationer (
  id bigserial PRIMARY KEY,
  namn text NOT NULL,
  land text NOT NULL,
  flagga text,
  github_url text,
  hemsida_url text,
  beskrivning text,
  kontakt_email text,
  status text DEFAULT 'aktiv',
  verifierad bool DEFAULT false,
  skapad timestamptz DEFAULT now()
);

ALTER TABLE community_civilisationer ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON community_civilisationer FOR SELECT USING (status = 'aktiv');
CREATE POLICY "Anon insert" ON community_civilisationer FOR INSERT WITH CHECK (status = 'pending' AND verifierad = false);
