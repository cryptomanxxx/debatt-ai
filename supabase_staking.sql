create table if not exists bors_staking (
  id bigserial primary key,
  agent text not null,
  symbol text not null,
  antal numeric not null,
  apy numeric not null default 0.05,
  start_datum date not null default current_date,
  slut_datum date not null,
  utbetald boolean not null default false,
  skapad timestamptz not null default now()
);
alter table bors_staking enable row level security;
create policy "public read bors_staking" on bors_staking for select using (true);
create policy "anon insert bors_staking" on bors_staking for insert with check (true);
create policy "anon update bors_staking" on bors_staking for update using (true);
