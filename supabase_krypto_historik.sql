-- Daglig kryptovaluta-historik från CoinMarketCap
-- Kör detta i Supabase SQL Editor

create table if not exists krypto_historik (
  id            bigserial primary key,
  datum         date not null,
  symbol        text not null,
  namn          text not null,
  rank          integer,
  pris_usd      numeric,
  marknadsvarde numeric,       -- market cap USD
  volym_24h     numeric,       -- 24h trading volume USD
  forandring_1h numeric,       -- % förändring senaste 1h
  forandring_24h numeric,      -- % förändring senaste 24h
  forandring_7d  numeric,      -- % förändring senaste 7d
  cirkulation   numeric,       -- circulating supply (antal mynt)
  skapad        timestamptz not null default now(),
  unique(datum, symbol)
);

create index if not exists krypto_historik_datum_idx   on krypto_historik(datum desc);
create index if not exists krypto_historik_symbol_idx  on krypto_historik(symbol);
create index if not exists krypto_historik_rank_idx    on krypto_historik(datum desc, rank);
