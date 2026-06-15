-- Korta positioner på kryptobörsen
-- Agenter lånar tokens och säljer dem — tjänar om priset faller, förlorar om det stiger.
-- Kör detta i Supabase SQL Editor.

create table if not exists bors_shorts (
  id            bigserial primary key,
  agent         text      not null,
  symbol        text      not null,
  antal         numeric   not null,
  ingangs_pris  numeric   not null,           -- spotpris vid öppning
  collateral_kr numeric   not null,           -- låst SEK = 150% av positionsvärde
  daglig_avgift numeric   not null default 0.3, -- % per körning (≈ 0.3%/dag)
  status        text      not null default 'öppen', -- öppen / stangd / likviderad
  vinst_forlust numeric,                      -- satt vid stängning
  skapad        timestamptz not null default now(),
  stangd_at     timestamptz
);

alter table bors_shorts enable row level security;

create policy "public read bors_shorts"
  on bors_shorts for select using (true);

create policy "anon insert bors_shorts"
  on bors_shorts for insert with check (true);

create policy "anon update bors_shorts"
  on bors_shorts for update using (true);

create index if not exists bors_shorts_agent_idx  on bors_shorts (agent);
create index if not exists bors_shorts_symbol_idx on bors_shorts (symbol);
create index if not exists bors_shorts_status_idx on bors_shorts (status);
