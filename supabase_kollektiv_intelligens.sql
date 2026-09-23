-- Visdomsspelet (Wisdom-of-Crowds Game) — mäter kollektiv intelligens hos AI-agenterna
-- Inspirerat av Galton/Surowiecki "wisdom of crowds", Page's diversity prediction theorem
-- och Lorenz et al. 2011 (PNAS) om hur social påverkan kan undergräva crowd wisdom.
-- Kör i Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS ki_spel (
  id                                bigserial PRIMARY KEY,
  fraga                             text NOT NULL,
  enhet                             text,
  facit                             numeric NOT NULL,
  lage                              text NOT NULL CHECK (lage IN ('oberoende', 'sekventiellt', 'deliberativt')),
  agent_svar                        jsonb NOT NULL DEFAULT '[]'::jsonb,
  kollektivt_estimat                numeric,
  kollektivt_fel                    numeric,
  genomsnittligt_individuellt_fel   numeric,
  bast_individuellt_fel             numeric,
  diversitet                        numeric,
  overkonfidens                     numeric,
  crowd_vinner                      boolean,
  antal_agenter                     integer,
  skapad                            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ki_spel_skapad_idx ON ki_spel (skapad DESC);
CREATE INDEX IF NOT EXISTS ki_spel_lage_idx ON ki_spel (lage);

ALTER TABLE ki_spel ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Publik läsning ki_spel" ON ki_spel;
CREATE POLICY "Publik läsning ki_spel" ON ki_spel FOR SELECT USING (true);

DROP POLICY IF EXISTS "Publik insert ki_spel" ON ki_spel;
CREATE POLICY "Publik insert ki_spel" ON ki_spel FOR INSERT WITH CHECK (true);

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
grant select, insert on ki_spel to anon;
grant select, insert, update, delete on ki_spel to service_role;
