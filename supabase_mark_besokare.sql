-- visitor_wallets: plånböcker för anonyma besökare på Markartan
create table if not exists visitor_wallets (
  id           uuid    primary key default gen_random_uuid(),
  display_name text    unique not null,   -- t.ex. "Besökare-A3F2B1"
  saldo        integer not null default 2000 check (saldo >= 0),
  skapad       timestamptz not null default now(),
  senast_aktiv timestamptz not null default now()
);

alter table visitor_wallets enable row level security;

create policy "publik läsning visitor_wallets"
  on visitor_wallets for select using (true);

create policy "anon insert visitor_wallets"
  on visitor_wallets for insert with check (true);

-- Saldo-ändringar görs via server-side API-routes som validerar identitet
-- (besokare_id UUID måste matcha display_name i databasen innan åtgärd).
-- Direkt REST-åtkomst med anon-nyckeln kan inte höja saldo mer än
-- startbeloppet 2000 kr tack vare check-constraint på kolumnen.
create policy "anon update visitor_wallets"
  on visitor_wallets for update using (true) with check (saldo >= 0);

-- Index för snabba uppslag på display_name (används vid auktionsstängning)
create index if not exists visitor_wallets_display_name_idx
  on visitor_wallets (display_name);

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
grant select, insert, update on visitor_wallets to anon;
grant select, insert, update, delete on visitor_wallets to service_role;
