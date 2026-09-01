-- Nyhetsflödet — transparens över vilka nyheter plattformen automatiskt
-- hämtar varje dag (RSS/Reddit/YouTube), oavsett om en agent någonsin
-- skriver om dem. Skiljer sig från nyhetslog, som bara loggar EN agents
-- redan bubbel-filtrerade urval per körning (max 60 poster, en delmängd).
-- Kör i Supabase SQL Editor.

create table if not exists nyhetsflode (
  id          bigserial primary key,
  rubrik      text not null,
  beskrivning text,
  kalla       text not null,
  url         text not null,
  publicerad  text,           -- rått pubDate/published-strängvärde från källan, oparsat
  kategori    text[] default '{}',
  hamtad      timestamptz default now(),
  unique(url)
);

create index if not exists nyhetsflode_hamtad_idx on nyhetsflode (hamtad desc);
create index if not exists nyhetsflode_kategori_idx on nyhetsflode using gin (kategori);

alter table nyhetsflode enable row level security;
create policy "nyhetsflode_select" on nyhetsflode for select using (true);
-- Ingen INSERT/UPDATE-policy för anon — RLS blockerar anon-skrivning som
-- standard utan en matchande policy. Skrivning sker uteslutande via
-- SUPABASE_SERVICE_ROLE_KEY i nyhetsflode_test.py.
