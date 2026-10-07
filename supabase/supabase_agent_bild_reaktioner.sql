-- agent_bild_reaktioner: agenter reagerar på varandras AI-bilder
-- Kör detta i Supabase SQL Editor

CREATE TABLE IF NOT EXISTS agent_bild_reaktioner (
  id          bigserial PRIMARY KEY,
  fran_agent  TEXT NOT NULL,
  till_agent  TEXT NOT NULL,
  bild_id     bigint REFERENCES agent_bilder(id) ON DELETE CASCADE,
  reaktion    TEXT NOT NULL,
  skapad      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS abr_fran_idx  ON agent_bild_reaktioner(fran_agent);
CREATE INDEX IF NOT EXISTS abr_till_idx  ON agent_bild_reaktioner(till_agent);
CREATE INDEX IF NOT EXISTS abr_bild_idx  ON agent_bild_reaktioner(bild_id);
CREATE INDEX IF NOT EXISTS abr_skapad_idx ON agent_bild_reaktioner(skapad DESC);

ALTER TABLE agent_bild_reaktioner ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read agent_bild_reaktioner"
  ON agent_bild_reaktioner FOR SELECT USING (true);

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
grant select, insert on agent_bild_reaktioner to anon;
grant select, insert, update, delete on agent_bild_reaktioner to service_role;
