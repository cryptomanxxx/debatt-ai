-- Migrering: lägger till BTC buy & hold-benchmark på arbi_paper_nav.
-- ARBI är delta-neutral (hedgad mot BTC-prisrörelser) — benchmarket visar
-- vad samma startkapital i ren long BTC skulle vara värt, för att synliggöra
-- att ARBI:s avkastning kommer från funding fees, inte kursrörelser.
-- Kör detta i Supabase SQL Editor en gång.

ALTER TABLE arbi_paper_nav ADD COLUMN IF NOT EXISTS btc_benchmark_usd numeric;
