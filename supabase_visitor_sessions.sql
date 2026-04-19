-- Kör i Supabase SQL Editor

create table if not exists visitor_sessions (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid not null,
  skapad timestamptz default now()
);

create index if not exists visitor_sessions_visitor_id_idx on visitor_sessions(visitor_id);
create index if not exists visitor_sessions_skapad_idx on visitor_sessions(skapad);

alter table visitor_sessions enable row level security;
create policy "anon_insert" on visitor_sessions for insert with check (true);
create policy "anon_select" on visitor_sessions for select using (true);
