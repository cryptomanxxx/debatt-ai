create table if not exists snake_poang (
  id          bigserial primary key,
  spelnamn    text not null,
  agent_namn  text not null,
  poang       integer not null,
  vann        boolean not null default false,
  skapad      timestamptz not null default now()
);
alter table snake_poang enable row level security;
create policy "Public read" on snake_poang for select using (true);
-- Insert hanteras av /api/snake-poang (service role) och snake_test.py (service role).
-- Anon-nyckeln (exponerad i klienten) får inte skriva direkt — förhindrar manipulation av topplistan.
create policy "Service insert only" on snake_poang for insert with check (false);
