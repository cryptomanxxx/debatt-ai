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
create policy "Public insert" on snake_poang for insert with check (
  length(spelnamn) between 2 and 20 and poang >= 0 and poang <= 200
);
