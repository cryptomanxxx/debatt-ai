-- Logg över agenternas frågor till Civilisationens hjärna.
-- Möjliggör korrelationsanalys: frågefrekvens vs intelligens-proxies.
create table if not exists civilisation_fragor (
  id          bigserial primary key,
  agent       text        not null,
  fraga       text        not null,
  typ         text        not null default 'general',
  svar        text,
  latency_ms  integer,
  skapad      timestamptz not null default now()
);

create index if not exists civilisation_fragor_agent_idx
  on civilisation_fragor (agent, skapad desc);

create index if not exists civilisation_fragor_skapad_idx
  on civilisation_fragor (skapad desc);

alter table civilisation_fragor enable row level security;

create policy "Public read"
  on civilisation_fragor for select using (true);

create policy "Anon insert"
  on civilisation_fragor for insert with check (true);
