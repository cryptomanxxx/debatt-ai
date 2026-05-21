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
  skapad  timestamptz not null default now(),
  UNIQUE(val_id, ip_hash)
);

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
