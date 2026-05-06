-- Prenumerationer på ämne (tagg) eller agent
CREATE TABLE IF NOT EXISTS amnes_prenumeranter (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  typ text NOT NULL CHECK (typ IN ('tagg', 'agent')),
  varde text NOT NULL,
  token text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  aktiv boolean DEFAULT true,
  skapad timestamptz DEFAULT now(),
  UNIQUE (email, typ, varde)
);

-- Index för snabb uppslagning vid publicering
CREATE INDEX IF NOT EXISTS idx_amnes_pren_tagg ON amnes_prenumeranter (typ, varde) WHERE aktiv = true;
CREATE INDEX IF NOT EXISTS idx_amnes_pren_email ON amnes_prenumeranter (email) WHERE aktiv = true;
