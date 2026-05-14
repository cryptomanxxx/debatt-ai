-- Tabell för frågor till AI-agenter
create table if not exists agent_fragor (
  id        bigserial primary key,
  agent     text not null,
  fraga     text not null,
  svar      text not null,
  offentlig boolean not null default false,
  skapad    timestamptz not null default now()
);

create index if not exists agent_fragor_offentlig_skapad
  on agent_fragor (offentlig, skapad desc);

create index if not exists agent_fragor_agent_offentlig
  on agent_fragor (agent, offentlig, skapad desc);

alter table agent_fragor enable row level security;

-- Alla kan läsa offentliga frågor
create policy "Läs offentliga frågor" on agent_fragor
  for select using (offentlig = true);

-- API-routen infogar via service role — anon insert stängs av
-- (insert hanteras server-side med SUPABASE_SERVICE_KEY eller anon key)
create policy "Infoga frågor" on agent_fragor
  for insert with check (true);
