-- Kör i Supabase SQL Editor

create table if not exists debatt_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  amne text,
  skapad timestamptz default now()
);

alter table debatt_events enable row level security;
create policy "anon_insert" on debatt_events for insert with check (true);
create policy "anon_select" on debatt_events for select using (true);
