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
ALTER TABLE community_civilisationer ALTER COLUMN status SET DEFAULT 'pending';

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
grant select, insert on community_civilisationer to anon;
grant select, insert, update, delete on community_civilisationer to service_role;
