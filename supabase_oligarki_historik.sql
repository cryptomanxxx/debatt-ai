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
grant select on oligarki_historik to anon;
grant select, insert, update, delete on oligarki_historik to service_role;
