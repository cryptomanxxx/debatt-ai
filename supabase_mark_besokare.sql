-- visitor_wallets: plånböcker för anonyma besökare på Markartan
create table if not exists visitor_wallets (
  id           uuid    primary key default gen_random_uuid(),
  display_name text    unique not null,   -- t.ex. "Besökare-A3F2B1"
  saldo        integer not null default 2000 check (saldo >= 0),
  skapad       timestamptz not null default now(),
  senast_aktiv timestamptz not null default now()
);

alter table visitor_wallets enable row level security;

create policy "publik läsning visitor_wallets"
  on visitor_wallets for select using (true);

create policy "anon insert visitor_wallets"
  on visitor_wallets for insert with check (true);

create policy "anon update visitor_wallets"
  on visitor_wallets for update using (true);

-- Index för snabba uppslag på display_name (används vid auktionsstängning)
create index if not exists visitor_wallets_display_name_idx
  on visitor_wallets (display_name);
