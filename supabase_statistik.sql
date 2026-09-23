-- Kör detta i Supabase → SQL Editor

create table statistik (
  id          uuid primary key default gen_random_uuid(),
  nyckel      text not null unique,       -- t.ex. 'bnp_tillvaxt'
  namn        text not null,              -- t.ex. 'BNP-tillväxt'
  kategori    text not null,              -- 'ekonomi','klimat','arbetsmarknad','valfard'
  enhet       text,                       -- '%', 'ton/person', 'år'
  senaste_varde numeric,
  period      text,                       -- '2023', '2024-03'
  historik    jsonb default '[]',         -- [{period, varde}, ...]
  kalla       text,                       -- 'World Bank', 'Riksbanken'
  kalla_url   text,
  uppdaterad  timestamptz default now()
);

alter table statistik enable row level security;

create policy "Public read"
  on statistik for select
  using (true);

-- Agenter uppdaterar via service role (GitHub Actions) men anon-nyckeln
-- behöver insert/update-rättigheter för data_agent.py som körs med SUPABASE_ANON_KEY.
-- Om du hellre vill använda service role key i data_agent.py, skippa dessa:
create policy "Anon insert"
  on statistik for insert
  with check (true);

create policy "Anon update"
  on statistik for update
  using (true);

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
grant select, insert, update on statistik to anon;
grant select, insert, update, delete on statistik to service_role;
