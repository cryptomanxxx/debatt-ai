-- Riksdagsval: agenter kampanjar, besökare röstar, vinnaren får maktbonus
-- Kör detta i Supabase SQL Editor

CREATE TABLE IF NOT EXISTS riksdagsval (
  id           bigint generated always as identity primary key,
  status       text not null default 'aktiv'
               check (status in ('aktiv', 'avgjort')),
  partier      jsonb not null default '[]',  -- [{namn, ledare, manifesto, roster}]
  vinnare_parti  text,
  vinnare_ledare text,
  bonus_aktiv_till timestamptz,
  startad      timestamptz not null default now(),
  avgjord      timestamptz,
  skapad       timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS val_roster (
  id      bigint generated always as identity primary key,
  val_id  bigint references riksdagsval(id) on delete cascade,
  parti   text not null,
  ip_hash text not null,
  kalla   text not null default 'manniska',
  skapad  timestamptz not null default now(),
  UNIQUE(val_id, ip_hash)
);

-- Migrering: lägg till kalla på befintliga val_roster-tabeller (CREATE TABLE IF NOT EXISTS no-op:ar annars)
ALTER TABLE val_roster ADD COLUMN IF NOT EXISTS kalla text not null default 'manniska';

-- RLS
ALTER TABLE riksdagsval ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publik läsning val"    ON riksdagsval FOR SELECT USING (true);
CREATE POLICY "Service insert val"    ON riksdagsval FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update val"    ON riksdagsval FOR UPDATE USING (true) WITH CHECK (true);

ALTER TABLE val_roster ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publik läsning roster"  ON val_roster FOR SELECT USING (true);
CREATE POLICY "Service insert roster"  ON val_roster FOR INSERT WITH CHECK (true);

-- Index
CREATE INDEX IF NOT EXISTS riksdagsval_status_idx ON riksdagsval (status, skapad DESC);
CREATE INDEX IF NOT EXISTS val_roster_val_idx     ON val_roster (val_id, parti);

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
grant select, insert, update on riksdagsval to anon;
grant select, insert, update, delete on riksdagsval to service_role;
grant select, insert on val_roster to anon;
grant select, insert, update, delete on val_roster to service_role;
