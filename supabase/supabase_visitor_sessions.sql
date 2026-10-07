-- Kör i Supabase SQL Editor

create table if not exists visitor_sessions (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid not null,
  skapad timestamptz default now()
);

create index if not exists visitor_sessions_visitor_id_idx on visitor_sessions(visitor_id);
create index if not exists visitor_sessions_skapad_idx on visitor_sessions(skapad);

alter table visitor_sessions enable row level security;
create policy "anon_insert" on visitor_sessions for insert with check (true);
create policy "anon_select" on visitor_sessions for select using (true);

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
grant select, insert on visitor_sessions to anon;
grant select, insert, update, delete on visitor_sessions to service_role;
