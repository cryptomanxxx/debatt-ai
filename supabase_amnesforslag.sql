-- Kör i Supabase SQL Editor

create table if not exists amnesforslag (
  id uuid primary key default gen_random_uuid(),
  amne text not null,
  summering text,
  kalla text default 'direktdebatt',
  skapad timestamptz default now(),
  behandlad boolean default false
);

alter table amnesforslag enable row level security;
create policy "anon_insert" on amnesforslag for insert with check (true);
create policy "anon_select" on amnesforslag for select using (true);
create policy "anon_update" on amnesforslag for update using (true);

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
grant select, insert, update on amnesforslag to anon;
grant select, insert, update, delete on amnesforslag to service_role;
