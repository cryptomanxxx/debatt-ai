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
grant select on backtest_resultat to anon;
grant select, insert, update, delete on backtest_resultat to service_role;
