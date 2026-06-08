-- supabase_mark_vara_auktioner.sql
-- Auktioner för råvaror: agenter budar på lots av producerade varor.
-- Priset emergerar underifrån — ingen formel, ingen fast prislista.
-- Kör i Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS mark_vara_auktioner (
  id              bigint generated always as identity primary key,
  saljare         text not null,
  vara            text not null,
  antal           integer not null default 3,
  reservpris      integer not null default 0,
  nuv_bud         integer,
  hogst_budgivare text,
  stanger_at      timestamptz not null,
  status          text not null default 'öppen',   -- öppen / avgjord / inställd
  skapad          timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS mark_vara_auktioner_status_idx
  ON mark_vara_auktioner (status, stanger_at);
CREATE INDEX IF NOT EXISTS mark_vara_auktioner_vara_idx
  ON mark_vara_auktioner (vara, status);

CREATE TABLE IF NOT EXISTS mark_vara_bud (
  id          bigint generated always as identity primary key,
  auktion_id  bigint not null references mark_vara_auktioner(id),
  budgivare   text not null,
  belopp      integer not null,
  skapad      timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS mark_vara_bud_auktion_idx ON mark_vara_bud (auktion_id);

-- RLS
ALTER TABLE mark_vara_auktioner ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Publik läsning mark_vara_auktioner" ON mark_vara_auktioner;
CREATE POLICY "Publik läsning mark_vara_auktioner"  ON mark_vara_auktioner FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service insert mark_vara_auktioner" ON mark_vara_auktioner;
CREATE POLICY "Service insert mark_vara_auktioner"  ON mark_vara_auktioner FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Service update mark_vara_auktioner" ON mark_vara_auktioner;
CREATE POLICY "Service update mark_vara_auktioner"  ON mark_vara_auktioner FOR UPDATE USING (true) WITH CHECK (true);

ALTER TABLE mark_vara_bud ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Publik läsning mark_vara_bud" ON mark_vara_bud;
CREATE POLICY "Publik läsning mark_vara_bud"  ON mark_vara_bud FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service insert mark_vara_bud" ON mark_vara_bud;
CREATE POLICY "Service insert mark_vara_bud"  ON mark_vara_bud FOR INSERT WITH CHECK (true);
