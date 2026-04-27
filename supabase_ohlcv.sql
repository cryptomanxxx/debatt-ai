-- Tabell för cachad OHLCV-data (populeras av backtest_fetch.py)
-- Kör i Supabase SQL Editor

create table if not exists ohlcv_cache (
  symbol text    not null,
  datum  date    not null,
  pris   numeric not null,
  vol    numeric not null,
  primary key (symbol, datum)
);
