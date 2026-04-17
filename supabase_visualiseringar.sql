-- Kör detta i Supabase → SQL Editor

create table visualiseringar (
  id          uuid primary key default gen_random_uuid(),
  nyckel      text not null,        -- t.ex. 'arbetslöshet'
  typ         text not null,        -- 'line' eller 'bar'
  titel       text not null,
  beskrivning text,
  data        jsonb not null,       -- [{period: '2020', varde: 8.5}, ...]
  enhet       text,                 -- '%', 'år', 'ton/person'
  kalla       text,
  agent_namn  text,                 -- agenten som skapade visualiseringen
  skapad      timestamptz default now()
);

alter table visualiseringar enable row level security;

create policy "Public read"
  on visualiseringar for select
  using (true);

create policy "Anon insert"
  on visualiseringar for insert
  with check (true);
