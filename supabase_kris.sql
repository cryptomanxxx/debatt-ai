-- Krisevents: externa chocker som påverkar agenternas beteende och artikelproduktion
-- Kör detta i Supabase SQL Editor

CREATE TABLE IF NOT EXISTS kris_events (
  id          bigint generated always as identity primary key,
  typ         text not null,            -- "borskrasch", "pandemi", "politisk_skandal" osv.
  rubrik      text not null,
  beskrivning text not null,
  kontext_prompt text not null,         -- injiceras i systemprompt för berörda agenter
  intensitet  int  not null default 1   -- 1=Lokal, 2=National, 3=Global
              check (intensitet between 1 and 3),
  aktiv       bool not null default true,
  paverkade_agenter text[] not null default '{}',
  startat     timestamptz not null default now(),
  slutar      timestamptz,
  skapad      timestamptz not null default now()
);

-- RLS
ALTER TABLE kris_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publik läsning kris"    ON kris_events FOR SELECT USING (true);
CREATE POLICY "Service insert kris"    ON kris_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update kris"    ON kris_events FOR UPDATE USING (true) WITH CHECK (true);

-- Index
CREATE INDEX IF NOT EXISTS kris_events_aktiv_idx  ON kris_events (aktiv, skapad DESC);
CREATE INDEX IF NOT EXISTS kris_events_typ_idx    ON kris_events (typ);
