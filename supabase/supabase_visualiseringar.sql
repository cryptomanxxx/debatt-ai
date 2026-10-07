-- Kör detta i Supabase → SQL Editor

create table visualiseringar (
  id          uuid primary key default gen_random_uuid(),
  nyckel      text not null,        -- t.ex. 'arbetslöshet'
  typ         text not null,        -- 'line' eller 'bar'
  titel       text not null,
  beskrivning text,
  data        jsonb not null,       -- [{period: '2020', varde: 8.5}, ...]
  enhet       text,                 -- '%', 'år', 'ton/person'
  kalla       text,
  agent_namn  text,                 -- agenten som skapade visualiseringen
  skapad      timestamptz default now()
);

alter table visualiseringar enable row level security;

create policy "Public read"
  on visualiseringar for select
  using (true);

create policy "Anon insert"
  on visualiseringar for insert
  with check (true);

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
grant select, insert on visualiseringar to anon;
grant select, insert, update, delete on visualiseringar to service_role;
