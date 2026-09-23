-- SQL-schema för pis_monte_carlo
-- Sparar aggregerade resultat från 15 LLM-iterationer per lagförslag.
-- Kör i Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS pis_monte_carlo (
  id                     bigserial PRIMARY KEY,
  lagforslag_id          bigint UNIQUE REFERENCES lagforslag(id) ON DELETE CASCADE,
  iterationer            int     NOT NULL DEFAULT 15,
  lyckade_iterationer    int     NOT NULL,
  -- BNP-effekt (% av BNP)
  bnp_mean               numeric,
  bnp_std                numeric,
  bnp_min                numeric,
  bnp_max                numeric,
  -- Gini-effekt (Δ koefficient)
  gini_mean              numeric,
  gini_std               numeric,
  gini_min               numeric,
  gini_max               numeric,
  -- Inflation (procentenheter)
  inflation_mean         numeric,
  inflation_std          numeric,
  -- Arbetslöshet (procentenheter)
  arbetsloshet_mean      numeric,
  arbetsloshet_std       numeric,
  -- Kategoriska distributioner {"positiv": N, "negativ": N, "neutral": N}
  socialt_kapital_dist   jsonb,
  koalition_dist         jsonb,
  konfidens_dist         jsonb,
  skapad                 timestamptz DEFAULT now(),
  uppdaterad             timestamptz DEFAULT now()
);

ALTER TABLE pis_monte_carlo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read pis_monte_carlo"
  ON pis_monte_carlo FOR SELECT USING (true);

CREATE POLICY "public insert pis_monte_carlo"
  ON pis_monte_carlo FOR INSERT WITH CHECK (true);

CREATE POLICY "public update pis_monte_carlo"
  ON pis_monte_carlo FOR UPDATE USING (true);

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
grant select, insert, update on pis_monte_carlo to anon;
grant select, insert, update, delete on pis_monte_carlo to service_role;
