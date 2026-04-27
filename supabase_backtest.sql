-- Backtest-resultat för trading-strategier
-- Kör detta i Supabase SQL Editor

create table if not exists backtest_resultat (
  id                 bigserial primary key,
  symbol             text not null,
  strategi           text not null,        -- t.ex. "vol10+pris10_exit3d"
  period_start       date not null,
  period_slut        date not null,
  antal_trades       integer not null,
  vinstrate          numeric,              -- % trades med positiv avkastning
  avg_avkastning     numeric,              -- genomsnittlig avkastning per trade %
  total_avkastning   numeric,              -- sammansatt total avkastning %
  buyhold_avkastning numeric,              -- buy & hold avkastning % samma period
  sharpe             numeric,              -- förenklad Sharpe-ratio
  max_drawdown       numeric,              -- maximal drawdown % på hela perioden
  kord               timestamptz not null default now(),
  unique(symbol, strategi)
);

alter table backtest_resultat disable row level security;
