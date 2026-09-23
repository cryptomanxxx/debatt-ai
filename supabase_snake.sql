create table if not exists snake_poang (
  id          bigserial primary key,
  spelnamn    text not null,
  agent_namn  text not null,
  poang       integer not null,
  vann        boolean not null default false,
  skapad      timestamptz not null default now()
);
alter table snake_poang enable row level security;
create policy "Public read" on snake_poang for select using (true);
-- Ta bort eventuell gammal permissiv insert-policy innan vi skapar den restriktiva.
-- RLS insert-policies är permissiva — om båda finns vinner den öppna.
drop policy if exists "Public insert" on snake_poang;
-- Insert hanteras av /api/snake-poang (service role) och snake_test.py (service role).
-- Anon-nyckeln (exponerad i klienten) får inte skriva direkt — förhindrar manipulation av topplistan.
create policy "Service insert only" on snake_poang for insert with check (false);

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
grant select on snake_poang to anon;
grant select, insert, update, delete on snake_poang to service_role;
