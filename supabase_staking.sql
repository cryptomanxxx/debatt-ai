create table if not exists bors_staking (
  id bigserial primary key,
  agent text not null,
  symbol text not null,
  antal numeric not null,
  apy numeric not null default 0.05,
  start_datum date not null default current_date,
  slut_datum date not null,
  utbetald boolean not null default false,
  skapad timestamptz not null default now()
);
alter table bors_staking enable row level security;
create policy "public read bors_staking" on bors_staking for select using (true);
create policy "anon insert bors_staking" on bors_staking for insert with check (true);
create policy "anon update bors_staking" on bors_staking for update using (true);

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
grant select, insert, update on bors_staking to anon;
grant select, insert, update, delete on bors_staking to service_role;
