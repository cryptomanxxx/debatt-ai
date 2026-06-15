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
