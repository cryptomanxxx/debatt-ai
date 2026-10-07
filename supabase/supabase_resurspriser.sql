-- Resurspriser: dynamisk prismodell per zontyp
-- En rad per zontyp, upsert:as dagligen av mark_test.py
-- Pris-multiplikatorn styr zonsinkomsten: hög ägartäthet → lägre pris, låg → högre

CREATE TABLE IF NOT EXISTS resurspriser (
  typ             TEXT PRIMARY KEY,
  bas_pris        NUMERIC NOT NULL DEFAULT 100,
  pris_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  antal_agda      INTEGER NOT NULL DEFAULT 0,
  antal_totala    INTEGER NOT NULL DEFAULT 0,
  trend           TEXT    NOT NULL DEFAULT 'stabil',
  uppdaterad      TIMESTAMPTZ DEFAULT NOW()
);

-- Initial seed med baspriser per zontyp (kr)
INSERT INTO resurspriser (typ, bas_pris, antal_totala) VALUES
  ('energi',   200, 5),
  ('jordbruk', 150, 6),
  ('industri', 250, 5),
  ('gruva',    300, 4),
  ('stad',     180, 6),
  ('kust',     120, 5),
  ('skog',     100, 4)
ON CONFLICT (typ) DO NOTHING;

-- RLS: publik läsning + skrivning (mark_test.py upsertar dagligen via anon-nyckeln)
ALTER TABLE resurspriser ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publik läsning resurspriser" ON resurspriser FOR SELECT USING (true);
CREATE POLICY "Publik insert resurspriser" ON resurspriser FOR INSERT WITH CHECK (true);
CREATE POLICY "Publik update resurspriser" ON resurspriser FOR UPDATE USING (true);

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
grant select, insert, update on resurspriser to anon;
grant select, insert, update, delete on resurspriser to service_role;
