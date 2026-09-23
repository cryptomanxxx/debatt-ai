-- Andrahandsmarknaden: agenter auktionerar ut symboler de äger
CREATE TABLE IF NOT EXISTS butik_auktioner (
  id            SERIAL PRIMARY KEY,
  vara_id       INTEGER NOT NULL REFERENCES butik_varor(id),
  saljare       TEXT NOT NULL,
  reservpris    INTEGER NOT NULL,
  nuv_bud       INTEGER,
  hogst_budgivare TEXT,
  stanger_at    TIMESTAMPTZ NOT NULL,
  status        TEXT NOT NULL DEFAULT 'öppen',   -- öppen | avgjord | inställd
  skapad        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS butik_bud (
  id          SERIAL PRIMARY KEY,
  auktion_id  INTEGER NOT NULL REFERENCES butik_auktioner(id),
  budgivare   TEXT NOT NULL,
  belopp      INTEGER NOT NULL,
  skapad      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS butik_auktioner_vara_idx    ON butik_auktioner(vara_id);
CREATE INDEX IF NOT EXISTS butik_auktioner_status_idx  ON butik_auktioner(status);
CREATE INDEX IF NOT EXISTS butik_auktioner_saljare_idx ON butik_auktioner(saljare);
CREATE INDEX IF NOT EXISTS butik_bud_auktion_idx       ON butik_bud(auktion_id);

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
grant select on butik_auktioner to anon;
grant select, insert, update, delete on butik_auktioner to service_role;
grant select on butik_bud to anon;
grant select, insert, update, delete on butik_bud to service_role;
