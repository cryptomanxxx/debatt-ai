-- Lägg till optimeringskolumner i backtest_resultat
-- Kör detta i Supabase SQL Editor

alter table backtest_resultat
  add column if not exists vol_multiplikator       numeric default 1.0,
  add column if not exists lookback                integer default 10,
  add column if not exists stoploss_pct            numeric,
  add column if not exists transaktionskostnad_pct numeric default 0.0,
  add column if not exists regim_filter            boolean default false,
  add column if not exists kelly_fraction          numeric,
  add column if not exists equity_kurva            jsonb;

-- Töm gamla resultat (gammal namnstandard stämmer inte med ny)
truncate table backtest_resultat;
