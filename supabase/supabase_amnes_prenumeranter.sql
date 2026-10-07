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

-- Data API-grants (Supabase-krav från 30 okt 2026 — se CLAUDE.md): nya
-- tabeller i public-schemat behöver explicita GRANT-satser för att vara
-- nåbara via Data API (PostgREST/supabase-js) efter det datumet, annars
-- "permission denied" trots korrekta RLS-policies — Supabase slutar
-- auto-bevilja grundrättigheter på nya tabeller från och med då. GRANT
-- och RLS är två separata lager: GRANT avgör om ett anrop överhuvudtaget
-- tillåts nå tabellen, RLS-policies avgör sedan vilka RADER som är
-- synliga/skrivbara. anon beviljas här exakt de operationer som
-- tabellens egna RLS-policies redan tillåter (ingen ändring av
-- säkerhetsmodellen — bara att göra det GRANT auto-gav tidigare
-- explicit) — service_role beviljas alltid full CRUD, eftersom BYPASSRLS
-- bara kringgår radpolicies, inte detta grundläggande GRANT-lager.
-- Ingen grant till authenticated: plattformen har ingen Supabase Auth /
-- inloggade användare, så rollen är aldrig i bruk här.
grant select, insert, update, delete on amnes_prenumeranter to service_role;
