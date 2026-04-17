-- Kör detta i Supabase → SQL Editor

create table statistik (
  id          uuid primary key default gen_random_uuid(),
  nyckel      text not null unique,       -- t.ex. 'bnp_tillvaxt'
  namn        text not null,              -- t.ex. 'BNP-tillväxt'
  kategori    text not null,              -- 'ekonomi','klimat','arbetsmarknad','valfard'
  enhet       text,                       -- '%', 'ton/person', 'år'
  senaste_varde numeric,
  period      text,                       -- '2023', '2024-03'
  historik    jsonb default '[]',         -- [{period, varde}, ...]
  kalla       text,                       -- 'World Bank', 'Riksbanken'
  kalla_url   text,
  uppdaterad  timestamptz default now()
);

alter table statistik enable row level security;

create policy "Public read"
  on statistik for select
  using (true);

-- Agenter uppdaterar via service role (GitHub Actions) men anon-nyckeln
-- behöver insert/update-rättigheter för data_agent.py som körs med SUPABASE_ANON_KEY.
-- Om du hellre vill använda service role key i data_agent.py, skippa dessa:
create policy "Anon insert"
  on statistik for insert
  with check (true);

create policy "Anon update"
  on statistik for update
  using (true);
