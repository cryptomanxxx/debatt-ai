-- Liquidity mining-log för kryptobörsen
-- Agenter som har öppna köp- och säljordrar nära spotpriset belönas med SEK per körning.
-- Kör detta i Supabase SQL Editor innan liquidity mining aktiveras.

create table if not exists bors_liquidity_log (
  id         bigserial primary key,
  agent      text      not null,
  symbol     text      not null,
  beloning   numeric   not null default 1.5,
  spread_pct numeric,                          -- spread (ask-bid)/spot i procent
  skapad     timestamptz not null default now()
);

alter table bors_liquidity_log enable row level security;

create policy "public read bors_liquidity_log"
  on bors_liquidity_log for select using (true);

create policy "anon insert bors_liquidity_log"
  on bors_liquidity_log for insert with check (true);

-- Index för snabb agent-lookup och tidsbaserad sortering
create index if not exists bors_liquidity_log_agent_idx  on bors_liquidity_log (agent);
create index if not exists bors_liquidity_log_skapad_idx on bors_liquidity_log (skapad desc);

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
grant select, insert on bors_liquidity_log to anon;
grant select, insert, update, delete on bors_liquidity_log to service_role;
