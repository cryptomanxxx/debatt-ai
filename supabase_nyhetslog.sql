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

-- Data API-grants (Supabase-krav från 30 okt 2026 — se CLAUDE.md): nya
-- tabeller i public-schemat behöver explicita GRANT-satser för att vara
-- nåbara via Data API (PostgREST/supabase-js) efter det datumet, annars
-- "permission denied" trots korrekta RLS-policies — Supabase slutar
-- auto-bevilja grundrättigheter på nya tabeller från och med då. GRANT
-- och RLS är två separata lager: GRANT avgör om ett anrop överhuvudtaget
-- tillåts nå tabellen, RLS-policies avgör sedan vilka RADER som är
-- synliga/skrivbara. anon beviljas här exakt de operationer som
-- tabellens egna RLS-policies redan tillåter (ingen ändring av
-- säkerhetsmodellen — bara att göra det GRANT auto-gav tidigare
-- explicit) — service_role beviljas alltid full CRUD, eftersom BYPASSRLS
-- bara kringgår radpolicies, inte detta grundläggande GRANT-lager.
-- Ingen grant till authenticated: plattformen har ingen Supabase Auth /
-- inloggade användare, så rollen är aldrig i bruk här.
grant select, insert, update, delete on nyhetslog to service_role;
