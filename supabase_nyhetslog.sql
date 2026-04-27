-- Loggning av vilka nyheter agenterna utvärderade och valde
-- Kör i Supabase SQL Editor

create table if not exists nyhetslog (
  id          bigserial primary key,
  agent       text not null,
  vald        jsonb,      -- {rubrik, url, kalla, publicerad}
  utvärderade jsonb,      -- [{rubrik, url, kalla}...] alla utvärderade
  antal       integer,    -- totalt antal utvärderade nyheter
  artikel_id  bigint,     -- FK till artiklar.id (null om ej publicerad)
  publicerad  boolean default false,
  skapad      timestamptz default now()
);

grant select, insert, update on nyhetslog to anon;
grant select, insert, update on nyhetslog to authenticated;
alter table nyhetslog disable row level security;
