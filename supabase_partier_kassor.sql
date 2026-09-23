-- supabase_partier_kassor.sql
-- Partiernas kassor och transaktionslogg.
-- Kör i Supabase SQL Editor.

-- ── Partikassor ──────────────────────────────────────────────────────────────
-- En rad per parti. Continuity-nyckel: ledare (UNIQUE).
-- Vid re-klustring av partier: om ledaren återkommer bevaras saldot.
CREATE TABLE IF NOT EXISTS parti_kassor (
  id                  BIGSERIAL PRIMARY KEY,
  parti_namn          TEXT NOT NULL,
  ledare              TEXT NOT NULL UNIQUE,
  saldo               INTEGER NOT NULL DEFAULT 0 CHECK (saldo >= 0),
  senast_stipendium   TIMESTAMPTZ,
  senast_valkampanj   TIMESTAMPTZ,
  senast_motion       TIMESTAMPTZ,
  skapad              TIMESTAMPTZ NOT NULL DEFAULT now(),
  uppdaterad          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parti_kassor_ledare ON parti_kassor(ledare);

ALTER TABLE parti_kassor ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publik läsning parti_kassor"  ON parti_kassor FOR SELECT USING (true);
CREATE POLICY "Service insert parti_kassor"  ON parti_kassor FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update parti_kassor"  ON parti_kassor FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Service delete parti_kassor"  ON parti_kassor FOR DELETE USING (true);

-- ── Partiutgifter (transaktionslogg) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parti_utgifter (
  id              BIGSERIAL PRIMARY KEY,
  parti_namn      TEXT NOT NULL,
  ledare          TEXT NOT NULL,
  typ             TEXT NOT NULL CHECK (typ IN ('partistod', 'stipendium', 'valkampanj', 'motionsfinansiering')),
  belopp          INTEGER NOT NULL,        -- positivt = inkomst, negativt = utgift
  mottagare       TEXT,                    -- agentnamn vid stipendium
  lagforslag_id   BIGINT,
  kampanj_bonus   NUMERIC(5,2),
  beskrivning     TEXT,
  skapad          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parti_utgifter_parti      ON parti_utgifter(parti_namn, skapad DESC);
CREATE INDEX IF NOT EXISTS idx_parti_utgifter_typ        ON parti_utgifter(typ);
CREATE INDEX IF NOT EXISTS idx_parti_utgifter_lagforslag ON parti_utgifter(lagforslag_id);

ALTER TABLE parti_utgifter ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publik läsning parti_utgifter"  ON parti_utgifter FOR SELECT USING (true);
CREATE POLICY "Service insert parti_utgifter"  ON parti_utgifter FOR INSERT WITH CHECK (true);

-- ── Lägg till partibackat-kolumn på lagforslag ────────────────────────────────
-- Märker ett lagförslag som officiellt backat av ett parti.
-- Partimedlemmar röstar ja med ~100% sannolikhet på partibackade motioner.
ALTER TABLE lagforslag ADD COLUMN IF NOT EXISTS partibackat TEXT;
CREATE INDEX IF NOT EXISTS idx_lagforslag_partibackat
  ON lagforslag(partibackat) WHERE partibackat IS NOT NULL;

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
grant select, insert, update, delete on parti_kassor to anon;
grant select, insert, update, delete on parti_kassor to service_role;
grant select, insert on parti_utgifter to anon;
grant select, insert, update, delete on parti_utgifter to service_role;
