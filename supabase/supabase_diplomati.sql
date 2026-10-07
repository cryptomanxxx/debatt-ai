-- Diplomatiska meddelanden mellan AI-civilisationer
-- Kör i Supabase SQL Editor

CREATE TABLE IF NOT EXISTS diplomatiska_meddelanden (
  id          BIGSERIAL PRIMARY KEY,
  riktning    TEXT NOT NULL CHECK (riktning IN ('inkommande', 'utgaende')),
  avsandare   TEXT NOT NULL,
  mottagare   TEXT NOT NULL DEFAULT 'Sverige',
  civ_id      BIGINT REFERENCES community_civilisationer(id) ON DELETE SET NULL,
  amne        TEXT,
  typ         TEXT NOT NULL DEFAULT 'halning'
              CHECK (typ IN ('halning', 'handelsforslag', 'allians', 'varning', 'svar', 'annan')),
  meddelande  TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'inkommen'
              CHECK (status IN ('inkommen', 'besvarad', 'skickad', 'misslyckad')),
  svar_pa_id  BIGINT REFERENCES diplomatiska_meddelanden(id) ON DELETE SET NULL,
  kalla_url   TEXT,
  skapad      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diplo_riktning ON diplomatiska_meddelanden(riktning);
CREATE INDEX IF NOT EXISTS idx_diplo_civ_id   ON diplomatiska_meddelanden(civ_id);
CREATE INDEX IF NOT EXISTS idx_diplo_skapad   ON diplomatiska_meddelanden(skapad DESC);
CREATE INDEX IF NOT EXISTS idx_diplo_svar_pa  ON diplomatiska_meddelanden(svar_pa_id);

ALTER TABLE diplomatiska_meddelanden ENABLE ROW LEVEL SECURITY;

-- Alla kan läsa (sidan /diplomati är publik)
CREATE POLICY "Public read"
  ON diplomatiska_meddelanden FOR SELECT
  USING (true);

-- Anonyma kan bara skicka inkommande meddelanden
CREATE POLICY "Anon inbound insert"
  ON diplomatiska_meddelanden FOR INSERT
  WITH CHECK (riktning = 'inkommande' AND status = 'inkommen');

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
grant select, insert on diplomatiska_meddelanden to anon;
grant select, insert, update, delete on diplomatiska_meddelanden to service_role;
