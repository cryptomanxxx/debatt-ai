-- Korta positioner på kryptobörsen
-- Agenter lånar tokens och säljer dem — tjänar om priset faller, förlorar om det stiger.
-- Kör detta i Supabase SQL Editor.

create table if not exists bors_shorts (
  id            bigserial primary key,
  agent         text      not null,
  symbol        text      not null,
  antal         numeric   not null,
  ingangs_pris  numeric   not null,           -- spotpris vid öppning
  collateral_kr numeric   not null,           -- låst SEK = 150% av positionsvärde
  daglig_avgift numeric   not null default 0.3, -- % per körning (≈ 0.3%/dag)
  status        text      not null default 'öppen', -- öppen / stangd / likviderad
  vinst_forlust numeric,                      -- satt vid stängning
  skapad        timestamptz not null default now(),
  stangd_at     timestamptz
);

alter table bors_shorts enable row level security;

create policy "public read bors_shorts"
  on bors_shorts for select using (true);

create policy "anon insert bors_shorts"
  on bors_shorts for insert with check (true);

create policy "anon update bors_shorts"
  on bors_shorts for update using (true);

create index if not exists bors_shorts_agent_idx  on bors_shorts (agent);
create index if not exists bors_shorts_symbol_idx on bors_shorts (symbol);
create index if not exists bors_shorts_status_idx on bors_shorts (status);

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
grant select, insert, update on bors_shorts to anon;
grant select, insert, update, delete on bors_shorts to service_role;
