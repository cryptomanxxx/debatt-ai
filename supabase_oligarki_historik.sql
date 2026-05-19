-- Dagliga oligarki-snapshots för tidsserieanalys
-- Kör i Supabase SQL Editor

create table if not exists oligarki_historik (
  id         bigserial primary key,
  datum      date        not null unique,
  gini       numeric(6,4) not null,
  oligarki_risk integer  not null,
  top3_andel numeric(6,4) not null,
  mobilitet  integer     not null,
  dynasti_index integer  not null,
  lobby_loop boolean     not null default false,
  bet_loop   boolean     not null default false,
  topp_agent text,
  skapad     timestamptz not null default now()
);

-- Publik läsning för frontend
alter table oligarki_historik enable row level security;
create policy "public read" on oligarki_historik for select using (true);

-- Index för tidsseriesortering
create index if not exists oligarki_historik_datum_idx on oligarki_historik (datum);
