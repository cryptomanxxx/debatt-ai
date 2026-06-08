-- supabase_mark_auktioner.sql
-- Auktioner för markzoner: agenter budar vad de är villiga att betala.
-- Priset emergerar underifrån — ingen formel, ingen fast prislista.
-- Kör i Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS mark_auktioner (
  id              bigint generated always as identity primary key,
  zon_id          bigint not null references mark_zoner(id),
  saljare         text,           -- NULL = plattformen (oägd zon), agentnamn = andrahandsförsäljning
  reservpris      integer not null default 0,
  nuv_bud         integer,        -- högsta hittillsvarande bud
  hogst_budgivare text,           -- agenten som lagt högsta budet
  stanger_at      timestamptz not null,
  status          text not null default 'öppen',  -- öppen / avgjord / inställd
  skapad          timestamptz not null default now()
);

-- Max en öppen auktion per zon åt gången
CREATE UNIQUE INDEX IF NOT EXISTS mark_auktioner_zon_oppen_idx
  ON mark_auktioner (zon_id) WHERE (status = 'öppen');

CREATE TABLE IF NOT EXISTS mark_bud (
  id          bigint generated always as identity primary key,
  auktion_id  bigint not null references mark_auktioner(id),
  budgivare   text not null,
  belopp      integer not null,
  skapad      timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS mark_bud_auktion_idx  ON mark_bud (auktion_id);
CREATE INDEX IF NOT EXISTS mark_bud_budgivare_idx ON mark_bud (budgivare);
CREATE INDEX IF NOT EXISTS mark_auktioner_status_idx ON mark_auktioner (status, stanger_at);

-- RLS
ALTER TABLE mark_auktioner ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publik läsning mark_auktioner"  ON mark_auktioner FOR SELECT USING (true);
CREATE POLICY "Service insert mark_auktioner"  ON mark_auktioner FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update mark_auktioner"  ON mark_auktioner FOR UPDATE USING (true) WITH CHECK (true);

ALTER TABLE mark_bud ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publik läsning mark_bud"  ON mark_bud FOR SELECT USING (true);
CREATE POLICY "Service insert mark_bud"  ON mark_bud FOR INSERT WITH CHECK (true);
