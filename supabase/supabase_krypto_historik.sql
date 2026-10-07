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

-- Data API-grants (Supabase-krav från 30 okt 2026 — se CLAUDE.md): nya
-- tabeller i public-schemat behöver explicita GRANT-satser för att vara
-- nåbara via Data API (PostgREST/supabase-js) efter det datumet, annars
-- "permission denied" trots korrekta RLS-policies — Supabase slutar
-- auto-bevilja grundrättigheter på nya tabeller från och med då. GRANT
-- och RLS är två separata lager: GRANT avgör om ett anrop överhuvudtaget
-- tillåts nå tabellen, RLS-policies avgör sedan vilka RADER som är
-- synliga/skrivbara. anon beviljas här exakt de operationer som
-- tabellens egna RLS-policies redan tillåter (ingen ändring av
-- säkerhetsmodellen — bara att göra det GRANT auto-gav tidigare
-- explicit) — service_role beviljas alltid full CRUD, eftersom BYPASSRLS
-- bara kringgår radpolicies, inte detta grundläggande GRANT-lager.
-- Ingen grant till authenticated: plattformen har ingen Supabase Auth /
-- inloggade användare, så rollen är aldrig i bruk här.
grant select on krypto_historik to anon;
grant select, insert, update, delete on krypto_historik to service_role;
