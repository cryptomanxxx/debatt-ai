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
grant select on nyhetsflode to anon;
grant select, insert, update, delete on nyhetsflode to service_role;
