-- Kör i Supabase SQL Editor

create table if not exists amnesforslag (
  id uuid primary key default gen_random_uuid(),
  amne text not null,
  summering text,
  kalla text default 'direktdebatt',
  skapad timestamptz default now(),
  behandlad boolean default false
);

alter table amnesforslag enable row level security;
create policy "anon_insert" on amnesforslag for insert with check (true);
create policy "anon_select" on amnesforslag for select using (true);
create policy "anon_update" on amnesforslag for update using (true);
