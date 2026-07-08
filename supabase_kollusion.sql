-- Kollusionsexperimentet — replikering av Davidsson (2012), SSRN 2248357,
-- "Community Investments and Collusion", på AI-agenter.
--
-- Pott-delningsspel i 3-spelarformat: alla satsar 2 kr (saldo_spel), rätt
-- gissare delar potten. Två spelformat per dag:
--   kollusion: ledare (LLM-bet) + följare (bettar alltid motsatt) + roterande offer
--   kontroll:  tre roterande ärliga agenter, inga kolluderare
-- Teoretisk prediktion: offer EV −0.5 kr/spel, kolluderare +0.25, kontroll 0.
--
-- Kör i Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS kollusion_spel (
  id           bigserial PRIMARY KEY,
  typ          text    NOT NULL CHECK (typ IN ('kollusion', 'kontroll')),
  symbol       text    NOT NULL,             -- BTC/ETH/SOL/XRP — myntet
  fraga        text    NOT NULL,             -- "Stänger BTC högre 2026-07-09 än föregående dag?"
  malda_datum  date    NOT NULL,             -- dagen vars stängning jämförs med föregående
  deltagare    jsonb   NOT NULL,             -- [{agent, bet, roll: ledare/foljare/offer/arlig}]
  utfall       text,                         -- 'ja'/'nej' när avgjort
  status       text    NOT NULL DEFAULT 'öppen',  -- öppen/avgjord
  ante         numeric NOT NULL DEFAULT 2,
  pott         numeric NOT NULL,
  payouts      jsonb,                        -- {agent: netto} efter avgörande
  skapad       timestamptz DEFAULT now(),
  avgjord_at   timestamptz
);

CREATE INDEX IF NOT EXISTS kollusion_spel_status_idx ON kollusion_spel (status);
CREATE INDEX IF NOT EXISTS kollusion_spel_skapad_idx ON kollusion_spel (skapad DESC);

ALTER TABLE kollusion_spel ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kollusion_spel_select" ON kollusion_spel;
CREATE POLICY "kollusion_spel_select" ON kollusion_spel FOR SELECT USING (true);
DROP POLICY IF EXISTS "kollusion_spel_insert" ON kollusion_spel;
CREATE POLICY "kollusion_spel_insert" ON kollusion_spel FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "kollusion_spel_update" ON kollusion_spel;
CREATE POLICY "kollusion_spel_update" ON kollusion_spel FOR UPDATE USING (true);
